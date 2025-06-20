import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryModule } from './query/query.module';
import { VideoModule } from './video/video.module';
import { AIResultModule } from './ai-result/ai-result.module';
import { UserExplanationModule } from './user-explanation/user-explanation.module';
import { ReEvaluationModule } from './re-evaluation/re-evaluation.module';
import { ChatLogModule } from './chat-log/chat-log.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      charset: 'utf8mb4',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
    }),
    AuthModule,
    UserModule,
    QueryModule,
    VideoModule,
    AIResultModule,
    UserExplanationModule,
    ReEvaluationModule,
    ChatLogModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
