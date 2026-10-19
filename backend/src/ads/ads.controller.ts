import { AdliftrService } from './adliftr.service'
import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import { AdsService } from './ads.service'
import { CampaignRequest } from './ads.types'

@Controller('ads')
export class AdsController {
  constructor(private readonly ads: AdsService, private readonly adliftr: AdliftrService) {}

  @Get('adliftr/status')
  adliftrStatus(@Req() req: any) { return this.adliftr.status(req) }

  @Get('adliftr/workspaces')
  adliftrWorkspaces(@Req() req: any) { return this.adliftr.workspaces(req) }

  @Get('providers')
  providers(@Req() req: any) {
    return this.ads.providers(req)
  }

  @Post('quote')
  quote(@Req() req: any, @Body() input: CampaignRequest) {
    return this.ads.quote(req, input)
  }

  @Post('campaign-preview')
  preview(@Req() req: any, @Body() input: CampaignRequest) {
    return this.ads.preview(req, input)
  }

  @Post('campaigns')
  submit(@Req() req: any, @Body() input: CampaignRequest & { confirm?: boolean }) {
    return this.ads.submit(req, input)
  }
}
