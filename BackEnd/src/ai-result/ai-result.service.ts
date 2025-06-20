import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIResult } from './entities/ai-result.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ReEvaluationDto } from './dto/re-evaluation.dto';
import { InitAIResultDto } from './dto/init-ai-result.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AIResultService {
  constructor(
    @InjectRepository(AIResult)
    private readonly aiResultRepository: Repository<AIResult>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async initialize(dto: InitAIResultDto): Promise<AIResult> {
    const aiResult = this.aiResultRepository.create({
      road_type: dto.road_type,
      accident_type: '차대차',
      fault_ratio: {},
      labels_detected: {}
    });

    return this.aiResultRepository.save(aiResult);
  }

  async updateResult(aiResultId: number, update: Partial<AIResult>) {
    await this.aiResultRepository.update(aiResultId, update);
    return this.aiResultRepository.findOne({ where: { id: aiResultId } });
  }

  async reEvaluateAnalysis(reEvaluationDto: ReEvaluationDto): Promise<any> {
    try {
      console.log('Starting re-evaluation with DTO:', reEvaluationDto);

      // 사용자 정보 조회
      const user = await this.userRepository.findOne({
        where: { id: reEvaluationDto.userID }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${reEvaluationDto.userID} not found`);
      }

      const aiResult = await this.aiResultRepository.findOne({
        where: { id: reEvaluationDto.ai_result_id },
        select: ['id', 'labels_detected', 'fault_ratio', 'accident_type', 'road_type', 'is_evaluation_completed', 'created_at'],
        relations: ['video', 'video.user']
      });

      console.log('Found AI Result:', aiResult);

      if (!aiResult) {
        throw new NotFoundException(`AI result with ID ${reEvaluationDto.ai_result_id} not found`);
      }

      if (!aiResult.labels_detected || !aiResult.labels_detected.analysis) {
        throw new Error('AI result does not have valid analysis data');
      }

      // AI 서버로 요청 보내기
      const aiServerUrl = this.configService.get<string>('AI_SERVER_URL');
      const requestBody = {
        analysis: aiResult.labels_detected.analysis,
        answer: reEvaluationDto.user_answer,
        uncertain_items: aiResult.labels_detected.uncertain_items || []
      };

      console.log('Sending request to AI server:', {
        url: `${aiServerUrl}/analyze/update-analysis`,
        body: requestBody
      });

      const aiResponse = await firstValueFrom(
        this.httpService.post(`${aiServerUrl}/analyze/update-analysis`, requestBody)
      );

      console.log('Raw AI Server response:', aiResponse);
      console.log('AI Server response data:', aiResponse.data);

      if (!aiResponse.data) {
        throw new Error('Empty response from AI server');
      }

      // AI 서버 응답 처리
      const processedAnalysis = Object.entries(aiResponse.data.analysis || {}).reduce((acc, [key, value]) => {
        if (typeof value === 'string' && value.includes('판단불가')) {
          acc[key] = '판단 불가';
        } else {
          acc[key] = value;
        }
        return acc;
      }, {});

      const processedResponse = {
        ...aiResponse.data,
        analysis: processedAnalysis
      };

      console.log('Processed Response:', processedResponse);

      const isEvaluationCompleted = !processedResponse.question && !processedResponse.needs_confirmation;

      await this.aiResultRepository.update(aiResult.id, {
        labels_detected: {
          analysis: processedResponse.analysis,
          similar_case: processedResponse.similar_case as any,
          explanation: processedResponse.explanation,
          question: processedResponse.question,
          needs_confirmation: processedResponse.needs_confirmation,
          uncertain_items: processedResponse.uncertain_items
        },
        is_evaluation_completed: isEvaluationCompleted
      });

      console.log('Updated AI Result in database');

      // 업데이트된 AI 결과 반환
      const updatedAIResult = await this.aiResultRepository.findOne({
        where: { id: aiResult.id },
        relations: ['video', 'video.user']
      });

      if (!updatedAIResult) {
        throw new Error('Failed to fetch updated AI result');
      }

      console.log('Fetched updated AI Result:', updatedAIResult);

      // 요청된 형식으로 응답 구성
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          created_at: user.created_at
        },
        ai_result: {
          id: updatedAIResult.id,
          fault_ratio: updatedAIResult.fault_ratio,
          labels_detected: {
            analysis: updatedAIResult.labels_detected.analysis,
            similar_case: updatedAIResult.labels_detected.similar_case,
            explanation: updatedAIResult.labels_detected.explanation,
            question: updatedAIResult.labels_detected.question,
            needs_confirmation: updatedAIResult.labels_detected.needs_confirmation,
            uncertain_items: updatedAIResult.labels_detected.uncertain_items
          },
          accident_type: updatedAIResult.accident_type,
          road_type: updatedAIResult.road_type,
          is_evaluation_completed: updatedAIResult.is_evaluation_completed,
          created_at: updatedAIResult.created_at
        }
      };
    } catch (error) {
      console.error('Error in reEvaluateAnalysis:', error);
      if (error.response) {
        console.error('AI Server error response:', error.response.data);
      }
      throw new Error(`Failed to re-evaluate analysis: ${error.message}`);
    }
  }

  private async findAIResultById(id: number): Promise<AIResult> {
    const aiResult = await this.aiResultRepository.findOne({ where: { id } });
    if (!aiResult) {
      throw new NotFoundException(`AI result with ID ${id} not found`);
    }
    return aiResult;
  }

  private async findUserById(id: number): Promise<any> {
    // User entity가 없으므로 임시로 any 타입 사용
    return { id };
  }

  async reEvaluateAIResult(
    userId: number,
    aiResultId: number,
    userAnswer: string
  ): Promise<AIResult> {
    try {
      const aiResult = await this.findAIResultById(aiResultId);
      const user = await this.findUserById(userId);

      // 하드코딩된 AI 서버 응답
      const aiResponse = {
        "analysis": {
          "신호위반": true,
          "선진입 여부": "선진입 안 함",
          "회전 중 주의의무 위반": false,
          "역주행 여부": false,
          "진로변경 위반": true,
          "돌발운전 여부": true
        },
        "similar_case": {
          "score": 0.661003053,
          "situation": "신호기에 의해 교통정리가 이루어지고 있지 않는 다른 폭의 교차로에서 소로를 이용하여 대로로 좌회전하는 A차량과 대로에서 소로로 좌회전하는 B차량이 충돌한 사고이다. A차는 소로 좌회전하였고, B차는 대로 좌회전하였다. 이 사고에서 좌회전 금지 위반(A), 명확한 선진입(A), 좌회전 방법 위반(B), 좌회전 금지 위반(B), 명확한 선진입(B)이(가) 발생하였다",
          "final_ratio": "A: 60, B: 40",
          "related": "도로교통법 제6조(통행의 금지 및 제한) ① 시·도경찰청장은 도로에서의 위험을 방지하고 교통의 안전과 원활한 소통을 확보하기 위하여 필요하다고 인정할 때에는 구간(區間)을 정하여 보행자, 차마 또는 노면전차의 통행을 금지하거나 제한할 수 있다. 이 경우 시·도경찰청장은 보행자, 차마 또는 노면전차의 통행을 금지하거나 제한한 도로의 관리청에 그 사실을 알려야 한다. 도로교통법 제25조(교차로 통행방법) ② 모든 차의 운전자는 교차로에서 좌회전을 하려는 경우에는 미리 도로의 중앙선을 따라 서행하면서 교차로의 중심 안쪽을 이용하여 좌회전하여야 한다. 다만, 시·도경찰청장이 교차로의 상황에 따라 특히 필요하다고 인정하여 지정한 곳에서는 교차로의 중심 바깥쪽을 통과할 수 있다. 도로교통법 제26조(교통정리가 없는 교차로에서의 양보운전) ① 교통정리를 하고 있지 아니하는 교차로에 들어가려고 하는 차의 운전자는 이미 교차로에 들어가 있는 다른 차가 있을 때에는 그 차에 진로를 양보하여야 한다. ③ 교통정리를 하고 있지 아니하는 교차로에 동시에 들어가려고 하는 차의 운전자는 오른쪽 도로의 차에 진로를 양보하여야 한다. 도로교통법 제38조(차의 신호) ① 모든 차의 운전자는 좌회전·우회전·횡단·유턴·서행·정지 또는 후진을 하거나 같은 방향 으로 진행하면서 진로를 바꾸려고 하는 경우와 회전교차로에 진입하거나 회전교차로에서 진출하는 경우에는 손이나 방향지시기 또는 등화로써 그 행위가 끝날 때까지 신호를 하여야 한다."
        },
        "explanation": "현재 상황에 대한 과실 판단은 사용자 A를 60%로, B를 40%로 보는 것이 적절해 보입니다. 이유는 다음과 같습니다.\n\n먼저, 사용자 A는 신호를 위반하고 진로 변경과 돌발 운전을 했다고 합니다. 도로교통법 제25조에 따르면, 모든 차의 운전자는 좌회전을 할 경우 도로의 중앙선을 따라 서행하며, 제26조에 따라 교차로에서 다른 차량에게 양보의 의무가 있습니다. 제38조에 따라서도, 좌회전, 우회전, 횡단, 유턴, 서행, 정지, 후진 혹은 같은 방향으로 진행하면서 진로 변경을 하는 경우에는 끝날 때까지 신호를 해야 합니다. 따라서, 신호 위반과 진로 변경, 돌발 운전 등의 행동은 위 도로교통법에 어긋나는 행동이므로 과실 비율이 높습니다.\n\n그러나 반대쪽 차량 B에 대해서도 주의의무 위반이 없었는지에 대한 판단이 필요합니다. 물론 주어진 정보에 따르면, B는 선진입이나 회전 중의 주의의무 위반, 역주행은 하지 않았다고 합니다. 그러나 도로교통법 제26조에 따르면, 교차로에 들어가려는 차량은 이미 교차로에 들어가 있는 다른 차량에게 진로를 양보해야 하며, 동시에 들어가려면 오른쪽 도로의 차에게 진로를 양보해야 합니다. 만약 이를 준수하지 않았다면, B도 과실이 있는 것으로 판단될 수 있습니다.\n\n따라서, A와 B 모두 법률적 책임을 부과받을 수 있는 상황이므로, 혹시라도 사고 상황에 대한 개인의 재량이나 판단 오류 등이 있었다면, 해당 비율은 조정될 여지가 있습니다. 그러나 현재 제공된 정보만으로는 A의 과실이 더 크다고 판단됩니다.",
        "question": null,
        "needs_confirmation": false,
        "uncertain_items": []
      };

      console.log('Using hardcoded AI response for re-evaluation:', aiResponse);

      const isEvaluationCompleted = !aiResponse.question && !aiResponse.needs_confirmation;

      await this.aiResultRepository.update(aiResultId, {
        labels_detected: {
          analysis: aiResponse.analysis,
          similar_case: aiResponse.similar_case as any,
          explanation: aiResponse.explanation,
          question: aiResponse.question,
          needs_confirmation: aiResponse.needs_confirmation,
          uncertain_items: aiResponse.uncertain_items
        },
        is_evaluation_completed: isEvaluationCompleted
      });

      return this.findAIResultById(aiResultId);
    } catch (error) {
      console.error('Error in reEvaluateAIResult:', error);
      throw new ConflictException(`Failed to re-evaluate AI result: ${error.message}`);
    }
  }
}
