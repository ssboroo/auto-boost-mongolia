import { Injectable } from '@nestjs/common'
import { TenantService } from '../meta/tenant.service'

type CheckStatus = 'READY' | 'WARNING' | 'ERROR'
type Check = { key: string; label: string; status: CheckStatus; detail: string; action?: string }

@Injectable()
export class PrelaunchService {
  constructor(private readonly tenant: TenantService) {}

  private check(key: string, label: string, status: CheckStatus, detail: string, action?: string): Check {
    return { key, label, status, detail, ...(action ? { action } : {}) }
  }

  async run(req: any) {
    const context = await this.tenant.requireContext(req)
    if (!['owner', 'admin'].includes(String(context.role || '').toLowerCase())) {
      throw new Error('Admin эсвэл owner эрх шаардлагатай.')
    }

    const checks: Check[] = []
    const frontend = process.env.FRONTEND_ORIGIN || ''
    const redirect = process.env.META_REDIRECT_URI || ''
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const graphVersion = process.env.META_GRAPH_VERSION || 'v25.0'

    checks.push(this.check('meta_app', 'Meta App ID + Secret', process.env.META_APP_ID && process.env.META_APP_SECRET ? 'READY' : 'ERROR', process.env.META_APP_ID && process.env.META_APP_SECRET ? 'Meta App credentials backend дээр байна.' : 'META_APP_ID эсвэл META_APP_SECRET дутуу.', 'Vercel backend environment variables шалгах'))
    checks.push(this.check('session_secret', 'Session encryption secret', process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32 ? 'READY' : 'ERROR', process.env.SESSION_SECRET ? 'SESSION_SECRET тохируулагдсан.' : 'SESSION_SECRET байхгүй.', '32+ тэмдэгт random secret тохируулах'))
    checks.push(this.check('meta_graph', 'Meta Graph version', /^v\d+\.\d+$/.test(graphVersion) ? 'READY' : 'WARNING', `Graph API: ${graphVersion}`))

    const expectedRedirect = frontend ? `${frontend.replace(/\/$/, '')}/api/meta/auth/callback` : ''
    checks.push(this.check('oauth_redirect', 'OAuth redirect URL', redirect.startsWith('https://') && (!expectedRedirect || redirect === expectedRedirect) ? 'READY' : 'ERROR', redirect || 'META_REDIRECT_URI байхгүй.', expectedRedirect && redirect !== expectedRedirect ? `Expected: ${expectedRedirect}` : undefined))
    checks.push(this.check('frontend_origin', 'Frontend production URL', frontend.startsWith('https://') ? 'READY' : 'ERROR', frontend || 'FRONTEND_ORIGIN байхгүй.'))

    checks.push(this.check('supabase_keys', 'Supabase credentials', supabaseUrl && process.env.SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY ? 'READY' : 'ERROR', supabaseUrl ? 'Supabase URL болон backend keys шалгагдлаа.' : 'Supabase config дутуу.', 'SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY шалгах'))

    if (supabaseUrl && process.env.SUPABASE_PUBLISHABLE_KEY) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, { headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY}` }, signal: AbortSignal.timeout(6000) })
        checks.push(this.check('supabase_reachable', 'Supabase API', response.ok ? 'READY' : 'ERROR', response.ok ? `Supabase reachable · HTTP ${response.status}` : `Supabase HTTP ${response.status}`))
      } catch (e: any) {
        checks.push(this.check('supabase_reachable', 'Supabase API', 'ERROR', `Supabase холбогдсонгүй: ${e?.message || 'network error'}`))
      }
    } else checks.push(this.check('supabase_reachable', 'Supabase API', 'ERROR', 'Config байхгүй тул connectivity шалгаж чадсангүй.'))

    const paymentConfig = Boolean(process.env.WIRE_API_KEY)
    checks.push(this.check('payment_api', 'Payment API key', paymentConfig ? 'READY' : 'ERROR', paymentConfig ? 'Payment provider API key backend дээр байна.' : 'Payment API key дутуу.', 'WIRE_API_KEY тохируулах'))
    checks.push(this.check('payment_webhook_secret', 'Payment webhook secret', process.env.WIRE_WEBHOOK_SECRET ? 'READY' : 'ERROR', process.env.WIRE_WEBHOOK_SECRET ? 'Webhook signature secret тохируулагдсан.' : 'WIRE_WEBHOOK_SECRET байхгүй.'))
    checks.push(this.check('payment_webhook_ip', 'Webhook source IP allowlist', process.env.WIRE_WEBHOOK_IP ? 'READY' : 'WARNING', process.env.WIRE_WEBHOOK_IP || 'Default IP fallback ашиглагдаж байна.', 'Production дээр WIRE_WEBHOOK_IP-г explicit тохируулах'))

    try {
      const response = await fetch('https://www.mongolbank.mn/en/', { headers: { 'User-Agent': 'AutoBoostMongolia-Prelaunch/1.0' }, signal: AbortSignal.timeout(7000) })
      checks.push(this.check('fx_source', 'Монголбанк FX source', response.ok ? 'READY' : 'WARNING', response.ok ? `Монголбанк reachable · HTTP ${response.status}` : `Монголбанк HTTP ${response.status}`, response.ok ? undefined : 'Fallback USD/MNT rate зөв эсэхийг admin дээр шалгах'))
    } catch (e: any) {
      checks.push(this.check('fx_source', 'Монголбанк FX source', 'WARNING', `Live FX source reachable биш: ${e?.message || 'network error'}`, 'Fallback USD/MNT rate/date зөв эсэхийг шалгах'))
    }

    let metaConnected = false
    try {
      const connection = await this.tenant.getConnection(req)
      metaConnected = Boolean(connection.connection && connection.metaToken)
    } catch {}
    checks.push(this.check('meta_connection', 'Тест Facebook connection', metaConnected ? 'READY' : 'WARNING', metaConnected ? 'Энэ workspace дээр Meta OAuth connection байна.' : 'Тест workspace дээр Facebook холболт алга.', 'Facebook холбож readiness flow тестлэх'))

    const errors = checks.filter((c) => c.status === 'ERROR').length
    const warnings = checks.filter((c) => c.status === 'WARNING').length
    const ready = checks.filter((c) => c.status === 'READY').length
    const overall: CheckStatus = errors > 0 ? 'ERROR' : warnings > 0 ? 'WARNING' : 'READY'

    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'system.prelaunch_check', 'system', null, { overall, ready, warnings, errors })

    return { overall, summary: { ready, warnings, errors, total: checks.length }, checks, checkedAt: new Date().toISOString() }
  }
}
