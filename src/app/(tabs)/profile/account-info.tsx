import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';

export default function AccountInfoPage() {
    const { profile, user } = useAuth();
    const router = useRouter();
    const { top } = useSafeAreaInsets();

    const infoItems = [
        { label: 'First Name', value: profile?.name || 'Not set', icon: 'account-outline' },
        { label: 'Last Name', value: profile?.surname || 'Not set', icon: 'account-outline' },
        { label: 'Email Address', value: user?.email || 'Not set', icon: 'email-outline' },
        { label: 'Gender', value: profile?.gender ? (profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)) : 'Not set', icon: 'gender-male-female' },
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
                <Text className="text-xl font-black font-inter-black text-slate-900">Account Info</Text>
                <View className="w-12" />
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                {/* Profile Avatar Card */}
                <View className="items-center mb-10">
                    <View className="w-32 h-32 bg-slate-50 rounded-full items-center justify-center border-8 border-slate-50 shadow-sm relative">
                        <MaterialCommunityIcons
                            name={profile?.gender === 'female' ? "face-woman" : "face-man"}
                            size={80}
                            color="#3A1AEB"
                        />
                        <TouchableOpacity className="absolute bottom-0 right-0 bg-[#3A1AEB] w-10 h-10 rounded-full items-center justify-center border-4 border-white">
                            <Ionicons name="camera" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info List */}
                <View className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                    {infoItems.map((item, index) => (
                        <View
                            key={index}
                            className={`flex-row items-center p-6 ${index !== infoItems.length - 1 ? 'border-b border-slate-50' : ''}`}
                        >
                            <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                                <MaterialCommunityIcons name={item.icon as any} size={24} color="#64748b" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs font-black font-inter-black text-slate-400 uppercase tracking-widest mb-1">
                                    {item.label}
                                </Text>
                                <Text className="text-base font-inter-bold font-bold text-slate-900">
                                    {item.value}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity className="mt-10 bg-[#3A1AEB] py-5 rounded-[24px] items-center justify-center shadow-lg shadow-[#3A1AEB]/30 mb-10">
                    <Text className="text-white font-black font-inter-black text-base uppercase tracking-widest">
                        Save Changes
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </Animated.View>
    );
}
