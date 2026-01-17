import { Test, TestingModule } from '@nestjs/testing';
import { Nis2Service } from './nis2.service';

describe('Nis2Service', () => {
  let service: Nis2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Nis2Service],
    }).compile();

    service = module.get<Nis2Service>(Nis2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
