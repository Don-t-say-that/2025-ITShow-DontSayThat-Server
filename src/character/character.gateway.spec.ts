import { Test, TestingModule } from '@nestjs/testing';
import { CharacterGateway } from './character.gateway';

describe('CharacterGateway', () => {
  let gateway: CharacterGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CharacterGateway],
    }).compile();

    gateway = module.get<CharacterGateway>(CharacterGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
