import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('--- DEBUG START ---');
  const metadata = Reflect.getMetadata('controllers', AppModule);
  console.log('AppModule Controllers Metadata KEYS:', metadata);
  console.log('Starting App...');
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
