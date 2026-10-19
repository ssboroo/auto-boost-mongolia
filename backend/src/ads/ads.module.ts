import { AdliftrService } from './adliftr.service'
import { Module } from '@nestjs/common'
import { MetaModule } from '../meta/meta.module'
import { AdsController } from './ads.controller'
import { AdsService } from './ads.service'
import { ShownProvider } from './shown.provider'

@Module({
  imports: [MetaModule],
  controllers: [AdsController],
  providers: [AdsService, ShownProvider, AdliftrService],
})
export class AdsModule {}
