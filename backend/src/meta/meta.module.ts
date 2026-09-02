import { Module } from '@nestjs/common'
import { MetaController } from './meta.controller'
import { MetaReadinessController } from './meta-readiness.controller'
import { MetaReadinessService } from './meta-readiness.service'
import { MetaService } from './meta.service'
import { TenantService } from './tenant.service'

@Module({
  controllers: [MetaController, MetaReadinessController],
  providers: [MetaService, MetaReadinessService, TenantService],
  exports: [MetaService, MetaReadinessService, TenantService],
})
export class MetaModule {}
