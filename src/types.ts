export interface TokenInfo {
  text: string;
  id: number;
  bytes: number[];
  probability: number;
}

export type ModelType =
  | 'gpt2-base'
  | 'gpt2-shakespeare'
  | 'gpt2-scifi'
  | 'gpt2-recipes'
  | 'gpt2-holmes'
  | 'gpt2-custom';

export interface DatasetPreset {
  id: ModelType;
  name: string;
  badge: string;
  author: string;
  description: string;
  samplePrompt: string;
  sampleDataset: string;
  tags: string[];
}

export interface Hyperparameters {
  modelSize: 'gpt2-small' | 'gpt2-medium' | 'gpt2-large';
  epochs: number;
  learningRate: number; // e.g. 5e-5
  batchSize: number;
  gradientAccumulationSteps: number;
  warmupSteps: number;
  weightDecay: number;
  maxSeqLength: number;
  optimizer: 'AdamW' | 'Adam' | 'SGD';
}

export interface TrainingStepMetric {
  epoch: number;
  step: number;
  totalSteps: number;
  loss: number;
  valLoss: number;
  perplexity: number;
  learningRate: number;
  sampleOutput: string;
}

export interface GenerationParams {
  temperature: number;
  topK: number;
  topP: number;
  maxTokens: number;
  repetitionPenalty: number;
}

export interface GenerationResult {
  modelName: string;
  modelType: ModelType;
  prompt: string;
  continuation: string;
  fullText: string;
  tokens: TokenInfo[];
  generationParams: GenerationParams;
}
