/**
 * Enum for Groq AI configuration parameters.
 *
 * This enum stores specific configuration values related to Groq AI usage in the
 * application, helping in maintaining consistency and ease of updates.
 *
 * @enum groqAI
 *
 * @member DEFAULT_MODEL - Identifier for the default Groq model used for general chat.
 * @member TOOL_USE_MODEL - Identifier for the Groq model used for tool/function calling.
 * @member TEMPERATURE - Controls the randomness in the model's responses,
 *                       with 0 being the most deterministic.
 */
export enum groqAI {
  DEFAULT_MODEL = 'llama-3.3-70b-versatile',
  TOOL_USE_MODEL = 'llama-3.3-70b-versatile',
  TEMPERATURE = 0,
}

export enum vercelRoles {
  user = 'user',
  assistant = 'assistant',
}
