# LangChain with NestJS

A sophisticated Node.js application combining **NestJS** framework with **LangChain** for advanced AI-powered chat interactions. This project demonstrates integration of **Groq's** high-speed language models, vector-based document retrieval, and context-aware conversations.

## 🚀 Features

- **Basic Chat**: Simple one-turn chat interactions powered by Groq's Llama-3.3-70B model
- **Context-Aware Chat**: Multi-turn conversations that maintain chat history for coherent responses
- **Document-Context Chat**: Retrieve relevant documents and answer questions based on document context
- **PDF Upload & Processing**: Upload PDF documents, extract text, and store embeddings for semantic search
- **Vector Database**: PostgreSQL with PGVector for efficient similarity searches using HuggingFace embeddings
- **Agent-Based Chat**: Autonomous agents with tool integration (Tavily Search) powered by Groq
- **Scalable Architecture**: Built with NestJS for enterprise-grade application structure
- **Fast Inference**: Leverages Groq's exceptional speed for near-instantaneous LLM responses

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Docker & Docker Compose**: For PostgreSQL with PGVector
- **Groq API Key**: Required for LLM functionality (get one at [console.groq.com](https://console.groq.com))

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ashith-b/langchain_nestjs
cd nestjs-langchain
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
# Groq Configuration
GROQ_API_KEY=your_groq_api_key_here

# Application Configuration
NODE_ENV=development
PORT=6000

# PostgreSQL Configuration (used by Docker)
POSTGRES_DB=pgvector-db
POSTGRES_USER=pgvector
POSTGRES_PASSWORD=admin
```

### 4. Start PostgreSQL with PGVector

```bash
cd docker
docker-compose up -d
cd ..
```

This starts a PostgreSQL database with PGVector extension on `localhost:5434`.

## 🚄 Why Groq?

This project uses **Groq** instead of OpenAI for several advantages:

- **🔥 Extreme Speed**: Groq provides near-instantaneous inference, ideal for real-time applications
- **💰 Cost-Effective**: Competitive pricing with high throughput capabilities
- **🦙 Powerful Models**: Llama-3.3-70B provides excellent reasoning and function calling capabilities
- **🎯 Deterministic Responses**: Temperature set to 0 for consistent, reliable outputs
- **📊 Production-Ready**: Scales efficiently for enterprise applications

## ▶️ Running the Application

### Development Mode

```bash
npm run start:dev
```

The application will start on `http://localhost:6000` with hot-reload enabled.

### Production Mode

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## 📡 API Endpoints

### Base URL
```
http://localhost:6000/api/v1
```

### 1. Basic Chat
**POST** `/langchain-chat/basic-chat`

Request:
```json
{
  "user_query": "What is TypeScript?"
}
```

Response:
```json
{
  "statusCode": 200,
  "message": ["success"],
  "data": "TypeScript is a statically typed superset of JavaScript..."
}
```

### 2. Context-Aware Chat
**POST** `/langchain-chat/context-aware-chat`

Request:
```json
{
  "messages": [
    { "role": "user", "content": "What is NestJS?" },
    { "role": "assistant", "content": "NestJS is a progressive Node.js framework..." },
    { "role": "user", "content": "How is it different from Express?" }
  ]
}
```

Response:
```json
{
  "statusCode": 200,
  "message": ["success"],
  "data": "NestJS provides built-in support for TypeScript, dependency injection..."
}
```

### 3. Upload PDF Document
**POST** `/langchain-chat/upload-document`

Request (multipart/form-data):
- `file`: PDF file
- `file`: (field name) document filename

Response:
```json
{
  "statusCode": 200,
  "message": ["success"],
  "data": {}
}
```

### 4. Document-Context Chat
**POST** `/langchain-chat/document-chat`

Request:
```json
{
  "user_query": "What topics are covered in the uploaded document?"
}
```

Response:
```json
{
  "statusCode": 200,
  "message": ["success"],
  "data": "The document covers topics such as..."
}
```

### 5. Agent Chat
**POST** `/langchain-chat/agent-chat`

Request:
```json
{
  "messages": [
    { "role": "user", "content": "Search for the latest news about AI" }
  ]
}
```

Response:
```json
{
  "statusCode": 200,
  "message": ["success"],
  "data": "Based on the latest search results..."
}
```

## 📁 Project Structure

```
nestjs-langchain/
├── src/
│   ├── app.module.ts                 # Root application module
│   ├── main.ts                       # Application entry point
│   ├── langchain-chat/
│   │   ├── langchain-chat.controller.ts
│   │   ├── langchain-chat.service.ts
│   │   ├── langchain-chat.module.ts
│   │   └── dtos/
│   │       ├── basic-message.dto.ts
│   │       ├── context-aware-messages.dto.ts
│   │       └── document.dto.ts
│   ├── services/
│   │   └── vector-store.service.ts   # PostgreSQL + PGVector integration
│   └── utils/
│       ├── constants/
│       │   ├── common.constants.ts
│       │   ├── messages.constants.ts
│       │   ├── openAI.constants.ts
│       │   └── templates.constants.ts
│       └── responses/
│           └── customMessage.response.ts
├── docker/
│   ├── docker-compose.yml
│   └── init.sql/
├── package.json
├── tsconfig.json
└── README.md
```

## ⚙️ Configuration Details

### Environment Variables

The application uses NestJS `ConfigModule` to manage environment variables from `.env` files:

```typescript
// src/app.module.ts
imports: [ConfigModule.forRoot(), LangchainChatModule],
```

**Groq API Key** is accessed via `process.env.GROQ_API_KEY` in the service implementations.

### Database Configuration

Database configuration is defined in [src/services/vector-store.service.ts](src/services/vector-store.service.ts#L105-L123):

```typescript
const config = {
  postgresConnectionOptions: {
    type: 'postgres',
    host: '127.0.0.1',
    port: 5434,
    user: 'pgvector',
    password: 'admin',
    database: 'pgvector-db',
  },
  tableName: 'testlangchain',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'vector',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
  distanceStrategy: 'cosine',
};
```

### Groq LLM Configuration

Groq settings are managed in the service with two model configurations:

```typescript
const GROQ_MODELS = {
  DEFAULT: 'llama-3.3-70b-versatile',           // General chat
  TOOL_USE: 'llama-3.3-70b-versatile', // Function/tool calling
  TEMPERATURE: 0,
};
```

The ChatGroq instance is created with:

```typescript
const model = new ChatGroq({
  temperature: GROQ_MODELS.TEMPERATURE,
  model: GROQ_MODELS.DEFAULT,
  apiKey: process.env.GROQ_API_KEY,
});
```

### Chat Templates

Prompt templates are defined in [src/utils/constants/templates.constants.ts](src/utils/constants/templates.constants.ts):

- **BASIC_CHAT_TEMPLATE**: Single-turn chat
- **CONTEXT_AWARE_CHAT_TEMPLATE**: Multi-turn chat with history
- **DOCUMENT_CONTEXT_CHAT_TEMPLATE**: Document-based QA

## 🔌 Technologies Used

- **NestJS**: Enterprise Node.js framework
- **TypeScript**: Type-safe JavaScript
- **LangChain**: Framework for LLM applications
- **Groq API**: Ultra-fast LLM inference with Llama models
- **PostgreSQL + PGVector**: Vector database for embeddings
- **HuggingFace Transformers**: Embeddings generation
- **Multer**: File upload handling
- **Express**: Underlying HTTP framework
- **Tavily Search**: Web search integration for agents

## 📝 Scripts

```bash
npm run start          # Run in production
npm run start:dev      # Run in development with hot-reload
npm run start:debug    # Run in debug mode
npm run build          # Build TypeScript to JavaScript
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

## 🐛 Troubleshooting

### Connection to PostgreSQL Failed
- Ensure Docker containers are running: `docker-compose ps`
- Verify port 5434 is accessible
- Check PostgreSQL logs: `docker-compose logs db`

### Groq API Key Invalid
- Verify your Groq API key is correct in `.env`
- Ensure the API key has sufficient rate limits
- Check API key permissions in [Groq Console](https://console.groq.com)

### PDF Upload Not Working
- Ensure `./src/pdfs` directory exists (created automatically on first upload)
- Verify file permissions
- Check PDF file is valid and not corrupted

## 🚀 Future Enhancements

- [ ] Move hardcoded PostgreSQL config to environment variables
- [ ] Add request rate limiting
- [ ] Implement comprehensive error handling with custom error codes
- [ ] Add support for additional document formats (DOCX, TXT, etc.)
- [ ] Implement streaming responses for real-time chat
- [ ] Add authentication and authorization
- [ ] Unit and integration tests
- [ ] Kubernetes deployment configurations
- [ ] Caching layer for frequently asked queries
- [ ] Support for multiple Groq models with user selection

## 📚 Learning Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [LangChain Documentation](https://js.langchain.com)
- [Groq API Documentation](https://console.groq.com/docs)
- [Groq Models](https://console.groq.com/docs/models)
- [PGVector Documentation](https://github.com/pgvector/pgvector)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bug reports and feature requests.

## 📄 License

This project is open source and available under the MIT License.

---

**Last Updated**: April 2026  
**LLM Provider**: Groq (Llama-3.3-70B)

