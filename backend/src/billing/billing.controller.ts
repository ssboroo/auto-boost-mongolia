import { Body, Controller, Get, Headers, Post, Query, Req } from '@nestjs/common'
import { BillingService } from './billing.service'

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('fx')
  fx() {
    return this.billing.getUsdMntRate()
  }

  @Get('quote')
  quote(@Query('usd') usd: string) {
    return this.billing.quote(Number(usd))
  }

  @Post('fee-checkout')
  createFeeCheckout(@Req() req: any, @Body() body: { metaBudgetUsd: number; adDraftId?: string }) {
    return this.billing.createFeeCheckout(req, body)
  }

  @Get('payment')
  payment(@Req() req: any, @Query('payment_intent') paymentIntentId: string) {
    return this.billing.getPayment(req, paymentIntentId)
  }

  @Post('wire/webhook')
  wireWebhook(@Req() req: any, @Headers('wirepayment-signature') signature?: string) {
    return this.billing.handleWireWebhook(req.rawBody || Buffer.from(''), signature || '')
  }
}
