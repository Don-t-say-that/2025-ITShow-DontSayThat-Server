import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  image: string;

  @OneToMany(() => User, (user) => user.character) // 역방향 (비소유)
  user?: User[];
}
