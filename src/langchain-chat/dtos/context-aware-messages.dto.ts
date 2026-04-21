import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class MessageDto {
  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}

export class ContextAwareMessagesDto {
  @IsNotEmpty()
  @IsArray()
  messages: MessageDto[];
}
