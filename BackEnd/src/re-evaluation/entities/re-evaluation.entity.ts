import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Video } from 'src/video/entities/video.entity';
import { UserExplanation } from 'src/user-explanation/entities/user-explanation.entity';

@Entity()
export class ReEvaluation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Video)
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @ManyToOne(() => UserExplanation)
  @JoinColumn({ name: 'explanation_id' })
  explanation: UserExplanation;

  @Column('json')
  fault_ratio: any;

  @CreateDateColumn()
  created_at: Date;
}
