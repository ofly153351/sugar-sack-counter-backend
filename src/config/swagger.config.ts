import { DocumentBuilder } from "@nestjs/swagger";

export const swaggerConfig = new DocumentBuilder()
  .setTitle("Sugar Sack Counter API")
  .setDescription("API สำหรับระบบนับกระสอบน้ำตาลด้วย AI")
  .setVersion("1.0")
  .addTag("auth", "การยืนยันตัวตน")
  .addTag("users", "จัดการผู้ใช้งาน")
  .addBearerAuth(
    {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      name: "JWT",
      description: "Enter JWT token",
      in: "header",
    },
    "JWT-auth",
  )
  .build();
