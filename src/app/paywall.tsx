import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,

    StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { PurchasesPackage } from 'react-native-purchases';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Kendi importların (Dosya yollarının doğru olduğundan emin ol)
import { RevenueCatService } from '../lib/revenuecat';
import { useAuth } from '../providers/AuthProvider';

// --- BİLEŞEN TANIMLARI IMPORTLARDAN SONRA GELMELİ ---


const PackageItem = ({ pack, isSelected, onSelect, savings, purchasing }: {
    pack: PurchasesPackage;
    isSelected: boolean;
    onSelect: (pack: PurchasesPackage) => void;
    savings: number | null;
    purchasing: boolean;
}) => {
    const isAnnual = pack.packageType === 'ANNUAL';

    // GÜVENLİ FİYAT MANTIĞI
    const price = pack.product?.price || 0;
    const currencyCode = pack.product?.currencyCode || 'USD';
    
    // Currency code'u sembole çevir
    const getCurrencySymbol = (code: string) => {
        const currencyMap: { [key: string]: string } = {
            'TRY': '₺',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
        };
        return currencyMap[code] || code;
    };
    
    const currencySymbol = getCurrencySymbol(currencyCode);

    const displayPrice = isAnnual && price > 0
        ? (price / 12).toFixed(2)
        : pack.product?.priceString || 'N/A';

    // Yıllık için manuel formatlama, aylık için priceString kullan
    const finalPriceString = (isAnnual && price > 0)
        ? `${currencySymbol}${displayPrice}`
        : displayPrice;

    const handlePress = () => {
        try {
            console.log('PackageItem pressed:', pack.identifier);
            onSelect(pack);
        } catch (error) {
            console.error('Error in PackageItem onPress:', error);
        }
    };

    return (
        <View className="mb-4">
            <TouchableOpacity
                disabled={purchasing}
                activeOpacity={0.8}
                onPress={handlePress}
                style={isSelected ? {
                    shadowColor: '#818cf8',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 8,
                } : {}}
                className={`relative bg-white p-1 rounded-2xl border-2 ${isSelected ? 'border-indigo-600' : 'border-slate-100'
                    }`}
            >
                {/* SAVINGS BADGE */}
                {isAnnual && savings ? (
                    <View 
                        className="absolute -top-3 right-4 bg-green-500 px-3 py-1 rounded-full z-10"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2,
                        }}
                    >
                        <Text className="text-white font-inter-bold text-xs">
                            SAVE {savings}%
                        </Text>
                    </View>
                ) : null}

                <View className={`p-4 rounded-xl ${isSelected ? 'bg-indigo-50/50' : 'bg-white'}`}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            {/* Radio Button */}
                            <View className={`w-5 h-5 rounded-full border-2 mr-3 justify-center items-center ${isSelected ? 'border-indigo-600' : 'border-slate-300'
                                }`}>
                                {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                            </View>

                            <View>
                                <Text className={`font-inter-bold text-lg ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                    {isAnnual ? 'Annual Access' : 'Monthly Access'}
                                </Text>
                                {isAnnual && (
                                    <Text className="text-indigo-600/80 font-inter-medium text-xs mt-0.5">
                                        {pack.product?.priceString}/year
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Fiyat Gösterimi */}
                        <View className="items-end">
                            <Text className="text-slate-900 font-inter-black text-xl">
                                {finalPriceString}
                            </Text>
                            <Text className="text-slate-400 font-inter-medium text-xs">
                                /month
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const FEATURE_LIST = [
    {
        id: 1,
        title: 'AI Personal Stylist',
        icon: 'sparkles',
        desc: 'Get daily outfit suggestions perfectly matched to weather & occasion.'
    },
    {
        id: 2,
        title: 'Digitize Your Wardrobe',
        icon: 'infinite',
        desc: 'Add unlimited clothes. Carry your entire closet in your pocket.'
    },
    {
        id: 3,
        title: 'Zero Distractions',
        icon: 'diamond-outline',
        desc: 'Enjoy a completely ad-free, focused styling experience.'
    },
];

export default function PaywallScreen() {
    const insets = useSafeAreaInsets();
    const { refreshPremiumStatus } = useAuth();
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [purchasing, setPurchasing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        try {
            const offerings = await RevenueCatService.getOfferings();
            if (offerings && offerings.availablePackages) {
                const sortedPackages = [...offerings.availablePackages].sort((a, b) => {
                    if (a.packageType === 'ANNUAL' && b.packageType !== 'ANNUAL') return -1;
                    if (a.packageType !== 'ANNUAL' && b.packageType === 'ANNUAL') return 1;
                    return 0;
                });
                setPackages(sortedPackages);

                // Varsayılan seçim kaldırıldı
                // const annualPackage = sortedPackages.find(p => p.packageType === 'ANNUAL');
                // if (annualPackage) {
                //     setSelectedPackage(annualPackage);
                // } else if (sortedPackages.length > 0) {
                //     setSelectedPackage(sortedPackages[0]);
                // }
            }
        } catch (e) {
            console.error('Error loading offerings:', e);
            Alert.alert('Error', 'Could not load subscription options.');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (pack: PurchasesPackage) => {
        console.log('handlePurchase called for package:', pack.identifier);
        setSelectedPackage(pack);
        setPurchasing(true); // Spinner'ı hemen göster

        try {
            console.log('Calling RevenueCat.purchasePackage...');
            // Purchase işlemini setTimeout ile biraz geciktirerek navigation context'in hazır olmasını sağla
            await new Promise(resolve => setTimeout(resolve, 100));
            const customerInfo = await RevenueCatService.purchasePackage(pack);
            // Başarılı ise context'i güncelle ve geri dön
            if (customerInfo.entitlements.active['Wardrobe Pro']) {
                console.log('Purchase successful! Updating context...');
                await refreshPremiumStatus();
                console.log('Context updated. Navigating back...');
                // Navigation'ı güvenli şekilde kullan
                await new Promise(resolve => setTimeout(resolve, 100));
                try {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(tabs)/wardrobe');
                    }
                } catch (navError) {
                    console.error('Navigation error:', navError);
                    // Navigation hatası olsa bile devam et
                    router.replace('/(tabs)/wardrobe');
                }
            }
        } catch (e: any) {
            console.error('Purchase error:', e);
            if (!e.userCancelled) {
                Alert.alert('Purchase Error', e.message || 'An error occurred during purchase');
            }
        } finally {
            setPurchasing(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            const customerInfo = await RevenueCatService.restorePurchases();
            if (customerInfo.entitlements.active['Wardrobe Pro']) {
                await refreshPremiumStatus();
                Alert.alert('Success', 'Subscription restored successfully!');
                // Navigation'ı güvenli şekilde kullan
                try {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(tabs)/wardrobe');
                    }
                } catch (navError) {
                    console.error('Navigation error:', navError);
                    router.replace('/(tabs)/wardrobe');
                }
            } else {
                Alert.alert('Info', 'No active subscription found to restore.');
            }
        } catch (e) {
            Alert.alert('Error', 'Could not restore purchases.');
        } finally {
            setLoading(false);
        }
    };

    const calculateSavings = () => {
        const annual = packages.find(p => p.packageType === 'ANNUAL');
        const monthly = packages.find(p => p.packageType === 'MONTHLY');

        if (!annual || !monthly || !annual.product?.price || !monthly.product?.price) return null;

        const annualPrice = annual.product.price;
        const monthlyPrice = monthly.product.price;
        const monthlyYearly = monthlyPrice * 12;

        if (monthlyYearly <= 0) return null;

        return Math.round(((monthlyYearly - annualPrice) / monthlyYearly) * 100);
    };

    const savings = calculateSavings();

    if (loading) {
        return (
            <View className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="light-content" />

            {/* Header Background */}
            <View className="absolute top-0 left-0 right-0 h-[45%] bg-indigo-600 overflow-hidden rounded-b-[32px]">
                <LinearGradient
                    colors={['#4F46E5', '#4338ca', '#312e81']}
                    className="absolute inset-0"
                />
                <View className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <View className="absolute top-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl" />
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 140 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Navbar Area */}
                <Animated.View 
                    entering={FadeIn.duration(300).delay(100)}
                    style={{ paddingTop: insets.top }} 
                    className="px-6 pb-4"
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/20 rounded-full justify-center items-center"
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View 
                    entering={FadeInDown.duration(500).delay(200)}
                    className="px-6 mb-8 mt-2"
                >
                    <View>
                        <Animated.View 
                            entering={FadeInRight.duration(400).delay(300)}
                            className="bg-indigo-500/30 self-start px-3 py-1 rounded-full border border-indigo-400/30 mb-3"
                        >
                            <Text className="text-indigo-100 font-inter-bold text-xs uppercase tracking-wider">
                                Premium Upgrade
                            </Text>
                        </Animated.View>
                        <Text className="text-white font-inter-black text-4xl leading-tight">
                            Unlock Your{'\n'}Best Style
                        </Text>
                        <Text className="text-indigo-100/80 text-base mt-2 font-inter-medium">
                            Join thousands of users who dress better every day.
                        </Text>
                    </View>
                </Animated.View>

                {/* Features Card */}
                <Animated.View 
                    entering={FadeInUp.duration(600).delay(400)}
                    className="mx-6 bg-white rounded-3xl p-6"
                    style={{
                        shadowColor: '#312e81',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 20,
                        elevation: 10,
                    }}
                >
                    {FEATURE_LIST.map((feature, index) => (
                        <Animated.View
                            key={feature.id}
                            entering={FadeInRight.duration(400).delay(500 + index * 100)}
                            className={`flex-row items-center ${index !== FEATURE_LIST.length - 1 ? 'mb-6' : ''}`}
                        >
                            <View className="w-12 h-12 bg-indigo-50 rounded-2xl justify-center items-center mr-4">
                                <Ionicons name={feature.icon as any} size={24} color="#4F46E5" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 font-inter-bold text-lg">{feature.title}</Text>
                                <Text className="text-slate-500 text-sm mt-0.5 leading-5">{feature.desc}</Text>
                            </View>
                        </Animated.View>
                    ))}
                </Animated.View>

                {/* Plans Selection */}
                <Animated.View 
                    entering={FadeInUp.duration(500).delay(800)}
                    className="px-6 mt-8"
                >
                    <Text className="text-slate-900 font-inter-bold text-lg mb-4">Choose Your Plan</Text>

                    {packages.length === 0 ? (
                        <Animated.View 
                            entering={FadeIn.duration(400)}
                            className="bg-white p-6 rounded-2xl items-center border border-slate-200"
                        >
                            <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
                            <Text className="text-slate-500 text-center mt-4 font-inter-medium">
                                No plans found.
                            </Text>
                        </Animated.View>
                    ) : (
                        packages.map((pack, index) => (
                            <Animated.View
                                key={pack.identifier}
                                entering={FadeInUp.duration(400).delay(900 + index * 100)}
                            >
                                <PackageItem
                                    pack={pack}
                                    isSelected={selectedPackage?.identifier === pack.identifier}
                                    onSelect={handlePurchase}
                                    savings={savings}
                                    purchasing={purchasing}
                                />
                            </Animated.View>
                        ))
                    )}
                </Animated.View>

                {/* Legal Links */}
                <Animated.View 
                    entering={FadeIn.duration(400).delay(1200)}
                    className="flex-row justify-center mt-4 mb-8 space-x-4"
                >
                    <TouchableOpacity><Text className="text-slate-400 text-xs">Terms of Service</Text></TouchableOpacity>
                    <Text className="text-slate-300 text-xs">•</Text>
                    <TouchableOpacity><Text className="text-slate-400 text-xs">Privacy Policy</Text></TouchableOpacity>
                </Animated.View>
            </ScrollView>

            {/* Sticky Footer */}
            <Animated.View
                entering={FadeInUp.duration(500).delay(1000)}
                className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 px-6"
                style={{ paddingBottom: Math.max(insets.bottom, 20) }}
            >
                {/* Satın alma butonu kaldırıldı, sadece restore var */}
                {purchasing && (
                    <Animated.View 
                        entering={FadeIn.duration(300)}
                        className="mb-4"
                    >
                        <ActivityIndicator color="#4F46E5" />
                        <Text className="text-center text-slate-500 text-xs mt-2">Processing...</Text>
                    </Animated.View>
                )}

                <TouchableOpacity onPress={handleRestore} className="items-center py-2">
                    <Text className="text-slate-400 text-xs font-inter-medium">Restore Purchases</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}