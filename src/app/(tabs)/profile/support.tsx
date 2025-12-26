import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, LayoutAnimation } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

export default function SupportPage() {
    const router = useRouter();
    const { top } = useSafeAreaInsets();
    const { t } = useTranslation();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: t('support.faqs.q1'),
            answer: t('support.faqs.a1')
        },
        {
            question: t('support.faqs.q2'),
            answer: t('support.faqs.a2')
        },
        {
            question: t('support.faqs.q3'),
            answer: t('support.faqs.a3')
        },
        {
            question: t('support.faqs.q4'),
            answer: t('support.faqs.a4')
        }
    ];

    const toggleExpand = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

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
                <Text className="text-xl font-black font-inter-black text-slate-900">{t('support.title')}</Text>
                <View className="w-12" />
            </View>

            <ScrollView className="flex-1 pt-6" showsVerticalScrollIndicator={false}>
                {/* FAQ Section */}
                <View className="px-6 mb-10">
                    <Text className="text-slate-400 font-black font-inter-black text-xs uppercase tracking-[3px] mb-6 ml-2">{t('support.commonQuestions')}</Text>
                    <View className="gap-4">
                        {faqs.map((faq, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                onPress={() => toggleExpand(index)}
                                className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm overflow-hidden"
                            >
                                <View className="flex-row items-center justify-between">
                                    <Text className="flex-1 text-slate-800 font-inter-bold font-bold text-base pr-4">{faq.question}</Text>
                                    <Ionicons
                                        name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#3A1AEB"
                                    />
                                </View>
                                {expandedIndex === index && (
                                    <Text className="text-slate-500 font-inter-medium text-sm mt-4 leading-6">
                                        {faq.answer}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Contact Section */}
                <View className="px-6 mb-10">
                    <Text className="text-slate-400 font-black font-inter-black text-xs uppercase tracking-[3px] mb-6 ml-2">{t('support.stillNeedHelp')}</Text>
                    <View className="flex-row">
                        <TouchableOpacity className="flex-1 bg-slate-900 rounded-[32px] p-6 items-center justify-center shadow-lg">
                            <View className="w-12 h-12 bg-white/10 rounded-full items-center justify-center mb-4">
                                <MaterialCommunityIcons name="email-fast-outline" size={24} color="white" />
                            </View>
                            <Text className="text-white font-inter-bold font-bold">{t('support.emailUs')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="px-6 mb-10 items-center">
                    <Text className="text-slate-300 font-inter-medium text-xs mb-4">{t('profile.version')}</Text>
                    <View className="flex-row gap-6">
                        <Text className="text-slate-400 font-inter-bold font-bold text-[10px] uppercase tracking-widest">{t('support.privacy')}</Text>
                        <Text className="text-slate-400 font-inter-bold font-bold text-[10px] uppercase tracking-widest">{t('support.terms')}</Text>
                    </View>
                </View>
            </ScrollView>
        </Animated.View>
    );
}
