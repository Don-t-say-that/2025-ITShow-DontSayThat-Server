import { Team } from 'src/teams/entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ForbiddenWord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Team, team => team.forbiddenWords)
  team: Team;

   @ManyToOne(() => User)
  user: User;

  @Column()
  word: string;
}
