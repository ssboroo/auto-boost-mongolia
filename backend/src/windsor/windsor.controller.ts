import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { WindsorService } from './windsor.service'

@Controller('meta')
export class WindsorController {
  constructor(private readonly windsor: WindsorService) {}

  @Get('status')
  status() {
    return this.windsor.getStatus()
  }

  @Get('connect-info')
  connectInfo() {
    return this.windsor.getConnectInfo()
  }

  @Get('accounts')
  accounts() {
    return this.windsor.listAccounts()
  }

  @Get('actions')
  actions() {
    return this.windsor.listActions()
  }

  @Post('actions/execute')
  execute(@Body() body: { action: string; params?: Record<string, unknown>; account?: string }) {
    return this.windsor.executeAction(body.action, body.params || {}, body.account)
  }

  @Get('report')
  report(@Query('fields') fields = 'account_id,account_name,campaign,clicks,spend,date', @Query('date_preset') datePreset = 'last_7d') {
    return this.windsor.queryFacebook(fields.split(',').map(x => x.trim()).filter(Boolean), { date_preset: datePreset })
  }
}
