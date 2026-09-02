import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      ok: true,
      service: 'auto-boost-mongolia-api',
      message: 'Auto Boost Mongolia API is running',
      health: '/health',
      metaStatus: '/meta/status',
    }
  }

  @Get('health')
  health() {
    return {
      ok: true,
      service: 'auto-boost-mongolia-api',
      timestamp: new Date().toISOString(),
    }
  }
}
