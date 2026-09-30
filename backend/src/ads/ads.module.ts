import { Module } from '@nestjs/common'
import { MetaModule } from '../meta/meta.module'
import { AdsController } from './ads.controller'
import { AdsService } from './ads.service'
import { ShownProvider } from './shown.provider'

@Module({
  imports: [MetaModule],
  controllers: [AdsController],
  providers: [AdsService, ShownProvider],
})
export class AdsModule {}
