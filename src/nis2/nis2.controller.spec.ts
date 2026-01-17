import { Test, TestingModule } from '@nestjs/testing';
import { Nis2Controller } from './nis2.controller';

describe('Nis2Controller', () => {
  let controller: Nis2Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Nis2Controller],
    }).compile();

    controller = module.get<Nis2Controller>(Nis2Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
