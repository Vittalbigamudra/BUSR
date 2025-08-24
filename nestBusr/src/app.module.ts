import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GpsModule } from './gps/gps.module';
import { SchoolDistModule } from './schooldist/schooldist.module';
import { CsvUploadModule } from './csv-upload/csv-upload.module';

@Module({
  imports: [
    GpsModule,
    SchoolDistModule,
    CsvUploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
