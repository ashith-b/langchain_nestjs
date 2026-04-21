import {
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { LangchainChatService } from './langchain-chat.service';
import { BasicMessageDto } from './dtos/basic-message.dto';
import { ContextAwareMessagesDto } from './dtos/context-aware-messages.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { DocumentDto } from './dtos/document.dto';
import { diskStorage } from 'multer';
import { PDF_BASE_PATH } from 'src/utils/constants/common.constants';

@Controller('langchain-chat')
export class LangchainChatController {
  constructor(private readonly langchainChatService: LangchainChatService) {}

  @Post('basic-chat')
  @HttpCode(200)
  async basicChat(@Body() messagesDto: BasicMessageDto) {
    console.log('POST /basic-chat received:', messagesDto);
    return await this.langchainChatService.basicChat(messagesDto);
  }

  @Post('context-aware-chat')
  @HttpCode(200)
  async contextAwareChat(
    @Body() contextAwareMessagesDto: ContextAwareMessagesDto,
  ) {
    console.log('POST /context-aware-chat received:', contextAwareMessagesDto);
    return await this.langchainChatService.contextAwareChat(
      contextAwareMessagesDto,
    );
  }

  @Post('upload-document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: PDF_BASE_PATH,
        filename: (req, file, callback) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @HttpCode(200)
  async loadPDF(
    @Body() documentDto: DocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('POST /upload-document received, file:', file?.originalname); 
    if (file.filename) {
      documentDto.file = file.filename;
    }
    return await this.langchainChatService.uploadPDF(documentDto);
  }

  @Post('document-chat')
  @HttpCode(200)
  async documentChat(@Body() messagesDto: BasicMessageDto) {
    console.log('POST /document-chat received:', messagesDto); 
    return await this.langchainChatService.documentChat(messagesDto);
  }

  @Post('agent-chat')
  @HttpCode(200)
  async agentChat(@Body() contextAwareMessagesDto: ContextAwareMessagesDto) {
    console.log('POST /agent-chat received:', contextAwareMessagesDto);
    return await this.langchainChatService.agentChat(contextAwareMessagesDto);
  }
}
