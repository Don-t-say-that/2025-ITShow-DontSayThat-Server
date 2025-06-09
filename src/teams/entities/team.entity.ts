import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name?: string;

  @Column()
  leaderId: number; // 방장 ID

  @Column({ default: 'waiting' })
  status: 'waiting' | 'playing' | 'finished'; 

  @OneToMany(() => User, (user) => user.team)
  users: User[];
}
