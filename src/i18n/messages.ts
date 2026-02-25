import { enMessages } from './en';
import { frMessages } from './fr';

export type Locale = 'fr' | 'en';

export const messages = {
  fr: frMessages,
  en: enMessages,
} as const;

export type { TranslationKey } from './en';
