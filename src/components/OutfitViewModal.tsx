import React, { useRef } from 'react';
import { View, Text, Modal, ScrollView, Animated, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { WardrobeItem } from '../services/visionApi';
import { formatLabel } from '../utils/textUtils';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_HEIGHT = height * 0.55;
const SPACING = (width - CARD_WIDTH) / 2;

interface OutfitViewModalProps {
    visible: boolean;
    onClose: () => void;
    items: WardrobeItem[];
    confetti?: boolean;
    onSave?: () => void;
    onDelete?: () => void; // New delete callback
    animationSource?: any; // For Lottie
}

export default function OutfitViewModal({
    visible,
    onClose,
    items,
    confetti = false,
    animationSource,
    onDelete
}: OutfitViewModalProps) {
    const scrollX = useRef(new Animated.Value(0)).current;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white/95 justify-center items-center">

                {visible && confetti && animationSource && (
                    <View className="absolute inset-0 w-full h-full z-20 pointer-events-none" pointerEvents="none">
                        <LottieView
                            source={animationSource}
                            autoPlay
                            loop={false}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    </View>
                )}

                <View className="absolute top-20 left-0 right-0 items-center z-10">
                    <Text className="text-slate-900 text-2xl font-black font-inter-black tracking-tight">
                        Perfect Match!
                    </Text>
                    <Text className="text-slate-500 text-sm font-inter-medium mt-1">
                        Swipe to explore your outfit
                    </Text>
                </View>

                {/* Delete Button */}
                {onDelete && (
                    <TouchableOpacity
                        onPress={onDelete}
                        className="absolute top-16 right-6 z-50 bg-red-500/20 p-3 rounded-full"
                    >
                        <Ionicons name="trash-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                )}

                <Animated.ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: SPACING, alignItems: 'center' }}
                    style={{ flexGrow: 0 }}
                    snapToInterval={CARD_WIDTH + 20}
                    decelerationRate="fast"
                    pagingEnabled={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                >
                    {items.map((item, index) => {
                        const inputRange = [
                            (index - 1) * (CARD_WIDTH + 20),
                            index * (CARD_WIDTH + 20),
                            (index + 1) * (CARD_WIDTH + 20),
                        ];

                        const scale = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.9, 1, 0.9],
                            extrapolate: 'clamp',
                        });

                        const opacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.6, 1, 0.6],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={item.item_id || index}
                                style={{
                                    width: CARD_WIDTH,
                                    height: CARD_HEIGHT,
                                    marginHorizontal: 10,
                                    transform: [{ scale }],
                                    opacity,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 12 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 16,
                                    elevation: 8,
                                }}
                                className="bg-white rounded-[40px] overflow-hidden border border-slate-100"
                            >
                                <Image
                                    source={{ uri: item.image_url }}
                                    className="w-full h-3/4"
                                    resizeMode="cover"
                                />
                                <View className="flex-1 p-6 justify-between bg-white">
                                    <View>
                                        <Text className="text-slate-900 text-2xl font-black font-inter-black capitalize">
                                            {formatLabel(item.analysis?.basic_info?.sub_category || item.basic_info?.sub_category || item.analysis?.basic_info?.category || item.basic_info?.category)}
                                        </Text>
                                        <Text className="text-slate-500 text-base font-inter-medium capitalize mt-1">
                                            {formatLabel(item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color || 'Unknown Color')} • {formatLabel(item.analysis?.context?.formality || item.context?.formality || 'Casual')}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center">
                                        <View className="bg-[#3A1AEB]/10 px-4 py-2 rounded-2xl">
                                            <Text className="text-[#3A1AEB] text-xs font-black font-inter-black uppercase tracking-widest">
                                                SELECTED ITEM
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>
                        );
                    })}
                </Animated.ScrollView>

                {/* Close / Action Button */}
                <TouchableOpacity
                    onPress={onClose}
                    className="absolute bottom-12 bg-[#3A1AEB] px-10 py-5 rounded-[24px] shadow-2xl flex-row items-center"
                    style={{ shadowColor: '#3A1AEB', shadowOpacity: 0.3, shadowRadius: 15 }}
                    activeOpacity={0.9}
                >
                    <Ionicons name="sparkles" size={20} color="white" />
                    <Text className="text-white font-black font-inter-black text-lg ml-3">PERFECT!</Text>
                </TouchableOpacity>

            </View>
        </Modal>
    );
}
