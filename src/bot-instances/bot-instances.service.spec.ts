import { Test, TestingModule } from '@nestjs/testing';
import { BotInstancesService } from './bot-instances.service';

describe('BotInstancesService', () => {
  let service: BotInstancesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BotInstancesService],
    }).compile();

    service = module.get<BotInstancesService>(BotInstancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
