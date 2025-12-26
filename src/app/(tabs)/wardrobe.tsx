import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    Alert,
    Platform,
    Modal,
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import LottieView from "lottie-react-native";
import { visionService, WardrobeItem } from "../../services/visionApi"; // visionApi.ts'den import
import { formatLabel } from "../../utils/textUtils";
import { wardrobeService } from "../../services/wardrobeService";
import { useAuth } from "../../providers/AuthProvider";
import Header from "@/components/Header";
import { useWardrobe } from "../../providers/WardrobeProvider";
import { RevenueCatService } from "../../lib/revenuecat";
import { useRouter } from "expo-router";
import { useTranslation } from 'react-i18next';


// op ögelerini ana kategoriye göre gruplayan yardımcı fonksiyon
const groupItemsByCategory = (items: WardrobeItem[]) => {
    return items.reduce((acc, item) => {
        const categoryValue = item.analysis?.basic_info?.category
            || item.basic_info?.category
            || item.classification?.main_category
            || null;
        const category = categoryValue && categoryValue.trim()
            ? categoryValue
            : 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, WardrobeItem[]>);
};


export default function WardrobePage() {
    const { top } = useSafeAreaInsets();
    const { t } = useTranslation();
    const { user, isPremium } = useAuth();
    const { items, loading: isLoading, refreshItems } = useWardrobe();
    const [groupedItems, setGroupedItems] = useState<Record<string, WardrobeItem[]>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showSourceModal, setShowSourceModal] = useState(false);
    const router = useRouter();

    const getLabel = (key: string | null | undefined) => {
        if (!key) return '';
        const options = { defaultValue: '___MISSING___' };
        let text = t(`filters.${key}`, options);
        if (text === '___MISSING___') {
            text = t(`filters.${key.toLowerCase()}`, options);
        }
        if (text === '___MISSING___') {
            return formatLabel(key);
        }
        return text;
    };

    useEffect(() => {
        setGroupedItems(groupItemsByCategory(items));
    }, [items]);

    const handleDeleteItem = (itemId: string) => {
        Alert.alert(
            t('wardrobe.deleteItemTitle'),
            t('wardrobe.deleteItemConfirm'),
            [
                {
                    text: t('common.cancel'),
                    style: "cancel"
                },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Perform delete
                            await wardrobeService.deleteItem(itemId);

                            await refreshItems();

                            Toast.show({
                                type: 'success',
                                text1: t('wardrobe.itemDeleted'),
                                position: 'top'
                            });
                        } catch (error) {
                            console.error("Error deleting item:", error);
                            // Revert UI if failed (optional, but good practice. For now simpler reload is fine or just error msg)
                            // In a full robust app we'd revert the state here. 
                            // For now just show error.
                            refreshItems();
                            Toast.show({
                                type: 'error',
                                text1: t('wardrobe.deleteFailed'),
                                position: 'top'
                            });
                        }
                    }
                }
            ]
        );
    };

    const handleAddItem = async () => {
        if (!user) {
            Toast.show({ type: 'error', text1: t('auth.signInRequired') });
            return;
        }

        if (isPremium === false && items.length >= 20) {
            Alert.alert(
                t('wardrobe.limitReachedTitle'),
                t('wardrobe.limitReachedDesc'),
                [
                    { text: t('wardrobe.later'), style: "cancel" },
                    { text: t('wardrobe.upgradeToPro'), onPress: () => router.push('/paywall') }
                ]
            );
            return;
        }

        setShowSourceModal(true);
    };

    const processImageSource = async (type: 'camera' | 'library') => {
        setShowSourceModal(false);
        let permissionResult;
        if (type === 'library') {
            permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        } else {
            permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        }

        if (permissionResult.granted === false) {
            Toast.show({
                type: 'error',
                text1: t('wardrobe.permissionRequired'),
                text2: t('wardrobe.permissionDesc', { type: type === 'library' ? t('wardrobe.gallery') : t('wardrobe.camera') }),
                position: 'top',
            });
            return;
        }

        let pickerResult;
        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ['images'],
            allowsEditing: true, // This enables the editing step user requested
            aspect: [1, 1], // Square aspect ratio for clean product shots
            quality: 0.8,
        };

        if (type === 'library') {
            pickerResult = await ImagePicker.launchImageLibraryAsync(options);
        } else {
            pickerResult = await ImagePicker.launchCameraAsync(options);
        }

        if (pickerResult.canceled) {
            return;
        }

        const imageUri = pickerResult.assets[0].uri;

        setIsAnalyzing(true);
        Toast.show({
            type: 'info',
            text1: t('common.loading'),
            text2: t('wardrobe.analyzing'),
            position: 'top',
            visibilityTime: 4000,
        });

        try {
            // 1. Analyze and Background Removal
            const visionItem = await visionService.analyzeImage(imageUri);

            // Extract the processed image URL return from analysis
            const publicUrl = visionItem.image_url;

            // 2. Save to DB
            const savedItem = await wardrobeService.addItem(user.id, visionItem, publicUrl);

            // 4. Update UI
            await refreshItems();

            const newItem: WardrobeItem = {
                ...visionItem,
                item_id: savedItem.id,
                image_url: publicUrl,
            };

            const categoryValue = newItem.analysis?.basic_info?.category || newItem.basic_info?.category || newItem.classification?.main_category || null;
            const subCategoryValue = newItem.analysis?.basic_info?.sub_category || newItem.basic_info?.sub_category || newItem.classification?.sub_category || null;

            const category = categoryValue ? getLabel(categoryValue) : '';
            const subCategory = subCategoryValue ? getLabel(subCategoryValue) : 'Clothing';
            const categoryText = category ? `${category} / ${subCategory}` : subCategory;

            Toast.show({
                type: 'success',
                text1: t('wardrobe.saved'),
                text2: t('wardrobe.savedDesc', { category: categoryText }),
                position: 'top',
                visibilityTime: 3000,
            });
        } catch (error: any) {
            console.error("Wardrobe Process Error:", error);

            const errorMessage = error?.message || t('wardrobe.technicalError');

            Toast.show({
                type: 'error',
                text1: t('common.oops'),
                text2: errorMessage,
                position: 'top',
                visibilityTime: 5000,
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const screenWidth = Dimensions.get("window").width;
    const itemWidth = screenWidth * 0.45; // Kart genişliğini biraz artıralım
    const gapBetweenItems = 16; // Kartlar arası boşluk


    return (
        <Animated.View entering={FadeInRight.duration(400)} className="flex-1 bg-white" >
            {Platform.OS === 'ios' && <Header />}
            <View className="px-5 pt-6 pb-2 bg-transparent ">
                <View className="flex-row justify-between items-center mb-5">
                    <View>
                        <Text className="text-4xl font-black font-inter-black text-slate-900 mb-1 tracking-tight">
                            {t('wardrobe.title')}
                        </Text>
                        <View className="flex-row items-center gap-2">
                            <View className="h-2 w-2 rounded-full bg-[#3A1AEB]" />
                            <Text className="text-sm font-medium font-inter-medium text-slate-500">
                                {t(items.length === 1 ? 'wardrobe.item_one' : 'wardrobe.item_other', { count: items.length })}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={handleAddItem}
                        className="flex-row items-center justify-center bg-[#3A1AEB] rounded-2xl px-5 py-3.5"
                        activeOpacity={0.85}
                        style={{
                            shadowColor: '#3A1AEB',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 10,
                            elevation: 5,
                        }}
                    >
                        <Ionicons name="add-circle" size={22} color="white" />
                        <Text className="text-white font-bold font-inter-bold ml-2 text-base">{t('wardrobe.new')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Plan Limit Bar */}
                {isPremium === false && (
                    <View
                        className="bg-white rounded-3xl p-5 mb-4 border border-slate-100"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.05,
                            shadowRadius: 15,
                            elevation: 4,
                        }}
                    >
                        <View className="flex-row justify-between items-center mb-3">
                            <View className="flex-row items-center gap-2">
                                <View className="bg-[#3A1AEB]/10 p-2 rounded-xl">
                                    <Ionicons name="cloud-upload" size={18} color="#3A1AEB" />
                                </View>
                                <Text className="text-base font-bold font-inter-bold text-slate-800">{t('wardrobe.freePlanLimit')}</Text>
                            </View>
                            <View className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <Text className="text-sm font-bold font-inter-bold text-slate-600">{items.length}/20</Text>
                            </View>
                        </View>

                        <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                            <View
                                className="h-full bg-[#3A1AEB] rounded-full"
                                style={{ width: `${Math.min((items.length / 20) * 100, 100)}%` }}
                            />
                        </View>

                        <View className="flex-row justify-between items-center">
                            <Text className="text-sm font-medium font-inter-medium text-slate-500">{t('wardrobe.needMoreSpace')}</Text>
                            <TouchableOpacity onPress={() => router.push('/paywall')}>
                                <Text className="text-sm font-bold font-inter-bold text-[#3A1AEB]">{t('wardrobe.getPremium')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* Gardırop İçeriği */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 15 }} // Increased padding for floating tab bar
            >
                {/* Loading State */}
                {isLoading && Object.keys(groupedItems).length === 0 ? (
                    <View className="flex-1 justify-center items-center px-6 mt-32">
                        <LottieView
                            source={require("../../assets/animations/loading-2.json")}
                            autoPlay
                            loop
                            style={{ width: 120, height: 120 }}
                        />
                        <Text className="text-lg font-bold font-inter-bold text-slate-700 mt-4">
                            {t('wardrobe.loadingTitle')}
                        </Text>
                        <Text className="text-sm text-slate-400 mt-1">
                            {t('wardrobe.loadingDesc')}
                        </Text>
                    </View>
                ) : Object.keys(groupedItems).length === 0 && !isAnalyzing && !isLoading ? (
                    <View className="flex-1 justify-center items-center px-6 mt-32">
                        <View
                            className="w-32 h-32 rounded-full bg-slate-50 items-center justify-center mb-6 border border-slate-100"
                            style={{
                                shadowColor: '#3A1AEB',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: 0.1,
                                shadowRadius: 20,
                                elevation: 5,
                            }}
                        >
                            <MaterialIcons name="checkroom" size={64} color="#3A1AEB" />
                        </View>
                        <Text className="text-2xl font-bold font-inter-bold text-slate-900 mb-2">{t('wardrobe.emptyTitle')}</Text>
                        <Text className="text-base text-slate-500 text-center leading-6">
                            {t('wardrobe.emptyDesc')}
                        </Text>
                        <TouchableOpacity
                            onPress={handleAddItem}
                            className="mt-8 bg-[#3A1AEB] rounded-xl px-6 py-3"
                            style={{
                                shadowColor: '#3A1AEB',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <Text className="text-white font-semibold font-inter-semibold text-base">{t('wardrobe.addFirstItem')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="pb-4">
                        {Object.entries(groupedItems).map(([category, categoryItems], categoryIndex) => (
                            <View key={category} className="mb-10">
                                <View className="px-5 mb-5 flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <View
                                            className="h-8 w-1.5 rounded-full"
                                            style={{
                                                backgroundColor: ['#3A1AEB', '#8B5CF6', '#EC4899', '#10B981'][categoryIndex % 4],
                                                shadowColor: ['#3A1AEB', '#8B5CF6', '#EC4899', '#10B981'][categoryIndex % 4],
                                                shadowOffset: { width: 0, height: 0 },
                                                shadowOpacity: 0.8,
                                                shadowRadius: 10,
                                                elevation: 6,
                                            }}
                                        />
                                        <Text className="text-2xl font-black font-inter-black text-slate-900 tracking-tight">{getLabel(category)}</Text>
                                    </View>
                                    <View className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
                                        <Text className="text-xs font-bold font-inter-bold text-slate-600">
                                            {t(categoryItems.length === 1 ? 'wardrobe.item_one' : 'wardrobe.item_other', { count: categoryItems.length })}
                                        </Text>
                                    </View>
                                </View>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
                                >
                                    {categoryItems.map((item, index) => (
                                        <TouchableOpacity
                                            key={item.item_id}
                                            className="rounded-3xl overflow-hidden bg-white m-2"
                                            style={{
                                                width: itemWidth,
                                                marginRight: index < categoryItems.length - 1 ? gapBetweenItems : 0,
                                                borderWidth: 1,
                                                borderColor: '#f8fafc',
                                                // Enhanced shadow for premium feel
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 12 },
                                                shadowOpacity: 0.08,
                                                shadowRadius: 16,
                                                elevation: 6,
                                            }}
                                            activeOpacity={0.9}
                                        >
                                            <View className="relative">
                                                <Image
                                                    source={{ uri: item.image_url }}
                                                    className="w-full"
                                                    style={{ aspectRatio: 3 / 4 }}
                                                    resizeMode="cover"
                                                />
                                                {/* Moved Color Tag to Top LEFT */}
                                                <View className="absolute top-3 left-3 bg-black/60 rounded-full px-2.5 py-1 backdrop-blur-md border border-white/10">
                                                    {(item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color) && (
                                                        <Text className="text-white text-xs font-semibold font-inter-semibold capitalize">
                                                            {getLabel(item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color)}
                                                        </Text>
                                                    )}
                                                </View>

                                                {/* New Delete Button at Top RIGHT */}
                                                <TouchableOpacity
                                                    onPress={() => item.item_id && handleDeleteItem(item.item_id)}
                                                    className="absolute top-3 right-3 w-8 h-8 bg-red-500/80 rounded-full items-center justify-center backdrop-blur-md border border-white/20"
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons name="trash-outline" size={16} color="white" />
                                                </TouchableOpacity>
                                            </View>

                                            <View className="p-4 bg-white">
                                                <Text className="text-lg font-bold font-inter-bold text-slate-900 mb-2" numberOfLines={1}>
                                                    {getLabel(item.analysis?.basic_info?.sub_category || item.basic_info?.sub_category || item.classification?.sub_category || 'Clothing')}
                                                </Text>

                                                <View className="flex-row flex-wrap gap-1.5">
                                                    {(item.analysis?.attributes?.material || item.attributes?.material) && (
                                                        <View className="bg-[#3A1AEB]/10 border border-[#3A1AEB]/20 px-2.5 py-1 rounded-lg">
                                                            <Text className="text-xs font-bold font-inter-bold text-[#3A1AEB] capitalize">
                                                                {getLabel(item.analysis?.attributes?.material || item.attributes?.material)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    {(item.analysis?.attributes?.style || item.attributes?.style) && (
                                                        <View className="bg-fuchsia-100 border border-fuchsia-200 px-2.5 py-1 rounded-lg">
                                                            <Text className="text-xs font-bold font-inter-bold text-fuchsia-600 capitalize">
                                                                {getLabel(item.analysis?.attributes?.style || item.attributes?.style)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    {((item.analysis?.visual_details?.pattern && item.analysis.visual_details.pattern !== 'plain') || (item.visual_details?.pattern && item.visual_details.pattern !== 'plain')) && (
                                                        <View className="bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-lg">
                                                            <Text className="text-xs font-bold font-inter-bold text-violet-600 capitalize">
                                                                {getLabel(item.analysis?.visual_details?.pattern || item.visual_details?.pattern)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    {(item.analysis?.context?.formality || item.context?.formality) && (
                                                        <View className="bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg">
                                                            <Text className="text-xs font-bold font-inter-bold text-amber-600 capitalize">
                                                                {getLabel(item.analysis?.context?.formality || item.context?.formality)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    {((item.analysis?.context?.seasons || item.context?.seasons || []).filter(s => s !== 'all_seasons').slice(0, 1)).map((season, idx) => (
                                                        <View key={idx} className="bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                                            <Text className="text-xs font-bold font-inter-bold text-emerald-600 capitalize">
                                                                {getLabel(season)}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                    {(item.analysis?.context?.seasons || item.context?.seasons || []).includes('all_seasons') && (
                                                        <View className="bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                                            <Text className="text-xs font-bold font-inter-bold text-emerald-600 capitalize">
                                                                {getLabel('All Seasons')}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Analiz Loading Overlay */}
            {isAnalyzing && (
                <View
                    className="absolute inset-0 justify-center items-center z-50"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
                >
                    <View
                        className="bg-white rounded-3xl p-8 items-center mx-8 border border-slate-100"
                        style={{
                            shadowColor: '#3A1AEB',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.1,
                            shadowRadius: 30,
                            elevation: 10,
                        }}
                    >
                        <LottieView
                            source={require("../../assets/animations/loading-2.json")}
                            autoPlay
                            loop
                            style={{ width: 140, height: 140 }}
                        />
                        <Text className="text-slate-900 font-black font-inter-black text-xl mt-2">{t('wardrobe.analyzingTitle')}</Text>
                        <Text className="text-slate-500 text-sm mt-2 text-center leading-relaxed px-2">
                            {t('wardrobe.analyzingDesc')}
                        </Text>
                    </View>
                </View>
            )}

            {/* Custom Source Selection Action Sheet */}
            <Modal
                visible={showSourceModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSourceModal(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowSourceModal(false)}
                    className="flex-1 bg-black/60 justify-end"
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        className="bg-white rounded-t-[40px] px-6 pt-8 pb-10"
                    >
                        <View className="items-center mb-6">
                            <View className="w-12 h-1.5 bg-slate-200 rounded-full mb-6" />
                            <Text className="text-2xl font-black font-inter-black text-slate-900">{t('wardrobe.addNewItem')}</Text>
                            <Text className="text-slate-500 font-medium font-inter-medium mt-1">{t('wardrobe.selectSource')}</Text>

                            {/* Guidance regarding human faces */}
                            <View className="flex-row items-center bg-amber-50 px-4 py-2.5 rounded-2xl mt-4 border border-amber-100">
                                <Ionicons name="alert-circle" size={20} color="#d97706" />
                                <Text className="text-amber-800 text-[11px] font-bold font-inter-bold ml-2 flex-1">
                                    {t('wardrobe.avoidFaces')}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row justify-between gap-4">
                            <TouchableOpacity
                                onPress={() => processImageSource('camera')}
                                className="flex-1 bg-slate-50 border border-slate-100 rounded-[32px] p-6 items-center"
                                activeOpacity={0.7}
                            >
                                <View className="w-16 h-16 bg-[#3A1AEB]/10 rounded-full items-center justify-center mb-4">
                                    <MaterialCommunityIcons name="camera" size={32} color="#3A1AEB" />
                                </View>
                                <Text className="text-slate-900 font-black font-inter-black text-lg">{t('wardrobe.camera')}</Text>
                                <Text className="text-slate-400 text-xs font-bold mt-1">{t('wardrobe.takePhoto')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => processImageSource('library')}
                                className="flex-1 bg-slate-50 border border-slate-100 rounded-[32px] p-6 items-center"
                                activeOpacity={0.7}
                            >
                                <View className="w-16 h-16 bg-blue-500/10 rounded-full items-center justify-center mb-4">
                                    <MaterialCommunityIcons name="image-multiple" size={32} color="#3b82f6" />
                                </View>
                                <Text className="text-slate-900 font-black font-inter-black text-lg">{t('wardrobe.gallery')}</Text>
                                <Text className="text-slate-400 text-xs font-bold mt-1">{t('wardrobe.chooseExisting')}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowSourceModal(false)}
                            className="mt-6 py-4 bg-slate-100 rounded-2xl items-center"
                            activeOpacity={0.7}
                        >
                            <Text className="text-slate-600 font-bold font-inter-bold text-base">{t('common.cancel')}</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </Animated.View>
    );
}
