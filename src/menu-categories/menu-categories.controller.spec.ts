import { Test, TestingModule } from '@nestjs/testing';
import { MenuCategoriesController } from './menu-categories.controller';

describe('MenuCategoriesController', () => {
  let controller: MenuCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuCategoriesController],
    }).compile();

    controller = module.get<MenuCategoriesController>(MenuCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
