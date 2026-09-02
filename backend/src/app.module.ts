import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { WindsorModule } from './windsor/windsor.module'

@Module({
  imports: [WindsorModule],
  controllers: [AppController],
})
export class AppModule {}
