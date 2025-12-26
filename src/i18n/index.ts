import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';

import tr from './tr.json';
import es from './es.json';
import fr from './fr.json';
import de from './de.json';
import zh from './zh.json';
import ja from './ja.json';
import ko from './ko.json';
import ar from './ar.json';

const LANGUAGE_DETECTOR = {
    type: 'languageDetector',
    async: true,
    detect: async (callback: (lang: string) => void) => {
        try {
            // Check for saved language preference
            const savedLanguage = await AsyncStorage.getItem('user-language');
            if (savedLanguage) {
                return callback(savedLanguage);
            }

            // Fallback to device language
            const locale = Localization.getLocales()[0];
            return callback(locale?.languageCode || 'en');
        } catch (e) {
            console.log('Error reading language', e);
            return callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem('user-language', language);
        } catch (e) {
            console.log('Error saving language', e);
        }
    },
};

i18n
    .use(initReactI18next)
    .use(LANGUAGE_DETECTOR as any)
    .init({
        resources: {
            en: { translation: en },
            tr: { translation: tr },
            es: { translation: es },
            fr: { translation: fr },
            de: { translation: de },
            zh: { translation: zh },
            ja: { translation: ja },
            ko: { translation: ko },
            ar: { translation: ar },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        react: {
            useSuspense: false,
        },
    });

export default i18n;
