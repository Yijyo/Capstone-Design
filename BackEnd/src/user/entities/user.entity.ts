import { Video } from 'src/video/entities/video.entity';
import { Query } from '../../query/query.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm';
import { UserExplanation } from 'src/user-explanation/entities/user-explanation.entity';
import { ChatLog } from 'src/chat-log/entities/chat-log.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique : true})
    email: string;

    @Column()
    password: string;

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => Video, video => video.user)
    videos: Video[];

    @OneToMany(() => UserExplanation, exp => exp.user)
    user_explanations: UserExplanation[];

    @OneToMany(() => ChatLog, chat => chat.user)
    chats: ChatLog[];
}