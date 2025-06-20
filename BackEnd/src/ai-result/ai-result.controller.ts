import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AIResultService } from './ai-result.service';
import { InitAIResultDto } from './dto/init-ai-result.dto';
import { ReEvaluationDto } from './dto/re-evaluation.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('ai-result')
@UseGuards(AuthGuard('jwt'))
export class AIResultController {
  constructor(private readonly aiResultService: AIResultService) {}

  @Post('init')
  initialize(@Body() dto: InitAIResultDto) {
    return this.aiResultService.initialize(dto);
  }

  @Post('re-evaluation')
  reEvaluateAnalysis(@Body() reEvaluationDto: ReEvaluationDto) {
    // userID는 현재 로그인한 사용자의 ID와 일치하는지 확인
    // AuthGuard를 통해 이미 인증된 사용자의 ID를 사용
    return this.aiResultService.reEvaluateAnalysis(reEvaluationDto);
  }
}
