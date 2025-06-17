import { Injectable } from '@nestjs/common';
import { AddChatDto } from './dto/addChat.dto';
import { ChatMessage } from './entity/chat.entity';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GameResult } from './entity/gameResult.entity';
import { ForbiddenWord } from 'src/room/entity/room.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage) private chatRepo: Repository<ChatMessage>,
    @InjectRepository(GameResult)
    private gameResultRepo: Repository<GameResult>,
    @InjectRepository(ForbiddenWord)
    private forbiddenWordRepo: Repository<ForbiddenWord>,
  ) {}

  // 금칙어 판별
  async checkForbiddenWord(addChatDto: AddChatDto) {
    // teamId 중에서 자신의 userId가 가진 금칙어 제외하고 선별
    const forbiddenWords = await this.forbiddenWordRepo.find({
      where: {
        team: { id: addChatDto.teamId },
        user: { id: Not(addChatDto.userId) },
      },
      select: ['word'],
    });

    const containsForbidden: boolean = forbiddenWords.some((fw) =>
      addChatDto.content.includes(fw.word),
    );

    // 금칙어이면 -600, 아니면 +100
    const scoreStandard = containsForbidden ? -600 : 100;

    console.log(
      `[채팅] 유저 ${addChatDto.userId} 내용: ${addChatDto.content} / 금칙어 포함 여부: ${containsForbidden}`,
    );

    // 메시지 저장
    const savedMessage = await this.chatRepo.save({
      content: addChatDto.content,
      user: { id: addChatDto.userId },
      team: { id: addChatDto.teamId },
    });

    // 점수 저장 or 누적
    const existing = await this.gameResultRepo.findOne({
      where: {
        user: { id: addChatDto.userId },
        team: { id: addChatDto.teamId },
      },
    });

    if (existing) {
      existing.score += scoreStandard;
      await this.gameResultRepo.save(existing);
    } else {
      await this.gameResultRepo.save({
        user: { id: addChatDto.userId },
        team: { id: addChatDto.teamId },
        score: scoreStandard,
      });
    }

    return savedMessage;
  }
}
