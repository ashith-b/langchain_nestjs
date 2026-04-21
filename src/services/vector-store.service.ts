import { Injectable } from '@nestjs/common';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import {
  DistanceStrategy,
  PGVectorStore,
} from '@langchain/community/vectorstores/pgvector';
import * as pg from 'pg';
import { Document } from '@langchain/core/documents';
import { PoolConfig } from 'pg';

@Injectable()
export class VectorStoreService {
  private pgvectorStore: PGVectorStore;
  private pool: pg.Pool;

  async onModuleInit() {
    console.log('VectorStoreService initializing...');
    const { postgresConnectionOptions, tableName, columns, distanceStrategy } =
      config;
    this.pool = new pg.Pool(postgresConnectionOptions);
    await this.ensureDatabaseSchema();
    console.log('Database schema ensured'); 
    const pgVectorConfig = {
      pool: this.pool,
      tableName,
      columns,
      distanceStrategy,
    };

    this.pgvectorStore = await PGVectorStore.initialize(
      new HuggingFaceTransformersEmbeddings({
        modelName: 'Xenova/all-MiniLM-L6-v2',
      }),
      pgVectorConfig,
    );
    console.log('VectorStoreService initialized successfully');
  }

  private async ensureDatabaseSchema() {
    const client = await this.pool.connect();
    try {
      // Check and create table and columns
      const query = `
      CREATE TABLE IF NOT EXISTS ${config.tableName} (
        ${config.columns.idColumnName} UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ${config.columns.vectorColumnName} VECTOR,
        ${config.columns.contentColumnName} TEXT,
        ${config.columns.metadataColumnName} JSONB
      );
    `;
      // Create requried extensions first
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      await client.query(query);
    } finally {
      client.release();
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    console.log('Adding documents to vector store, count:', documents.length);
    await this.pgvectorStore.addDocuments(documents);
    console.log('Documents added successfully');
  }

  async similaritySearch(query: string, limit: number): Promise<any> {
    console.log('Similarity search query:', query, 'limit:', limit);
    return this.pgvectorStore.similaritySearch(query, limit);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

// Define the config
const config = {
  postgresConnectionOptions: {
    type: 'postgres',
    host: '127.0.0.1',
    port: 5434,
    user: 'pgvector',
    password: 'admin',
    database: 'pgvector-db',
  } as PoolConfig,
  tableName: 'testlangchain',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'vector',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
  distanceStrategy: 'cosine' as DistanceStrategy,
};
