import { Controller, Get, Req } from '@nestjs/common'
import { MetaReadinessService } from './meta-readiness.service'

@Controller('meta')
export class MetaReadinessController {
  constructor(private readonly readiness: MetaReadinessService) {}

  @Get('readiness')
  getReadiness(@Req() req: any) {
    return this.readiness.getReadiness(req)
  }
}
