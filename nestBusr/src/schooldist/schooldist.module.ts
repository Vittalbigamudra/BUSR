import { Module } from '@nestjs/common';
import { SchoolDistController } from './schooldist.controller';
import { SchoolDistService } from './schooldist.service';

@Module({
  controllers: [SchoolDistController],
  providers: [SchoolDistService],
})
export class SchoolDistModule {}
