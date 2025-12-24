import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { RevenueCatService } from '../lib/revenuecat';
import { useState, useEffect } from 'react';

export default function Header(props: any) {
    const { top } = useSafeAreaInsets();
    const { profile } = useAuth();
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            const status = await RevenueCatService.isPro();
            setIsPro(status);
        };
        checkStatus();
    }, []);

    // Credits hardcoded to 100 for now, as requested
    // Or use profile.credits if we added it to DB
    const credits = 100;

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
                    <Text className="text-slate-500 text-xs font-inter-medium">Welcome back,</Text>
                    <Text className="text-slate-900 font-black font-inter-black text-xl leading-tight">
                        {profile?.name || 'User'}
                    </Text>
                </View>
            </View>

            <View className={`flex-row items-center px-4 py-2.5 rounded-2xl border ${isPro ? 'bg-amber-100 border-amber-200' : 'bg-slate-100 border-slate-200'
                }`}>
                <View className={`${isPro ? 'bg-amber-500' : 'bg-slate-400'} p-1.5 rounded-lg shadow-sm`}>
                    <MaterialCommunityIcons
                        name={isPro ? "star-four-points" : "account-outline"}
                        size={14}
                        color="white"
                    />
                </View>
                <Text className={`${isPro ? 'text-amber-900' : 'text-slate-800'
                    } font-black font-inter-black ml-2.5 text-xs tracking-wider uppercase`}>
                    {isPro ? 'PREMIUM' : 'FREE'}
                </Text>
            </View>
        </View>
    );
}
