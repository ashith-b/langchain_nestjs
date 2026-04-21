import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { BasicMessageDto } from './dtos/basic-message.dto';
import { PromptTemplate, ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ChatGroq } from '@langchain/groq'; // 
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { TEMPLATES } from 'src/utils/constants/templates.constants';
import customMessage from 'src/utils/responses/customMessage.response';
import { MESSAGES } from 'src/utils/constants/messages.constants';
import { vercelRoles } from 'src/utils/constants/groq.constants';
import { ContextAwareMessagesDto } from './dtos/context-aware-messages.dto';
import { Message as VercelChatMessage } from 'ai';

import { existsSync } from 'fs';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { VectorStoreService } from 'src/services/vector-store.service';
import * as path from 'path';
import { Document } from '@langchain/core/documents';
import { DocumentDto } from './dtos/document.dto';
import { PDF_BASE_PATH } from 'src/utils/constants/common.constants';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { HumanMessage, AIMessage } from '@langchain/core/messages';


const GROQ_MODELS = {
  DEFAULT: 'llama-3.3-70b-versatile',           // General chat
  TOOL_USE: 'llama-3.3-70b-versatile', // Function/tool calling
  TEMPERATURE: 0,
};

@Injectable()
export class LangchainChatService {
  constructor(private vectorStoreService: VectorStoreService) {}

  async basicChat(basicMessageDto: BasicMessageDto) {
    try {
      console.log('basicChat input:', basicMessageDto);
      const chain = this.loadSingleChain(TEMPLATES.BASIC_CHAT_TEMPLATE);
      const response = await chain.invoke({
        input: basicMessageDto.user_query,
      });
      console.log('basicChat response:', response); 
      return this.successResponse(response);
    } catch (e: unknown) {
      console.error('basicChat error:', e);
      this.exceptionHandling(e);
    }
  }

  async contextAwareChat(contextAwareMessagesDto: ContextAwareMessagesDto) {
    try {
      console.log('Input received:', contextAwareMessagesDto);
      const messages = contextAwareMessagesDto.messages ?? [];
      const formattedPreviousMessages = messages
        .slice(0, -1)
        .map(this.formatMessage);
      const currentMessageContent = messages[messages.length - 1].content;
      console.log('Current message:', currentMessageContent);

      const chain = this.loadSingleChain(TEMPLATES.CONTEXT_AWARE_CHAT_TEMPLATE);

      const response = await chain.invoke({
        chat_history: formattedPreviousMessages.join('\n'),
        input: currentMessageContent,
      });
      console.log('Response:', response);
      return this.successResponse(response);
    } catch (e: unknown) {
      console.error('Error:', e);
      this.exceptionHandling(e);
    }
  }

  async documentChat(basicMessageDto: BasicMessageDto) {
    try {
      console.log('documentChat input:', basicMessageDto);
      const documentContext = await this.vectorStoreService.similaritySearch(
        basicMessageDto.user_query,
        3,
      );
      console.log('documentChat context found:', documentContext);
      const chain = this.loadSingleChain(
        TEMPLATES.DOCUMENT_CONTEXT_CHAT_TEMPLATE,
      );
      
      const response = await chain.invoke({
        context: JSON.stringify(documentContext),
        question: basicMessageDto.user_query,
      });
      console.log('documentChat response:', response);
      return this.successResponse(response);
    } catch (e: unknown) {
      console.error('documentChat error:', e);
      this.exceptionHandling(e);
    }
  }

  async uploadPDF(documentDto: DocumentDto) {
    try {
      console.log('uploadPDF input:', documentDto);
      const file = PDF_BASE_PATH + '/' + documentDto.file;
      const resolvedPath = path.resolve(file);
      console.log('uploadPDF resolved path:', resolvedPath);
      if (!existsSync(resolvedPath)) {
        throw new BadRequestException('File does not exist.');
      }

      const pdfLoader = new PDFLoader(resolvedPath);
      const pdf = await pdfLoader.load();
      console.log('uploadPDF pages loaded:', pdf.length);
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 50,
      });
      const texts = await textSplitter.splitDocuments(pdf);
      let embeddings: Document[] = [];

      for (let index = 0; index < texts.length; index++) {
        const page = texts[index];
        const splitTexts = await textSplitter.splitText(page.pageContent);
        const pageEmbeddings = splitTexts.map((text) => ({
          pageContent: text,
          metadata: { pageNumber: index },
        }));
        embeddings = embeddings.concat(pageEmbeddings);
      }
      console.log('uploadPDF total embeddings:', embeddings.length);
      await this.vectorStoreService.addDocuments(embeddings);
      console.log('uploadPDF documents added to vector store'); 
      return customMessage(HttpStatus.OK, MESSAGES.SUCCESS);
    } catch (e: unknown) {
      console.error('uploadPDF error:', e);
      this.exceptionHandling(e);
    }
  }

  async agentChat(contextAwareMessagesDto: ContextAwareMessagesDto) {
    try {
      console.log('agentChat input:', contextAwareMessagesDto);
      const tools = [new TavilySearchResults({ maxResults: 1 })];

      const messages = contextAwareMessagesDto.messages ?? [];
      const formattedPreviousMessages = messages
        .slice(0, -1)
        .map(this.formatBaseMessages);
      const currentMessageContent = messages[messages.length - 1].content;
      console.log('agentChat current message:', currentMessageContent);

      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          'You are a helpful assistant. Use tools when needed and follow SI system standards.',
        ],
        new MessagesPlaceholder({ variableName: 'chat_history', optional: true }),
        ['human', '{input}'],
        new MessagesPlaceholder({ variableName: 'agent_scratchpad' }), // ✅ Required by createToolCallingAgent
      ]);

      const llm = new ChatGroq({
        temperature: GROQ_MODELS.TEMPERATURE,
        model: GROQ_MODELS.TOOL_USE,
        apiKey: process.env.GROQ_API_KEY,
      });

      const agent = await createOpenAIFunctionsAgent({
        llm,
        tools,
        prompt,
      });

      const agentExecutor = new AgentExecutor({
        agent,
        tools,
        verbose: false, // set true for debugging tool call steps
      });

      const response = await agentExecutor.invoke({
        input: currentMessageContent,
        chat_history: formattedPreviousMessages,
      });
      console.log('agentChat response:', response);
      return customMessage(HttpStatus.OK, MESSAGES.SUCCESS, response.output);
    } catch (e: unknown) {
      console.error('agentChat error:', e);
      this.exceptionHandling(e);
    }
  }

  private loadSingleChain = (template: string) => {
    const prompt = PromptTemplate.fromTemplate(template);

    const model = new ChatGroq({
      temperature: GROQ_MODELS.TEMPERATURE,
      model: GROQ_MODELS.DEFAULT,
      apiKey: process.env.GROQ_API_KEY,
    });

    const outputParser = new HttpResponseOutputParser();
    return prompt.pipe(model).pipe(outputParser);
  };

  private formatMessage = (message: VercelChatMessage) =>
    `${message.role}: ${message.content}`;

  private formatBaseMessages = (message: VercelChatMessage) =>
    message.role === vercelRoles.user
      ? new HumanMessage({ content: message.content, additional_kwargs: {} })
      : new AIMessage({ content: message.content, additional_kwargs: {} });

  private successResponse = (response: Uint8Array) =>
    customMessage(
      HttpStatus.OK,
      MESSAGES.SUCCESS,
      Object.values(response)
        .map((code) => String.fromCharCode(code))
        .join(''),
    );

  private exceptionHandling = (e: unknown) => {
    Logger.error(e);
    throw new HttpException(
      customMessage(
        HttpStatus.INTERNAL_SERVER_ERROR,
        MESSAGES.EXTERNAL_SERVER_ERROR,
      ),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  };
}