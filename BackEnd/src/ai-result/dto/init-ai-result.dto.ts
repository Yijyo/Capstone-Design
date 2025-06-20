import { IsString } from 'class-validator';

export class InitAIResultDto {
  @IsString()
  road_type: string;
}
