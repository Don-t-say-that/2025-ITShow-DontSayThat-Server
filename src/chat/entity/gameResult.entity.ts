import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Team } from '../../teams/entities/team.entity';

@Entity('game_results')
export class GameResult {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.results)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Team, (team) => team.results)
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column()
  score: number;

  @CreateDateColumn()
  createdAt: Date;
}
