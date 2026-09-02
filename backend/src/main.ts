import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true })
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000' })
  await app.listen(Number(process.env.PORT || 4000))
}
bootstrap()
