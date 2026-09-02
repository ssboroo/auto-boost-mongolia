import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { MetaModule } from './meta/meta.module'

@Module({
  imports: [MetaModule],
  controllers: [AppController],
})
export class AppModule {}
