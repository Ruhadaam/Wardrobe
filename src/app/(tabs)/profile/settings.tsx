import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    const [notifications, setNotifications] = useState(false);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [faceId, setFaceId] = useState(true);

    useEffect(() => {
        checkNotificationStatus();
    }, []);

    const checkNotificationStatus = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setNotifications(status === 'granted');
    };

    const handleNotificationToggle = async (value: boolean) => {
        if (value) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                setNotifications(false);
                Alert.alert(
                    t('settings.permissionDenied'),
                    t('settings.enableNotifications'),
                    [{ text: t('common.success') }]
                );
            } else {
                setNotifications(true);
            }
        } else {
            setNotifications(false);
        }
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
                <Text className="text-xl font-black text-slate-900">{t('settings.title')}</Text>
                <View className="w-12" />
            </View>

            <ScrollView className="flex-1 pt-6" showsVerticalScrollIndicator={false}>
                {/* Notifications Section */}
                <View className="px-6 mb-8">
                    <Text className="text-slate-400 font-black text-xs uppercase tracking-[3px] mb-4 ml-2">{t('settings.notifications')}</Text>
                    <View className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                        <SettingItem
                            icon="bell-outline"
                            label={t('settings.push')}
                            subLabel={t('settings.pushDesc')}
                            type="switch"
                            value={notifications}
                            onValueChange={handleNotificationToggle}
                        />

                    </View>
                </View>

                {/* Security Section */}
                <View className="px-6 mb-8">
                    <Text className="text-slate-400 font-black text-xs uppercase tracking-[3px] mb-4 ml-2">{t('settings.security')}</Text>
                    <View className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">

                        <SettingItem
                            icon="shield-check-outline"
                            label={t('settings.privacy')}
                            type="link"
                            onPress={() => router.push('/(tabs)/profile/privacy-policy')}
                        />
                    </View>
                </View>

                {/* Preferences Section */}
                <View className="px-6 mb-10">
                    <Text className="text-slate-400 font-black text-xs uppercase tracking-[3px] mb-4 ml-2">{t('settings.preferences')}</Text>
                    <View className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                        <SettingItem
                            icon="translate"
                            label={t('settings.language')}
                            subLabel="English (US)"
                            type="link"
                            onPress={() => router.push('/(tabs)/profile/language')}
                        />

                    </View>
                </View>

                <View className="items-center mb-10">
                    <Text className="text-slate-300 font-medium text-xs">Wardrobe Build 1024</Text>
                    <Text className="text-[#3A1AEB] font-black text-[10px] mt-2 tracking-widest uppercase">{t('settings.checkUpdates')}</Text>
                </View>
            </ScrollView>
        </Animated.View>
    );
}