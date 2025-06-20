import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AIResult } from 'src/ai-result/entities/ai-result.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  
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
      relations: ['video']
    });
    if (!aiResult) {
      throw new NotFoundException(`AI result with ID ${aiResultId} not found`);
    }
    return aiResult;
  }

  private checkAIResultAvailability(aiResult: AIResult): void {
    if (aiResult.video) {
      throw new ConflictException('This AI result is already associated with a video');
    }
  }
  
  private createVideoEntity(
    file: Express.Multer.File,
    user: User,
    aiResult: AIResult
  ): Video {
    return this.videoRepository.create({
      user,
      ai_result: aiResult,
      original_filename: file.originalname,
      file_path: file.path,
      uploaded_at: new Date(),
      status: 'uploaded',
    });
  }

  private handleDatabaseError(error: any): never {
    if (error instanceof NotFoundException || error instanceof ConflictException) {
      throw error;
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      throw new ConflictException(
        'This AI result is already associated with another video. Please use a different AI result.'
      );
    }
    
    if (error.code && error.sqlMessage) {
      throw new ConflictException(`Database error: ${error.sqlMessage}`);
    }

    throw new ConflictException(
      'An error occurred while saving the video. Please check your input and try again.'
    );
  }
  
  private async sendVideoToAIServer(video: Video, aiResult: AIResult): Promise<void> {
    try {
      // AI 서버로 비디오 전송
      const aiServerUrl = this.configService.get<string>('AI_SERVER_URL');
      const formData = new FormData();
      
      // 비디오 파일 추가
      const videoFile = fs.createReadStream(video.file_path);
      formData.append('video', videoFile, {
        filename: video.original_filename,
        contentType: 'video/mp4'
      });

      formData.append('road_type', aiResult.road_type);
      formData.append('accident_type', aiResult.accident_type);

      console.log('Sending video to AI server:', {
        user_id: video.user.id,
        ai_result_id: video.ai_result.id,
        road_type: aiResult.road_type,
        accident_type: aiResult.accident_type,
        filename: video.original_filename
      });

      const aiResponse = await firstValueFrom(
        this.httpService.post(`${aiServerUrl}/analyze/video`, formData, {
          headers: {
            ...formData.getHeaders()
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        })
      );

      console.log('AI Server response:', aiResponse.data);

      const processedAnalysis = Object.entries(aiResponse.data.analysis).reduce((acc, [key, value]) => {
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

      console.log('Sending processed response to frontend:', processedResponse);

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

      await this.updateVideoStatus(video.id, 'completed');
    } catch (error) {
      console.error('Error in sendVideoToAIServer:', error);
      await this.updateVideoStatus(video.id, 'failed');
      throw new ConflictException(`Failed to send video to AI server: ${error.message}`);
    }
  }
  
  async saveVideo(file: Express.Multer.File, userId: number, aiResultId: number): Promise<Video> {
    try {
      const user = await this.findUserById(userId);
      const aiResult = await this.findAIResultById(aiResultId);
      
      this.checkAIResultAvailability(aiResult);
      
      const video = this.createVideoEntity(file, user, aiResult);
      const savedVideo = await this.videoRepository.save(video);

      await this.sendVideoToAIServer(savedVideo, aiResult);
      
      return this.videoRepository.findOne({
        where: { id: savedVideo.id },
        relations: ['user', 'ai_result']
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async updateVideoStatus(videoId: number, status: string): Promise<Video> {
    try {
      const video = await this.videoRepository.findOne({ where: { id: videoId } });
      if (!video) {
        throw new NotFoundException(`Video with ID ${videoId} not found`);
      }
      
      await this.videoRepository.update(videoId, { status });
      return this.videoRepository.findOne({ where: { id: videoId } });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
