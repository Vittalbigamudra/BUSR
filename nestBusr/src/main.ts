console.log('=== MAIN.TS FILE IS BEING EXECUTED ===');
console.log('main.ts loaded');
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  console.log('Starting NestJS application...');
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Set global prefix if needed
  // app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3000;
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('BUSR API')
    .setDescription('The BUSR API description')
    .setVersion('1.0')
    .addTag('gps')
    .addTag('schooldist')
    .addTag('upload')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Handle shutdown gracefully
  const signals = ['SIGTERM', 'SIGINT'];
  signals.forEach(signal => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    });
  });

  // Start the server
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation available at: http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
