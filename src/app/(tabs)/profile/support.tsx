import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, LayoutAnimation } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';

export default function SupportPage() {
    const router = useRouter();
    const { top } = useSafeAreaInsets();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: "How do I add a new item?",
            answer: "Go to the Wardrobe tab and tap the 'New' button at the top right. You can take a photo with your camera or select one from your gallery. Our AI will automatically analyze it and remove the background."
        },
        {
            question: "What is the Free Plan limit?",
            answer: "The Free Plan allows you to store up to 20 items in your wardrobe and generate 2 outfits per day. Upgrade to Pro for unlimited storage and creation!"
        },
        {
            question: "How does the AI Stylist work?",
            answer: "Our stylist analyzes the color, season, and style of your clothes to create harmonized outfits based on your preferences. The more clothes you add, the better the suggestions become."
        },
        {
            question: "Can I use the app offline?",
            answer: "Wardrobe requires an internet connection for AI analysis and cloud syncing, but you can view your existing collection offline."
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
                <Text className="text-xl font-black font-inter-black text-slate-900">Help & Support</Text>
                <View className="w-12" />
            </View>

            <ScrollView className="flex-1 pt-6" showsVerticalScrollIndicator={false}>
                {/* FAQ Section */}
                <View className="px-6 mb-10">
                    <Text className="text-slate-400 font-black font-inter-black text-xs uppercase tracking-[3px] mb-6 ml-2">Common Questions</Text>
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
                    <Text className="text-slate-400 font-black font-inter-black text-xs uppercase tracking-[3px] mb-6 ml-2">Still need help?</Text>
                    <View className="flex-row gap-4">
                        <TouchableOpacity className="flex-1 bg-slate-900 rounded-[32px] p-6 items-center justify-center shadow-lg">
                            <View className="w-12 h-12 bg-white/10 rounded-full items-center justify-center mb-4">
                                <MaterialCommunityIcons name="email-fast-outline" size={24} color="white" />
                            </View>
                            <Text className="text-white font-inter-bold font-bold">Email Us</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-1 bg-[#3A1AEB] rounded-[32px] p-6 items-center justify-center shadow-lg shadow-[#3A1AEB]/20">
                            <View className="w-12 h-12 bg-white/10 rounded-full items-center justify-center mb-4">
                                <MaterialCommunityIcons name="chat-processing-outline" size={24} color="white" />
                            </View>
                            <Text className="text-white font-inter-bold font-bold">Chat Live</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="px-6 mb-10 items-center">
                    <Text className="text-slate-300 font-inter-medium text-xs mb-4">You are using Wardrobe v1.2.0</Text>
                    <View className="flex-row gap-6">
                        <Text className="text-slate-400 font-inter-bold font-bold text-[10px] uppercase tracking-widest">Privacy Policy</Text>
                        <Text className="text-slate-400 font-inter-bold font-bold text-[10px] uppercase tracking-widest">Terms of Service</Text>
                    </View>
                </View>
            </ScrollView>
        </Animated.View>
    );
}
