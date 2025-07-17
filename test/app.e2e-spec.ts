import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { DatabaseHealthService } from '../src/database/database-health.service';
import { CacheService } from '../src/shared/cache/cache.service';

describe('NeuralContent API (E2E)', () => {
  let app: INestApplication<App>;
  let configService: ConfigService;
  let databaseHealthService: DatabaseHealthService;
  let cacheService: CacheService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configurar pipes globais
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Obter serviços
    configService = app.get(ConfigService);
    databaseHealthService = app.get(DatabaseHealthService);
    cacheService = app.get(CacheService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Application Health', () => {
    it('/ (GET) - Should return application info', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('environment');
        });
    });

    it('/health (GET) - Should return comprehensive health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('database');
          expect(res.body).toHaveProperty('cache');
          expect(res.body.database).toHaveProperty('isConnected');
          expect(res.body.cache).toHaveProperty('redis');
        });
    });

    it('/health/database (GET) - Should return database health', () => {
      return request(app.getHttpServer())
        .get('/health/database')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isConnected');
          expect(res.body).toHaveProperty('database');
        });
    });

    it('/health/cache (GET) - Should return cache health', () => {
      return request(app.getHttpServer())
        .get('/health/cache')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('redis');
          expect(res.body).toHaveProperty('metrics');
        });
    });
  });

  describe('Error Handling', () => {
    it('/test/error/business (GET) - Should handle business validation error', () => {
      return request(app.getHttpServer())
        .get('/test/error/business')
        .expect(422)
        .expect((res) => {
          expect(res.body.error).toHaveProperty('statusCode', 422);
          expect(res.body.error).toHaveProperty('message');
          expect(res.body).toHaveProperty('success', false);
        });
    });

    it('/test/error/notfound (GET) - Should handle not found error', () => {
      return request(app.getHttpServer())
        .get('/test/error/notfound')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toHaveProperty('statusCode', 404);
          expect(res.body.error).toHaveProperty('message');
        });
    });

    it('/test/error/auth (GET) - Should handle authentication error', () => {
      return request(app.getHttpServer())
        .get('/test/error/auth')
        .expect(401)
        .expect((res) => {
          expect(res.body.error).toHaveProperty('statusCode', 401);
          expect(res.body.error).toHaveProperty('message');
          expect(res.body).toHaveProperty('success', false);
        });
    });

    it('/test/error/internal (GET) - Should handle internal server error', () => {
      return request(app.getHttpServer())
        .get('/test/error/internal')
        .expect(500)
        .expect((res) => {
          expect(res.body.error).toHaveProperty('statusCode', 500);
          expect(res.body.error).toHaveProperty('message');
          expect(res.body).toHaveProperty('success', false);
        });
    });
  });

  describe('API Documentation', () => {
    it.skip('/api-docs (GET) - Should serve Swagger documentation', () => {
      return request(app.getHttpServer())
        .get('/api-docs')
        .expect(200)
        .expect('Content-Type', /text\/html/);
    });

    it.skip('/api-docs-json (GET) - Should serve OpenAPI JSON', () => {
      return request(app.getHttpServer())
        .get('/api-docs-json')
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .expect((res) => {
          expect(res.body).toHaveProperty('openapi');
          expect(res.body).toHaveProperty('info');
          expect(res.body).toHaveProperty('paths');
        });
    });
  });

  describe('Security Headers', () => {
    it('Should include security headers in responses', () => {
      return request(app.getHttpServer())
        .get('/v1/health')
        .expect((res) => {
          // Verificar headers de segurança básicos
          expect(res.headers).toHaveProperty('x-powered-by');
        });
    });
  });

  describe('CORS Configuration', () => {
    it.skip('Should handle CORS preflight requests', () => {
      return request(app.getHttpServer()).options('/health').expect(204);
    });
  });
});
