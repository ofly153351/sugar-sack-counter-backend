import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { swaggerConfig, swaggerOptions } from "./config";
import { seedDatabase } from "../scripts/seed-database";

async function bootstrap() {
  // Seed database on startup in development
  if (process.env.NODE_ENV === "development") {
    try {
      await seedDatabase();
    } catch (error) {
      console.warn("⚠️ Database seeding failed, continuing startup...");
    }
  }

  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // Swagger configuration
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api", app, document, swaggerOptions);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger documentation available at: http://localhost:${port}/api`,
  );
}

bootstrap();
