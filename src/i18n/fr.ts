import { enMessages } from './en';

export const frMessages = {
  ...enMessages,
} as const;

export type TranslationKey = keyof typeof frMessages;
export type TranslationDictionary = Record<TranslationKey, string>;
