import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name?: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'leaderId' })
  leader: User;

  @Column()
  leaderId: number;

  @Column({ default: 'waiting' })
  status: 'waiting' | 'playing' | 'finished';

  @OneToMany(() => User, (user) => user.team)
  users: User[];
}
