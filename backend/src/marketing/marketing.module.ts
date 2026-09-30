import { Module } from '@nestjs/common'
import { MetaModule } from '../meta/meta.module'
import { MarketingController } from './marketing.controller'
import { MarketingService } from './marketing.service'

@Module({
  imports: [MetaModule],
  controllers: [MarketingController],
  providers: [MarketingService],
})
export class MarketingModule {}
