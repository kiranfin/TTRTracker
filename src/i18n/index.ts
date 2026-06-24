import { de } from './de';
import { en } from './en';

export type AppLanguage = 'de' | 'en';

type WidenTranslations<TValue> = TValue extends string
  ? string
  : { [Key in keyof TValue]: WidenTranslations<TValue[Key]> };

export type TranslationResource = WidenTranslations<typeof de>;

export const DEFAULT_LANGUAGE: AppLanguage = 'de';

export const translations: Record<AppLanguage, TranslationResource> = {
  de,
  en,
};

export const languageOptions = [
  { value: 'de', labelKey: 'settings.german' },
  { value: 'en', labelKey: 'settings.english' },
] as const satisfies ReadonlyArray<{
  value: AppLanguage;
  labelKey: TranslationKey;
}>;

type Join<Prefix extends string, Key extends string> = Prefix extends ''
  ? Key
  : `${Prefix}.${Key}`;

type LeafPaths<TValue, Prefix extends string = ''> = TValue extends string
  ? Prefix
  : {
      [Key in keyof TValue & string]: LeafPaths<TValue[Key], Join<Prefix, Key>>;
    }[keyof TValue & string];

export type TranslationKey = LeafPaths<TranslationResource>;
export type TranslationParams = Record<string, string | number | boolean | null | undefined>;
