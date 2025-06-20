import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { AIResult } from 'src/ai-result/entities/ai-result.entity';

@Entity()
export class Query {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => AIResult)
  ai_result: AIResult;

  @Column('text')
  message: string;

  @Column('text')
  response: string;

  @Column({ type: 'boolean', default: false })
  is_follow_up: boolean;

  @Column({ type: 'int', nullable: true })
  parent_query_id: number;

  @CreateDateColumn()
  created_at: Date;
} 