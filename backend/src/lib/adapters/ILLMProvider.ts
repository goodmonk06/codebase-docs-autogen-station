import { RepoSummary } from '../../types';

/**
 * LLM Provider Interface
 * Allows swapping between OpenAI, Anthropic, local LLMs, etc.
 */
export interface ILLMProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generateArchitectureDoc(summary: RepoSummary, customPrompt?: string): Promise<string>;
  generateApiDocs(summary: RepoSummary, customPrompt?: string): Promise<string>;
  generateReadme(summary: RepoSummary, customPrompt?: string): Promise<string>;
  estimateTokens(text: string): number;
}

/**
 * LLM Provider Configuration
 */
export interface LLMProviderConfig {
  apiKey?: string;
  model?: string;
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}
