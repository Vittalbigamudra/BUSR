import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDistController } from './schooldist.controller';

describe('SchoolDistController', () => {
  let controller: SchoolDistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolDistController],
    }).compile();

    controller = module.get<SchoolDistController>(SchoolDistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
