import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import { MarketingService } from './marketing.service'
import {
  AssistantRequest,
  BusinessScanRequest,
  CreativeRequest,
  OptimizationRequest,
  StrategyRequest,
  WebsiteScanRequest,
} from './marketing.types'

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketing: MarketingService) {}

  @Get('meta-sources')
  metaSources(@Req() req: any) {
    return this.marketing.metaSources(req)
  }

  @Post('scan-website')
  scanWebsite(@Req() req: any, @Body() body: WebsiteScanRequest) {
    return this.marketing.scanWebsite(req, body)
  }

  @Post('scan-business')
  scanBusiness(@Req() req: any, @Body() body: BusinessScanRequest) {
    return this.marketing.scanBusiness(req, body)
  }

  @Post('strategy')
  strategy(@Req() req: any, @Body() body: StrategyRequest) {
    return this.marketing.strategy(req, body)
  }

  @Post('assistant')
  assistant(@Req() req: any, @Body() body: AssistantRequest) {
    return this.marketing.assistant(req, body)
  }

  @Post('creative')
  creative(@Req() req: any, @Body() body: CreativeRequest) {
    return this.marketing.creative(req, body)
  }

  @Post('optimize')
  optimize(@Req() req: any, @Body() body: OptimizationRequest) {
    return this.marketing.optimize(req, body)
  }

  @Get('tracking')
  tracking(@Req() req: any) {
    return this.marketing.tracking(req)
  }
}
