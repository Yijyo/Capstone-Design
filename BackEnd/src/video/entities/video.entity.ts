import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToOne } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { AIResult } from 'src/ai-result/entities/ai-result.entity';

@Entity()
export class Video {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.videos)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  original_filename: string;

  @Column()
  file_path: string;

  @CreateDateColumn()
  uploaded_at: Date;

  @Column()
  status: string;

  @OneToOne(() => AIResult, aiResult => aiResult.video)
  @JoinColumn({ name: 'ai_result_id' })
  ai_result: AIResult;
}
