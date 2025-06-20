import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Video } from 'src/video/entities/video.entity';

@Entity()
export class ChatLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.chats)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Video)
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column('text')
  message: string;

  @Column()
  sender: string;

  @CreateDateColumn()
  created_at: Date;
}
