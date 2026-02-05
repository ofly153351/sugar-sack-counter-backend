import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule } from "@nestjs/swagger";
const cookieParser = require("cookie-parser");
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

  // Set global prefix
  app.setGlobalPrefix("api");

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Enable transform for proper DTO parsing
    }),
  );

  // Enable CORS with credentials for cookie support
  app.enableCors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["http://localhost:3000", "http://localhost:3001"]
        : true, // Allow all origins in development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400,
  });

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
