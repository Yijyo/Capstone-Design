import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateQueryDto {
  @IsNumber()
  @IsNotEmpty()
  userID: number;

  @IsNumber()
  @IsNotEmpty()
  ai_result_id: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class QueryResponseDto {
  id: number;
  message: string;
  response: string;
  created_at: Date;
} 