import { Module } from '@nestjs/common'
import { WindsorController } from './windsor.controller'
import { WindsorService } from './windsor.service'

@Module({
  controllers: [WindsorController],
  providers: [WindsorService],
  exports: [WindsorService],
})
export class WindsorModule {}
