import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Query } from './query.entity';
import { CreateQueryDto, QueryResponseDto } from './dto/query.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/entities/user.entity';
import { AIResult } from 'src/ai-result/entities/ai-result.entity';

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AIResult)
    private readonly aiResultRepository: Repository<AIResult>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private async findUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  private async findAIResultById(aiResultId: number): Promise<AIResult> {
    const aiResult = await this.aiResultRepository.findOne({
      where: { id: aiResultId },
      select: ['id', 'labels_detected', 'fault_ratio', 'accident_type', 'road_type', 'is_evaluation_completed', 'created_at']
    });

    if (!aiResult) {
      throw new NotFoundException(`AI result with ID ${aiResultId} not found`);
    }

    if (!aiResult.labels_detected) {
      throw new Error(`AI result with ID ${aiResultId} does not have labels_detected data`);
    }

    console.log('Found AI Result:', {
      id: aiResult.id,
      labels_detected: aiResult.labels_detected
    });

    return aiResult;
  }

  async createQuery(createQueryDto: CreateQueryDto): Promise<QueryResponseDto> {
    try {
      const user = await this.findUserById(createQueryDto.userID);
      const aiResult = await this.findAIResultById(createQueryDto.ai_result_id);

      // 이전 대화 내역 조회
      const previousQueries = await this.queryRepository.find({
        where: {
          user: { id: createQueryDto.userID },
          ai_result: { id: createQueryDto.ai_result_id }
        },
        order: {
          created_at: 'ASC'
        }
      });

      const aiServerUrl = this.configService.get<string>('AI_SERVER_URL');
      if (!aiServerUrl) {
        throw new Error('AI server URL is not configured');
      }

      // 대화 내역을 JSON 배열 형식으로 구성
      const conversationHistory = previousQueries.map(query => [
        {
          role: 'user',
          content: query.message
        },
        {
          role: 'assistant',
          content: query.response
        }
      ]).flat();

      // 대화 내역을 포함한 요청 데이터 구성
      const requestData = {
        message: createQueryDto.message,
        analysis: aiResult.labels_detected.analysis,
        similar_case: aiResult.labels_detected.similar_case,
        explanation: aiResult.labels_detected.explanation,
        is_follow_up: previousQueries.length > 0,
        parent_query_id: previousQueries.length > 0 ? previousQueries[previousQueries.length - 1].id : null,
        conversation_history: JSON.stringify(conversationHistory)
      };

      console.log('Sending request to AI server:', {
        url: `${aiServerUrl}/chat/ask-followup`,
        body: requestData
      });

      const response = await firstValueFrom(
        this.httpService.post(`${aiServerUrl}/chat/ask-followup`, requestData, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      console.log('AI Server response:', JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.response) {
        throw new Error('Invalid response from AI server: missing response field');
      }

      const aiResponse = response.data;

      // 쿼리 저장
      const query = this.queryRepository.create({
        user,
        ai_result: aiResult,
        message: createQueryDto.message,
        response: aiResponse.response
      });

      const savedQuery = await this.queryRepository.save(query);

      return {
        id: savedQuery.id,
        message: savedQuery.message,
        response: savedQuery.response,
        created_at: savedQuery.created_at
      };
    } catch (error) {
      console.error('Error in createQuery:', error);
      if (error.response) {
        console.error('AI Server error response:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error(`Failed to create query: ${error.message}`);
    }
  }

  async getQueriesByAIResult(userId: number, aiResultId: number): Promise<QueryResponseDto[]> {
    try {
      const user = await this.findUserById(userId);
      const aiResult = await this.findAIResultById(aiResultId);

      const queries = await this.queryRepository.find({
        where: {
          user: { id: userId },
          ai_result: { id: aiResultId }
        },
        order: {
          created_at: 'ASC'
        }
      });

      return queries.map(query => ({
        id: query.id,
        message: query.message,
        response: query.response,
        created_at: query.created_at
      }));
    } catch (error) {
      throw new Error(`Failed to get queries: ${error.message}`);
    }
  }
}