import 'reflect-metadata'
import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/app.module'

let serverPromise: Promise<any> | null = null

async function createServer() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] })

  const configuredOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
  app.enableCors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      const isConfigured = origin === configuredOrigin
      const isProduction = origin === 'https://auto-boost-mongolia.vercel.app'
      const isPreview = /^https:\/\/auto-boost-[a-z0-9-]+-ssboroostore-6768\.vercel\.app$/i.test(origin)
      const isLocal = /^http:\/\/localhost:\d+$/.test(origin)

      if (isConfigured || isProduction || isPreview || isLocal) return callback(null, true)
      return callback(new Error(`CORS origin not allowed: ${origin}`), false)
    },
    credentials: true,
  })

  await app.init()
  return app.getHttpAdapter().getInstance()
}

export default async function handler(req: any, res: any) {
  if (!serverPromise) serverPromise = createServer()
  const server = await serverPromise
  return server(req, res)
}
