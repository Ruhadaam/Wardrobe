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
            <View className="flex-1 bg-zinc-900/95 justify-center items-center">

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
                    <Text className="text-white text-xl font-bold font-inter-bold opacity-80">
                        Top Picks For You
                    </Text>
                    <Text className="text-zinc-400 text-sm font-inter">
                        Swipe to see details
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
                                    opacity
                                }}
                                className="bg-zinc-800 rounded-3xl overflow-hidden shadow-2xl border border-zinc-700/50"
                            >
                                <Image
                                    source={{ uri: item.image_url }}
                                    className="w-full h-3/4"
                                    resizeMode="cover"
                                />
                                <View className="flex-1 p-4 justify-between bg-zinc-800">
                                    <View>
                                        <Text className="text-white text-xl font-bold capitalize">
                                            {formatLabel(item.analysis?.basic_info?.sub_category || item.basic_info?.sub_category || item.analysis?.basic_info?.category || item.basic_info?.category)}
                                        </Text>
                                        <Text className="text-zinc-400 text-sm capitalize mt-1">
                                            {formatLabel(item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color || 'Unknown Color')} • {formatLabel(item.analysis?.context?.formality || item.context?.formality || 'Casual')}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center space-x-2">
                                        <View className="bg-cyan-500/20 px-3 py-1 rounded-full">
                                            <Text className="text-cyan-400 text-xs font-bold uppercase tracking-wider">
                                                Selected
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
                    className="absolute bottom-12 bg-white px-8 py-4 rounded-full shadow-xl flex-row items-center space-x-2"
                    activeOpacity={0.9}
                >
                    <Ionicons name="sparkles" size={20} color="black" />
                    <Text className="text-black font-bold text-lg">Awesome!</Text>
                </TouchableOpacity>

            </View>
        </Modal>
    );
}
