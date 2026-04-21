import { IsNotEmpty, IsString } from 'class-validator';

export class BasicMessageDto {
  @IsNotEmpty()
  @IsString()
  user_query: string;
}
