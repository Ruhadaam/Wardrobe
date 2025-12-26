import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicyPage() {
    const router = useRouter();
    const { top } = useSafeAreaInsets();
    const { t } = useTranslation();

    const sections = [
        {
            title: t('privacyPolicy.sections.collection.title'),
            content: t('privacyPolicy.sections.collection.content'),
            icon: "database-outline" as const
        },
        {
            title: t('privacyPolicy.sections.security.title'),
            content: t('privacyPolicy.sections.security.content'),
            icon: "shield-lock-outline" as const
        },
        {
            title: t('privacyPolicy.sections.thirdParty.title'),
            content: t('privacyPolicy.sections.thirdParty.content'),
            icon: "api" as const
        },
        {
            title: t('privacyPolicy.sections.rights.title'),
            content: t('privacyPolicy.sections.rights.content'),
            icon: "gavel" as const
        }
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
                <Text className="text-xl font-black text-slate-900">{t('privacyPolicy.title')}</Text>
                <View className="w-12" />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="px-6 pt-6">
                    <View className="bg-[#3A1AEB]/5 p-6 rounded-[32px] border border-[#3A1AEB]/10 mb-8">
                        <Text className="text-[#3A1AEB] font-inter-bold font-bold text-sm uppercase tracking-widest mb-2">{t('privacyPolicy.lastUpdated')}</Text>
                        <Text className="text-slate-900 font-black font-inter-black text-2xl">{t('privacyPolicy.date')}</Text>
                    </View>

                    {sections.map((section, index) => (
                        <View key={index} className="mb-8">
                            <View className="flex-row items-center mb-4">
                                <View className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                                    <MaterialCommunityIcons name={section.icon} size={20} color="#3A1AEB" />
                                </View>
                                <Text className="text-lg font-black text-slate-900">{section.title}</Text>
                            </View>
                            <Text className="text-slate-500 leading-6 font-inter-medium ml-1">
                                {section.content}
                            </Text>
                        </View>
                    ))}

                    <View className="mt-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                        <Text className="text-slate-400 text-xs text-center font-inter-medium leading-5">
                            {t('privacyPolicy.footer')}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </Animated.View>
    );
}
