import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useWardrobe } from '../../../providers/WardrobeProvider';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatLabel } from '../../../utils/textUtils';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

export default function WardrobeDataPage() {
    const { items, loading } = useWardrobe();
    const router = useRouter();
    const { top, bottom } = useSafeAreaInsets();
    const { width } = Dimensions.get('window');
    const { t } = useTranslation();

    const stats = useMemo(() => {
        const categories = items.reduce((acc, item) => {
            const cat = (item.analysis?.basic_info?.category || item.basic_info?.category || 'Other').toLowerCase();
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const colors = items.reduce((acc, item) => {
            const color = (item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color || 'Other').toLowerCase();
            acc[color] = (acc[color] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const styles = items.reduce((acc, item) => {
            const style = (item.analysis?.attributes?.style || item.attributes?.style || 'Other').toLowerCase();
            acc[style] = (acc[style] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: items.length,
            categories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
            topColors: Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 5),
            topStyles: Object.entries(styles).sort((a, b) => b[1] - a[1]).slice(0, 5)
        };
    }, [items]);

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
                <Text className="text-xl font-black font-inter-black text-slate-900">{t('wardrobeData.title')}</Text>
                <View className="w-12" />
            </View>

            <ScrollView
                className="flex-1 px-6 pt-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: bottom + 120 }}
            >
                {/* Total Scale Card */}
                <View className="bg-[#3A1AEB] rounded-[40px] p-8 mb-8 flex-row items-center justify-between shadow-xl shadow-[#3A1AEB]/20">
                    <View>
                        <Text className="text-white/60 font-black font-inter-black text-xs uppercase tracking-[3px] mb-2">{t('wardrobeData.totalItems')}</Text>
                        <Text className="text-white text-5xl font-black font-inter-black">{stats.total}</Text>
                    </View>
                    <View className="w-20 h-20 bg-white/10 rounded-full items-center justify-center">
                        <MaterialCommunityIcons name="wardrobe" size={40} color="white" />
                    </View>
                </View>

                {/* Category Breakdown */}
                <View className="mb-8">
                    <View className="flex-row items-center justify-between mb-6 px-2">
                        <Text className="text-slate-900 font-black font-inter-black text-lg">{t('wardrobeData.distribution')}</Text>
                        <MaterialIcons name="pie-chart" size={20} color="#3A1AEB" />
                    </View>

                    <View className="bg-white rounded-[40px] border border-slate-100 p-6 shadow-sm">
                        {stats.categories.map(([name, count], index) => (
                            <View key={name} className="mb-6 last:mb-0">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-slate-700 font-inter-bold font-bold capitalize">{formatLabel(name)}</Text>
                                    <Text className="text-slate-400 font-inter-bold font-bold">{count}</Text>
                                </View>
                                <View className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                                    <View
                                        className="h-full bg-[#3A1AEB] rounded-full"
                                        style={{ width: `${(count / stats.total) * 100}%` }}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Top Styles & Colors */}
                <View className="flex-row gap-4 mb-10">
                    <View className="flex-1">
                        <View className="bg-fuchsia-50 rounded-[32px] p-6 border border-fuchsia-100 min-h-[160]">
                            <Text className="text-fuchsia-600 font-black font-inter-black text-[10px] uppercase tracking-widest mb-4">{t('wardrobeData.topStyles')}</Text>
                            {stats.topStyles.slice(0, 3).map(([style, count]) => (
                                <Text key={style} className="text-slate-800 font-inter-bold font-bold text-sm mb-1 capitalize" numberOfLines={1}>
                                    • {formatLabel(style)}
                                </Text>
                            ))}
                        </View>
                    </View>
                    <View className="flex-1">
                        <View className="bg-amber-50 rounded-[32px] p-6 border border-amber-100 min-h-[160]">
                            <Text className="text-amber-600 font-black font-inter-black text-[10px] uppercase tracking-widest mb-4">{t('wardrobeData.topColors')}</Text>
                            {stats.topColors.slice(0, 3).map(([color, count]) => (
                                <Text key={color} className="text-slate-800 font-inter-bold font-bold text-sm mb-1 capitalize" numberOfLines={1}>
                                    • {formatLabel(color)}
                                </Text>
                            ))}
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/wardrobe')}
                    className="bg-slate-900 py-5 rounded-[24px] items-center justify-center mb-4"
                >
                    <Text className="text-white font-black font-inter-black text-sm uppercase tracking-[3px]">{t('wardrobeData.manage')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </Animated.View>
    );
}
