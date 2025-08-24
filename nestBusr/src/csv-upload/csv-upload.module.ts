import { Module } from '@nestjs/common';
import { CsvUploadController } from './csv-upload.controller';
import { CsvUploadService } from './csv-upload.service';

@Module({
  controllers: [CsvUploadController],
  providers: [CsvUploadService]
})
export class CsvUploadModule {}
