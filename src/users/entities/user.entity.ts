import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Unique,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { Character } from './character.entity';

@Entity()
@Unique(['teamId', 'characterId'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  password: string;

  @ManyToOne(() => Team, (team) => team.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'teamId' })
  team?: Team;

  @Column({ nullable: true })
  teamId?: number;

  @OneToOne(() => Character, (character) => character.user, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'characterId' }) // 소유
  character: Character;

  @Column({ nullable: true })
  characterId: number;
}
