import { Module } from '@nestjs/common'
import { MetaController } from './meta.controller'
import { MetaService } from './meta.service'
import { TenantService } from './tenant.service'

@Module({
  controllers: [MetaController],
  providers: [MetaService, TenantService],
  exports: [MetaService, TenantService],
})
export class MetaModule {}
