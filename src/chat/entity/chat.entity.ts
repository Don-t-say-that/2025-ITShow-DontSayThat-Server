import { Team } from 'src/teams/entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  // 유저: ManyToOne (한 유저가 여러 메시지를 보낼 수 있음)
  @ManyToOne(() => User, (user) => user.chatMessages, { onDelete: 'CASCADE' })
  user: User;

  // 팀(방): ManyToOne (하나의 방에 여러 메시지가 있음)
  @ManyToOne(() => Team, (team) => team.chatMessages, { onDelete: 'CASCADE' })
  team: Team;

  @Column()
  content: string;
}
