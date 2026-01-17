import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LanguageSelector from '../../components/LanguageSelector';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import Animated, {
    useAnimatedStyle,
    interpolate,
    SharedValue
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Import images
const slide1Image = require('../../assets/onboarding/slide1.png');
const slide2Image = require('../../assets/onboarding/slide2.png');
const slide3Image = require('../../assets/onboarding/slide3.png');

export const ONBOARDING_COMPLETE_KEY = 'hasCompletedOnboarding';

interface SlideData {
    id: number;
    image: any;
    titleKey: string;
    descKey: string;
}

const slides: SlideData[] = [
    {
        id: 1,
        image: slide1Image,
        titleKey: 'onboarding.slide1Title',
        descKey: 'onboarding.slide1Desc',
    },
    {
        id: 2,
        image: slide2Image,
        titleKey: 'onboarding.slide2Title',
        descKey: 'onboarding.slide2Desc',
    },
    {
        id: 3,
        image: slide3Image,
        titleKey: 'onboarding.slide3Title',
        descKey: 'onboarding.slide3Desc',
    },
];

function PaginationDot({ index, activeIndex }: { index: number; activeIndex: number }) {
    const isActive = index === activeIndex;

    return (
        <View
            style={{
                width: isActive ? 24 : 8,
                height: 8,
                borderRadius: 4,
                marginHorizontal: 4,
                backgroundColor: isActive ? '#3A1AEB' : '#E0E0E0',
            }}
        />
    );
}

function SlideItem({ item, animationValue }: { item: SlideData; animationValue: SharedValue<number> }) {
    const { t } = useTranslation();

    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            animationValue.value,
            [-1, 0, 1],
            [0.9, 1, 0.9]
        );
        const opacity = interpolate(
            animationValue.value,
            [-1, 0, 1],
            [0.5, 1, 0.5]
        );
        return {
            transform: [{ scale }],
            opacity,
        };
    });

    return (
        <View className="flex-1 items-center justify-start px-6 pt-8">
            <Animated.View style={[{ width: SCREEN_WIDTH * 0.85, height: SCREEN_HEIGHT * 0.4 }, animatedStyle]}>
                <Image
                    source={item.image}
                    style={{ width: '100%', height: '100%', borderRadius: 16 }}
                    resizeMode="contain"
                />
            </Animated.View>
            <View className="mt-10 items-center px-4">
                <Text className="text-2xl font-inter-black text-slate-900 text-center mb-4">
                    {t(item.titleKey)}
                </Text>
                <Text className="text-base font-inter-medium text-slate-500 text-center leading-6">
                    {t(item.descKey)}
                </Text>
            </View>
        </View>
    );
}

export default function Onboarding() {
    const router = useRouter();
    const { t } = useTranslation();
    const { top, bottom } = useSafeAreaInsets();
    const carouselRef = useRef<ICarouselInstance>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleComplete = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Error saving onboarding state:', error);
            router.replace('/(auth)/login');
        }
    };

    const handleRegister = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
            router.replace('/(auth)/register');
        } catch (error) {
            console.error('Error saving onboarding state:', error);
            router.replace('/(auth)/register');
        }
    };

    const handleSkip = () => {
        handleComplete();
    };


    const handleNext = () => {
        if (activeIndex < slides.length - 1) {
            carouselRef.current?.next();
        } else {
            handleComplete();
        }
    };

    const isLastSlide = activeIndex === slides.length - 1;

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Header - Language and Skip */}
            <View
                className="absolute left-0 right-0 z-10 flex-row justify-between items-center px-6"
                style={{ top: top + 16 }}
            >
                <LanguageSelector iconColor="#3A1AEB" />
                <TouchableOpacity
                    onPress={handleSkip}
                    className="px-4 py-2"
                >
                    <Text className="text-[#3A1AEB] font-inter-semibold text-base">
                        {t('onboarding.skip')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Carousel */}
            <View className="flex-1 justify-center" style={{ paddingTop: top + 40 }}>
                <Carousel
                    ref={carouselRef}
                    data={slides}
                    width={SCREEN_WIDTH}
                    height={SCREEN_HEIGHT * 0.65}
                    loop={false}
                    onSnapToItem={(index) => setActiveIndex(index)}
                    renderItem={({ item, animationValue }) => (
                        <SlideItem item={item} animationValue={animationValue} />
                    )}
                />
            </View>

            {/* Bottom Section */}
            <View
                className="px-8"
                style={{ paddingBottom: bottom + 24 }}
            >
                {/* Pagination */}
                <View className="flex-row justify-center mb-8">
                    {slides.map((_, index) => (
                        <PaginationDot key={index} index={index} activeIndex={activeIndex} />
                    ))}
                </View>

                {/* Action Buttons */}
                {isLastSlide ? (
                    <>
                        {/* Register Button */}
                        <TouchableOpacity
                            onPress={handleRegister}
                            className="bg-[#3A1AEB] py-4 rounded-full items-center mb-3"
                        >
                            <Text className="text-white font-inter-bold text-base">
                                {t('auth.signUp')}
                            </Text>
                        </TouchableOpacity>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            onPress={handleComplete}
                            className="bg-white border-2 border-[#3A1AEB] py-4 rounded-full items-center"
                        >
                            <Text className="text-[#3A1AEB] font-inter-bold text-base">
                                {t('auth.signIn')}
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        onPress={handleNext}
                        className="bg-[#3A1AEB] py-4 rounded-full items-center flex-row justify-center"
                    >
                        <Text className="text-white font-inter-bold text-base mr-2">
                            {t('common.next')}
                        </Text>
                        <Text className="text-white text-lg">→</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
