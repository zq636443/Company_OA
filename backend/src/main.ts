import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

function parseCorsOrigins(value?: string) {
  return value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const origins = parseCorsOrigins(config.get<string>('CORS_ORIGIN'))

  app.enableCors({
    origin: origins?.length ? origins : true,
    credentials: true,
  })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Company OA API')
    .setDescription('Enterprise WeCom OA workflow backend API')
    .setVersion('0.1.0')
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  const port = config.get<number>('PORT') ?? 3001
  await app.listen(port)
}

void bootstrap()
