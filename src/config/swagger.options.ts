import { SwaggerCustomOptions } from '@nestjs/swagger';

export const swaggerOptions: SwaggerCustomOptions = {
  customSiteTitle: 'Sugar Sack Counter API',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .scheme-container { background: #fafafa }
  `,
  customfavIcon: '/favicon.ico',
};
