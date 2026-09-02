import { Body, Controller, Get, Headers, Patch, Post, Query, Req } from '@nestjs/common'
import { BillingService } from './billing.service'

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('fx')
  fx(@Req() req: any) {
    return this.billing.getUsdMntRate(req)
  }

  @Get('quote')
  quote(@Req() req: any, @Query('usd') usd: string) {
    return this.billing.quote(req, Number(usd))
  }

  @Post('fee-checkout')
  createFeeCheckout(@Req() req: any, @Body() body: { metaBudgetUsd: number; adDraftId?: string }) {
    return this.billing.createFeeCheckout(req, body)
  }

  @Get('payment')
  payment(@Req() req: any, @Query('payment_intent') paymentIntentId: string) {
    return this.billing.getPayment(req, paymentIntentId)
  }

  @Get('history')
  history(@Req() req: any, @Query('limit') limit?: string) {
    return this.billing.getHistory(req, Number(limit || 50))
  }

  @Get('receipt')
  receipt(@Req() req: any, @Query('id') id: string) {
    return this.billing.getReceipt(req, id)
  }

  @Get('admin/settings')
  adminSettings(@Req() req: any) {
    return this.billing.getAdminSettings(req)
  }

  @Patch('admin/settings')
  updateAdminSettings(@Req() req: any, @Body() body: { serviceFeePercent?: number; fallbackUsdMntRate?: number; fallbackRateDate?: string }) {
    return this.billing.updateAdminSettings(req, body)
  }

  @Get('admin/overview')
  adminOverview(@Req() req: any) {
    return this.billing.getAdminOverview(req)
  }

  @Post('wire/webhook')
  wireWebhook(@Req() req: any, @Headers('wirepayment-signature') signature?: string) {
    const forwarded = String(req.headers?.['x-forwarded-for'] || '')
    const clientIp = forwarded.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || ''
    return this.billing.handleWireWebhook(req.rawBody || Buffer.from(''), signature || '', clientIp)
  }
}
