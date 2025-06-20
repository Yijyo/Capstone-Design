import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Video } from 'src/video/entities/video.entity';

@Entity()
export class UserExplanation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Video)
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('text')
  content: string;

  @CreateDateColumn()
  created_at: Date;
}
