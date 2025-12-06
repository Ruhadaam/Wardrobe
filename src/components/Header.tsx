import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';

export default function Header() {
    const { top } = useSafeAreaInsets();
    const { profile } = useAuth();

    // Credits hardcoded to 100 for now, as requested
    // Or use profile.credits if we added it to DB
    const credits = 100;

    return (
        <View
            style={{ paddingTop: top + 10 }}
            className="bg-slate-900 px-5 pb-4 flex-row justify-between items-center"
        >
            <View className="flex-row items-center">
                <View className="w-10 h-10 bg-cyan-500/10 rounded-full items-center justify-center border border-cyan-500/20 mr-3">
                    {profile?.gender === 'female' ? (
                        <MaterialCommunityIcons name="face-woman" size={24} color="#06b6d4" />
                    ) : (
                        <MaterialCommunityIcons name="face-man" size={24} color="#06b6d4" />
                    )}
                </View>
                <View>
                    <Text className="text-slate-400 text-xs font-medium">Welcome back,</Text>
                    <Text className="text-white font-bold text-lg leading-tight">
                        {profile?.name || 'User'}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                <MaterialCommunityIcons name="star-four-points" size={16} color="#fbbf24" />
                <Text className="text-amber-400 font-bold ml-1.5">{credits}</Text>
            </View>
        </View>
    );
}
