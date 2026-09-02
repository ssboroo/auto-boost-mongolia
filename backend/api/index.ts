import 'reflect-metadata'
import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/app.module'

let serverPromise: Promise<any> | null = null

async function createServer() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] })

  const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
  app.enableCors({
    origin: allowedOrigin,
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
