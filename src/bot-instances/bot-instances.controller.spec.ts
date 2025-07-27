import { Test, TestingModule } from '@nestjs/testing';
import { BotInstancesController } from './bot-instances.controller';

describe('BotInstancesController', () => {
  let controller: BotInstancesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BotInstancesController],
    }).compile();

    controller = module.get<BotInstancesController>(BotInstancesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
