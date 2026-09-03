import { Controller, Get, Req } from '@nestjs/common'
import { PrelaunchService } from './prelaunch.service'

@Controller('system')
export class PrelaunchController {
  constructor(private readonly prelaunch: PrelaunchService) {}

  @Get('prelaunch')
  run(@Req() req: any) {
    return this.prelaunch.run(req)
  }
}
