import { Test, TestingModule } from '@nestjs/testing';
import { GpsController } from './gps.controller';

describe('GpsController', () => {
  let controller: GpsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GpsController],
    }).compile();

    controller = module.get<GpsController>(GpsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
