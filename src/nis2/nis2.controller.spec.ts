import { Test, TestingModule } from '@nestjs/testing';
import { Nis2Controller } from './nis2.controller';
import { Nis2Service } from './nis2.service';

describe('Nis2Controller', () => {
  let controller: Nis2Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Nis2Controller],
      providers: [
        {
          provide: Nis2Service,
          useValue: {
            getReadiness: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<Nis2Controller>(Nis2Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
