import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDistService } from './schooldist.service';

describe('SchoolDistService', () => {
  let service: SchoolDistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolDistService],
    }).compile();

    service = module.get<SchoolDistService>(SchoolDistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
