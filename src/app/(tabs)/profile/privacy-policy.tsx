import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';

export default function PrivacyPolicyPage() {
    const router = useRouter();
    const { top } = useSafeAreaInsets();

    const sections = [
        {
            title: "Data Collection",
            content: "We collect certain information about how you use our app, including your wardrobe items, outfit preferences, and usage analytics to improve our AI generation.",
            icon: "database-outline" as const
        },
        {
            title: "Data Security",
            content: "Your data is stored securely using Supabase. We prioritize the security and confidentiality of your personal information and wardrobe data.",
            icon: "shield-lock-outline" as const
        },
        {
            title: "Third-Party Services",
            content: "We use third-party services like Google Vision and Gemini for image analysis. These services only receive the images you choose to upload for wardrobe processing.",
            icon: "api" as const
        },
        {
            title: "Your Rights",
            content: "You have the right to access, correct, or delete your data at any time through the app settings or by contacting our support team.",
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
                <Text className="text-xl font-black text-slate-900">Privacy Policy</Text>
                <View className="w-12" />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="px-6 pt-6">
                    <View className="bg-[#3A1AEB]/5 p-6 rounded-[32px] border border-[#3A1AEB]/10 mb-8">
                        <Text className="text-[#3A1AEB] font-inter-bold font-bold text-sm uppercase tracking-widest mb-2">Last Updated</Text>
                        <Text className="text-slate-900 font-black font-inter-black text-2xl">December 2025</Text>
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
                            By using Ornatus, you agree to the collection and use of information in accordance with this policy. We may update this policy periodically.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </Animated.View>
    );
}
