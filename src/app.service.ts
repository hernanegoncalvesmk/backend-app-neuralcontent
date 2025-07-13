import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'NeuralContent API v1.0.0 - Built with NestJS';
  }
}
