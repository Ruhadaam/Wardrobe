import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

export default function LanguagePage() {
    const router = useRouter();
    const { top } = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');

    const languages = [
        { id: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
        { id: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
        { id: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
        { id: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
        { id: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
        { id: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
        { id: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
        { id: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
        { id: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
        { id: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
    ];

    return (
        <Animated.View entering={FadeInRight.duration(400)} className="flex-1 bg-white">
            {/* Custom Header */}
            <View
                className="px-6 pb-4 flex-row items-center justify-between"
                style={{ paddingTop: Platform.OS === 'ios' ? top : top + 10 }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100"
                >
                    <Ionicons name="chevron-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-slate-900">{t('language.title')}</Text>
                <View className="w-12" />
            </View>

            <ScrollView className="flex-1 pt-6" showsVerticalScrollIndicator={false}>
                <View className="px-6 mb-8">
                    <Text className="text-slate-400 font-black text-xs uppercase tracking-[3px] mb-4 ml-2">{t('language.select')}</Text>
                    <View className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                        {languages.map((lang, index) => {
                            const isSelected = selectedLanguage === lang.id;
                            return (
                                <TouchableOpacity
                                    key={lang.id}
                                    onPress={() => {
                                        setSelectedLanguage(lang.id);
                                        i18n.changeLanguage(lang.id);
                                    }}
                                    activeOpacity={0.7}
                                    className={`flex-row items-center p-6 ${index !== languages.length - 1 ? 'border-b border-slate-50' : ''}`}
                                >
                                    <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                                        <Text className="text-2xl">{lang.flag}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`text-base font-bold ${isSelected ? 'text-[#3A1AEB]' : 'text-slate-900'}`}>{lang.native}</Text>
                                        <Text className="text-xs text-slate-400 font-medium mt-0.5">{lang.name}</Text>
                                    </View>
                                    {isSelected && (
                                        <View className="w-6 h-6 rounded-full bg-[#3A1AEB] items-center justify-center">
                                            <Ionicons name="checkmark" size={16} color="white" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View className="px-6 pb-10">
                    <View className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="information-circle-outline" size={18} color="#64748b" />
                            <Text className="text-slate-500 font-bold ml-2 text-xs uppercase tracking-wider">{t('language.note')}</Text>
                        </View>
                        <Text className="text-slate-400 text-[11px] font-inter-medium leading-5">
                            {t('language.noteDesc')}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </Animated.View>
    );
}
