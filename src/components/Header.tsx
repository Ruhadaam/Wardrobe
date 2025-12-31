import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' }
];

export default function Header(props: any) {
    const { top } = useSafeAreaInsets();
    const { profile, isPremium } = useAuth();
    const { t, i18n } = useTranslation();
    const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);

    const toggleLanguageModal = () => {
        setLanguageModalVisible(!isLanguageModalVisible);
    };

    const changeLanguage = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setLanguageModalVisible(false);
    };

    const currentLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

    return (
        <View
            style={{ paddingTop: top + 15 }}
            className="bg-white px-5 border-b border-slate-100 p-4 flex-row justify-between items-center"
        >
            <View className="flex-row items-center">
                <View className="w-11 h-11 bg-[#3A1AEB]/5 rounded-full items-center justify-center border border-[#3A1AEB]/10 mr-3">
                    {profile?.gender === 'female' ? (
                        <MaterialCommunityIcons name="face-woman" size={26} color="#3A1AEB" />
                    ) : (
                        <MaterialCommunityIcons name="face-man" size={26} color="#3A1AEB" />
                    )}
                </View>
                <View>
                    <Text className="text-slate-500 text-xs font-inter-medium">{t('common.welcomeBack')}</Text>
                    <Text className="text-slate-900 font-black font-inter-black text-xl leading-tight">
                        {profile?.name || 'User'}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center gap-4">
                {/* Language Selector */}
                <TouchableOpacity
                    onPress={toggleLanguageModal}
                    className="flex-row items-center bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200"
                >
                    <Text className="text-base mr-1">{currentLanguage.flag}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color="#64748b" />
                </TouchableOpacity>

                <View className={`flex-row items-center px-4 py-2.5 rounded-2xl border ${isPremium ? 'bg-amber-100 border-amber-200' : 'bg-slate-100 border-slate-200'
                    }`}>
                    <View className={`${isPremium ? 'bg-amber-500' : 'bg-slate-400'} p-1.5 rounded-lg shadow-sm`}>
                        <MaterialCommunityIcons
                            name={isPremium ? "star-four-points" : "account-outline"}
                            size={14}
                            color="white"
                        />
                    </View>
                    <Text className={`${isPremium ? 'text-amber-900' : 'text-slate-800'
                        } font-black font-inter-black ml-2.5 text-xs tracking-wider uppercase`}>
                        {isPremium ? t('common.premium') : t('common.free')}
                    </Text>
                </View>
            </View>

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
                    <View className="bg-white m-5 w-3/4 rounded-2xl p-4 shadow-xl">
                        <Text className="text-lg font-inter-bold text-center mb-4">{t('header.language')}</Text>
                        <FlatList
                            data={LANGUAGES}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className={`flex-row items-center p-4 border-b border-slate-100 ${i18n.language === item.code ? 'bg-indigo-50' : ''}`}
                                    onPress={() => changeLanguage(item.code)}
                                >
                                    <Text className="text-2xl mr-4">{item.flag}</Text>
                                    <Text className={`text-base font-inter-medium ${i18n.language === item.code ? 'text-indigo-600' : 'text-slate-700'}`}>
                                        {item.label}
                                    </Text>
                                    {i18n.language === item.code && (
                                        <View className="flex-1 items-end">
                                            <MaterialCommunityIcons name="check" size={20} color="#4F46E5" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            className="mt-4 p-3 bg-slate-100 rounded-xl items-center"
                            onPress={() => setLanguageModalVisible(false)}
                        >
                            <Text className="text-slate-600 font-inter-medium">Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
