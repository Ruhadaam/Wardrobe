import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';

// --- Types ---
interface SettingItemProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    subLabel?: string;
    type: 'switch' | 'link';
    value?: boolean;
    onValueChange?: (val: boolean) => void;
    onPress?: () => void;
}

// --- Component Dışına Alındı (Performans ve Bug Fix İçin Kritik) ---
const SettingItem = ({ icon, label, type, value, onValueChange, subLabel, onPress }: SettingItemProps) => {

    // Satırın tamamına basılınca ne olacağını yöneten fonksiyon
    const handleRowPress = () => {
        if (type === 'switch' && onValueChange) {
            // Switch ise değeri tersine çevir
            onValueChange(!value);
        } else if (onPress) {
            // Link ise verilen fonksiyonu çalıştır
            onPress();
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleRowPress}
            className="flex-row items-center border-b border-slate-50 last:border-b-0 p-6"
        >
            {/* Icon */}
            <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                <MaterialCommunityIcons name={icon} size={24} color="#64748b" />
            </View>

            {/* Texts */}
            <View className="flex-1 mr-4">
                <Text className="text-base font-bold text-slate-900">{label}</Text>
                {subLabel && (
                    <Text className="text-xs text-slate-400 font-medium mt-0.5">{subLabel}</Text>
                )}
            </View>

            {/* Action Element (Switch or Arrow) */}
            <View>
                {type === 'switch' ? (
                    <Switch
                        value={value}
                        // Switch'e doğrudan basıldığında da çalışması için:
                        onValueChange={onValueChange}
                        trackColor={{ false: '#f1f5f9', true: '#3A1AEB33' }}
                        thumbColor={value ? '#3A1AEB' : '#cbd5e1'}
                        // iOS'te switch stili için
                        ios_backgroundColor="#f1f5f9"
                    />
                ) : (
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
                )}
            </View>
        </TouchableOpacity>
    );
};

export default function SettingsPage() {
    const router = useRouter();
    const { top } = useSafeAreaInsets();

    const [notifications, setNotifications] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [faceId, setFaceId] = useState(true);

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
                <Text className="text-xl font-black text-slate-900">App Settings</Text>
                <View className="w-12" />
            </View>

            <ScrollView className="flex-1 pt-6" showsVerticalScrollIndicator={false}>
                {/* Notifications Section */}
                <View className="px-6 mb-8">
                    <Text className="text-slate-400 font-black text-xs uppercase tracking-[3px] mb-4 ml-2">Notifications</Text>
                    <View className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                        <SettingItem
                            icon="bell-outline"
                            label="Push Notifications"
                            subLabel="Outfit reminders & daily tips"
                            type="switch"
                            value={notifications}
                            onValueChange={setNotifications}
                        />

                    </View>
                </View>

                {/* Security Section */}
                <View className="px-6 mb-8">
                    <Text className="text-slate-400 font-black text-xs uppercase tracking-[3px] mb-4 ml-2">Security & Privacy</Text>
                    <View className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">

                        <SettingItem
                            icon="shield-check-outline"
                            label="Privacy Policy"
                            type="link"
                            onPress={() => console.log("Privacy clicked")}
                        />
                    </View>
                </View>

                {/* Preferences Section */}
                <View className="px-6 mb-10">
                    <Text className="text-slate-400 font-black text-xs uppercase tracking-[3px] mb-4 ml-2">Preferences</Text>
                    <View className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                        <SettingItem
                            icon="translate"
                            label="Language"
                            subLabel="English (US)"
                            type="link"
                            onPress={() => console.log("Language clicked")}
                        />

                    </View>
                </View>

                <View className="items-center mb-10">
                    <Text className="text-slate-300 font-medium text-xs">Wardrobe Build 1024</Text>
                    <Text className="text-[#3A1AEB] font-black text-[10px] mt-2 tracking-widest uppercase">Check for Updates</Text>
                </View>
            </ScrollView>
        </Animated.View>
    );
}