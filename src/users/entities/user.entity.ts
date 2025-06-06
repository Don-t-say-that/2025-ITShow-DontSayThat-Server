import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Team } from '../../teams/entities/team.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  password: string;

  @ManyToOne(() => Team, (team) => team.users, { nullable: true, onDelete: 'SET NULL' })    // 다대일 관계 
  @JoinColumn({ name: 'teamId' })
  team?: Team;
}
