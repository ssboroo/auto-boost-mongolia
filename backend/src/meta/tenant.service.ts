import { Injectable, UnauthorizedException, BadGatewayException } from '@nestjs/common'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

export type AppUser = { id: string; email?: string }
export type WorkspaceContext = { workspaceId: string; role: string; user: AppUser; appToken: string }

@Injectable()
export class TenantService {
  private readonly supabaseUrl = process.env.SUPABASE_URL || 'https://rnujhqmtusuddxygarto.supabase.co'
  private readonly supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_OXj1FlWu2QkUM9A2XSIR1Q_ZYcSJ3ob'

  getAppToken(req: any) {
    return String(req?.headers?.['x-app-access-token'] || '').trim()
  }

  private cryptoKey() {
    const secret = process.env.SESSION_SECRET || ''
    if (!secret) throw new UnauthorizedException('SESSION_SECRET тохируулаагүй байна.')
    return createHash('sha256').update(secret).digest()
  }

  encrypt(value: string) {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.cryptoKey(), iv)
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv, tag, encrypted]).toString('base64url')
  }

  decrypt(value: string) {
    if (!value) return ''
    try {
      const payload = Buffer.from(value, 'base64url')
      const iv = payload.subarray(0, 12)
      const tag = payload.subarray(12, 28)
      const encrypted = payload.subarray(28)
      const decipher = createDecipheriv('aes-256-gcm', this.cryptoKey(), iv)
      decipher.setAuthTag(tag)
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
    } catch {
      return ''
    }
  }

  async requireUserByToken(appToken: string): Promise<AppUser> {
    if (!appToken) throw new UnauthorizedException('Auto Boost хэрэглэгчийн session шаардлагатай.')
    const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: this.supabaseKey,
        Authorization: `Bearer ${appToken}`,
        Accept: 'application/json',
      },
    })
    if (!response.ok) throw new UnauthorizedException('Auto Boost хэрэглэгчийн session хүчингүй эсвэл дууссан байна.')
    const data: any = await response.json()
    if (!data?.id) throw new UnauthorizedException('Хэрэглэгчийн мэдээлэл олдсонгүй.')
    return { id: data.id, email: data.email }
  }

  async requireContext(req: any): Promise<WorkspaceContext> {
    const appToken = this.getAppToken(req)
    const user = await this.requireUserByToken(appToken)
    const rows = await this.rest<any[]>(appToken, `/rest/v1/workspace_members?select=workspace_id,role&user_id=eq.${encodeURIComponent(user.id)}&limit=1`)
    const membership = rows?.[0]
    if (!membership?.workspace_id) throw new UnauthorizedException('Workspace олдсонгүй.')
    return { workspaceId: membership.workspace_id, role: membership.role, user, appToken }
  }

  async getConnection(req: any) {
    const context = await this.requireContext(req)
    const rows = await this.rest<any[]>(context.appToken, `/rest/v1/meta_connections?select=id,workspace_id,meta_user_id,meta_user_name,access_token_ciphertext,token_expires_at,connected_at,updated_at&workspace_id=eq.${encodeURIComponent(context.workspaceId)}&limit=1`)
    const connection = rows?.[0]
    if (!connection) return { context, connection: null, metaToken: '' }
    const metaToken = this.decrypt(connection.access_token_ciphertext || '')
    return { context, connection, metaToken }
  }

  async requireMetaToken(req: any) {
    const result = await this.getConnection(req)
    if (!result.connection || !result.metaToken) throw new UnauthorizedException('Facebook холболт хийгдээгүй байна.')
    if (result.connection.token_expires_at && new Date(result.connection.token_expires_at).getTime() <= Date.now()) {
      throw new UnauthorizedException('Facebook access token-ийн хугацаа дууссан байна. Дахин холбоно уу.')
    }
    return { ...result, metaToken: result.metaToken }
  }

  async saveConnection(appToken: string, user: AppUser, metaToken: string, profile: any, expiresInSeconds?: number) {
    const rows = await this.rest<any[]>(appToken, `/rest/v1/workspace_members?select=workspace_id,role&user_id=eq.${encodeURIComponent(user.id)}&limit=1`)
    const workspaceId = rows?.[0]?.workspace_id
    if (!workspaceId) throw new UnauthorizedException('Workspace олдсонгүй.')

    const tokenExpiresAt = expiresInSeconds
      ? new Date(Date.now() + Number(expiresInSeconds) * 1000).toISOString()
      : null

    await this.rest(appToken, `/rest/v1/meta_connections?on_conflict=workspace_id`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        meta_user_id: profile?.id || null,
        meta_user_name: profile?.name || null,
        access_token_ciphertext: this.encrypt(metaToken),
        token_expires_at: tokenExpiresAt,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    })

    await this.writeAudit(appToken, workspaceId, user.id, 'meta.connected', 'meta_connection', profile?.id || null, {
      meta_user_name: profile?.name || null,
    })

    return { workspaceId, tokenExpiresAt }
  }

  async disconnect(req: any) {
    const context = await this.requireContext(req)
    await this.rest(context.appToken, `/rest/v1/meta_connections?workspace_id=eq.${encodeURIComponent(context.workspaceId)}`, { method: 'DELETE' })
    await this.writeAudit(context.appToken, context.workspaceId, context.user.id, 'meta.disconnected', 'meta_connection', null, {})
    return { ok: true }
  }

  async writeAudit(appToken: string, workspaceId: string, userId: string, action: string, entityType: string | null, entityId: string | null, metadata: Record<string, unknown>) {
    try {
      await this.rest(appToken, '/rest/v1/audit_logs', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          metadata,
        }),
      })
    } catch {
      // Audit failure must not break the primary action.
    }
  }

  private async rest<T = any>(appToken: string, path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.supabaseUrl}${path}`, {
      ...init,
      headers: {
        apikey: this.supabaseKey,
        Authorization: `Bearer ${appToken}`,
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    })
    const text = await response.text()
    let data: any = null
    try { data = text ? JSON.parse(text) : null } catch { data = text }
    if (!response.ok) {
      throw new BadGatewayException({ message: 'Supabase data хүсэлт амжилтгүй боллоо.', status: response.status, detail: data?.message || data })
    }
    return data as T
  }
}
