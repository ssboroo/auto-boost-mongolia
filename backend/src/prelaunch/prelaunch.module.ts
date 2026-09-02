import { Module } from '@nestjs/common'
import { MetaModule } from '../meta/meta.module'
import { PrelaunchController } from './prelaunch.controller'
import { PrelaunchService } from './prelaunch.service'

@Module({
  imports: [MetaModule],
  controllers: [PrelaunchController],
  providers: [PrelaunchService],
})
export class PrelaunchModule {}
