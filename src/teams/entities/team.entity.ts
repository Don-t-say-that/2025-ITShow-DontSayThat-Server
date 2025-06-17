import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from 'src/chat/entity/chat.entity';
import { ForbiddenWord } from 'src/room/entity/room.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  backgroundImage?: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'leaderId' })
  leader: User;

  @Column()
  leaderId: number;

  @Column({ default: 'waiting' })
  status: 'waiting' | 'playing' | 'finished';

  @OneToMany(() => User, (user) => user.team)
  users: User[];

  @OneToMany(() => ChatMessage, (msg) => msg.team)
  chatMessages: ChatMessage[];

  @OneToMany(() => ForbiddenWord, forbiddenWord => forbiddenWord.team)
  forbiddenWords: ForbiddenWord[];
}
