import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseHealthService } from './database/database-health.service';
import { CacheService } from './shared/cache/cache.service';
import { LoggerService } from './shared/logger/logger.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockDatabaseHealthService = {
      getDatabaseHealth: jest.fn().mockResolvedValue({ status: 'ok' }),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setContext: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DatabaseHealthService,
          useValue: mockDatabaseHealthService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
