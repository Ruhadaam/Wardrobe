import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
];

interface LanguageSelectorProps {
    buttonStyle?: string;
    iconColor?: string;
}

export default function LanguageSelector({ buttonStyle, iconColor = "#64748b" }: LanguageSelectorProps) {
    const { t, i18n } = useTranslation();
    const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);

    const changeLanguage = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setLanguageModalVisible(false);
    };

    const currentLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

    return (
        <>
            <TouchableOpacity
                onPress={() => setLanguageModalVisible(true)}
                className={`flex-row items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 ${buttonStyle}`}
            >
                <Text className="text-base mr-2">{currentLanguage.flag}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={iconColor} />
            </TouchableOpacity>

            <Modal
                visible={isLanguageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLanguageModalVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/40 justify-center items-center"
                    activeOpacity={1}
                    onPress={() => setLanguageModalVisible(false)}
                >
                    <View className="bg-white m-5 w-3/4 max-w-sm rounded-[32px] p-6 shadow-xl">
                        <Text className="text-lg font-black font-inter-black text-center mb-6 text-slate-900">{t('header.language')}</Text>
                        <View style={{ maxHeight: 400 }}>
                            <FlatList
                                data={LANGUAGES}
                                keyExtractor={(item) => item.code}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        className={`flex-row items-center p-4 rounded-2xl mb-2 ${i18n.language === item.code ? 'bg-[#3A1AEB]/5' : 'bg-slate-50'}`}
                                        onPress={() => changeLanguage(item.code)}
                                    >
                                        <Text className="text-2xl mr-4">{item.flag}</Text>
                                        <Text className={`text-base font-inter-medium flex-1 ${i18n.language === item.code ? 'text-[#3A1AEB]' : 'text-slate-700'}`}>
                                            {item.label}
                                        </Text>
                                        {i18n.language === item.code && (
                                            <MaterialCommunityIcons name="check-circle" size={20} color="#3A1AEB" />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                        <TouchableOpacity
                            className="mt-4 p-4 bg-slate-100 rounded-2xl items-center"
                            onPress={() => setLanguageModalVisible(false)}
                        >
                            <Text className="text-slate-600 font-inter-bold font-bold">Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}
