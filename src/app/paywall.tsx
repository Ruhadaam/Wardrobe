import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { RevenueCatService } from '../lib/revenuecat';
import { PurchasesPackage } from 'react-native-purchases';
import Animated, { FadeInUp, FadeInRight, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FEATURE_LIST = [
    { id: 1, title: 'Limitless Outfits', icon: 'sparkles', desc: 'Create as many outfits as you want (2 per day on free)' },
    { id: 2, title: 'Unlimited Closet', icon: 'infinite', desc: 'Add unlimited clothes (20 pieces on free)' },
    { id: 3, title: 'No Advertisements', icon: 'megaphone-outline', desc: 'Enjoy an ad-free styling experience' },
    { id: 4, title: 'Smart Coordination', icon: 'color-palette-outline', desc: 'AI-powered coordination for a perfect look' },
];

export default function PaywallScreen() {
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [purchasing, setPurchasing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        try {
            const offerings = await RevenueCatService.getOfferings();
            if (offerings && offerings.availablePackages) {
                setPackages(offerings.availablePackages);
            }
        } catch (e) {
            console.error('Error loading offerings:', e);
            Alert.alert('Error', 'Could not load subscription options. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (pack: PurchasesPackage) => {
        setPurchasing(true);
        try {
            const customerInfo = await RevenueCatService.purchasePackage(pack);
            if (customerInfo.entitlements.active['pro']) {
                Alert.alert('Success', 'Welcome to Pro! Your account has been upgraded.', [
                    { text: 'Great!', onPress: () => router.back() }
                ]);
            }
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert('Purchase Error', e.message || 'An error occurred during purchase.');
            }
        } finally {
            setPurchasing(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            const customerInfo = await RevenueCatService.restorePurchases();
            if (customerInfo.entitlements.active['pro']) {
                Alert.alert('Restored', 'Your Pro subscription has been restored.', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('No Subscription Found', 'We could not find any active Pro subscriptions for your account.');
            }
        } catch (e) {
            Alert.alert('Restore Error', 'An error occurred while restoring purchases.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-[#0F172A] justify-center items-center">
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="text-white mt-4 font-inter-medium">Loading premium plans...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#0F172A]">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header */}
                <View className="pt-16 px-6 pb-10">
                    <TouchableOpacity onPress={() => router.back()} className="mb-6">
                        <Ionicons name="close" size={28} color="white" opacity={0.6} />
                    </TouchableOpacity>

                    <Animated.View entering={FadeInUp.delay(200)}>
                        <Text className="text-4xl font-inter-black text-white leading-tight">
                            Unlock Your{"\n"}
                            <Text className="text-[#818CF8]">Wardrobe's Potential</Text>
                        </Text>
                        <Text className="text-slate-400 mt-3 text-lg font-inter-medium">
                            Upgrade to Pro for the ultimate styling experience.
                        </Text>
                    </Animated.View>
                </View>

                {/* Features */}
                <View className="px-6 space-y-6">
                    {FEATURE_LIST.map((feature, index) => (
                        <Animated.View
                            key={feature.id}
                            entering={FadeInRight.delay(400 + index * 100)}
                            className="flex-row items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50"
                        >
                            <View className="w-12 h-12 bg-indigo-500/20 rounded-xl justify-center items-center mr-4">
                                <Ionicons name={feature.icon as any} size={24} color="#818CF8" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-inter-bold text-base">{feature.title}</Text>
                                <Text className="text-slate-400 text-sm">{feature.desc}</Text>
                            </View>
                        </Animated.View>
                    ))}
                </View>

                {/* Plans */}
                <View className="px-6 mt-12">
                    <Text className="text-white font-inter-bold text-lg mb-4">Choose Your Plan</Text>
                    {packages.length === 0 ? (
                        <View className="bg-slate-800/50 p-6 rounded-2xl items-center">
                            <Text className="text-slate-400 text-center">No plans available at the moment.</Text>
                        </View>
                    ) : (
                        packages.map((pack, index) => (
                            <Animated.View key={pack.identifier} entering={FadeInUp.delay(800 + index * 100)}>
                                <TouchableOpacity
                                    disabled={purchasing}
                                    onPress={() => handlePurchase(pack)}
                                    className="bg-indigo-600 p-6 rounded-2xl mb-4 shadow-lg shadow-indigo-500/20"
                                >
                                    <View className="flex-row justify-between items-center">
                                        <View>
                                            <Text className="text-white font-inter-black text-xl">
                                                {pack.product.title.split(' (')[0]}
                                            </Text>
                                            <Text className="text-indigo-200 text-sm mt-1">
                                                {pack.packageType === 'ANNUAL' ? 'Best Value' : 'Cancel anytime'}
                                            </Text>
                                        </View>
                                        <View className="bg-white/10 px-4 py-2 rounded-xl">
                                            <Text className="text-white font-inter-bold text-lg">
                                                {pack.product.priceString}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    )}
                </View>

                {/* Footer */}
                <View className="px-6 mt-8 items-center">
                    <TouchableOpacity onPress={handleRestore} disabled={purchasing || loading}>
                        <Text className="text-slate-500 font-inter-medium hover:text-indigo-400">
                            Restore Purchases
                        </Text>
                    </TouchableOpacity>
                    <Text className="text-slate-600 text-[10px] text-center mt-6 px-4">
                        By subscribing, you agree to our Terms of Use and Privacy Policy. Subscription will automatically renew unless canceled.
                    </Text>
                </View>
            </ScrollView>

            {purchasing && (
                <View className="absolute inset-0 bg-black/60 justify-center items-center">
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text className="text-white mt-4 font-inter-bold">Processing...</Text>
                </View>
            )}
        </View>
    );
}
