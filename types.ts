export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export type LanguageCode = 'en' | 'tr' | 'es' | 'de' | 'fr';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  imageUrl?: string; // Base64 string for displayed images
  isError?: boolean; // Indicates if this message represents an error state
  translations?: Record<string, string>; // Cache for translations: { 'en': 'Hello', 'tr': 'Merhaba' }
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface GeminiConfig {
  temperature: number;
  topP: number;
  topK: number;
}