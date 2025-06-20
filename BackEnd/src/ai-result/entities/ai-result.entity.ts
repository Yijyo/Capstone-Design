import { Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Video } from 'src/video/entities/video.entity';

@Entity()
export class AIResult {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Video, video => video.ai_result)
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column('json')
  fault_ratio: any;

  @Column({ type: 'json' })
  labels_detected: {
    analysis: {
      [key: string]: boolean | string;
    };
    similar_case: any;
    explanation: string | null;
    question: string | null;
    needs_confirmation: boolean;
    uncertain_items: string[];
  };

  @Column()
  accident_type: string;

  @Column()
  road_type: string;

  @Column({ default: false })
  is_evaluation_completed: boolean;

  @CreateDateColumn()
  created_at: Date;
}
