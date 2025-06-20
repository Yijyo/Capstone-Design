import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class ReEvaluationDto {
  @IsNumber()
  @IsNotEmpty()
  userID: number;

  @IsNumber()
  @IsNotEmpty()
  ai_result_id: number;

  @IsString()
  @IsNotEmpty()
  user_answer: string;
} 