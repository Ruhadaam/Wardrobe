import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert, KeyboardAvoidingView, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { supabase, auth } from '../../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/LanguageSelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

export default function Register() {
    const router = useRouter();
    const { t } = useTranslation();
    const { top, bottom } = useSafeAreaInsets();
    const [step, setStep] = useState(0); // 0: Welcome, 1: Name, 2: Identity, 3: Credentials, 4: Loading/Success
    const [loading, setLoading] = useState(false);
    const animationRef = useRef<LottieView>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | null>(null);
    const [birthday, setBirthday] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || birthday;
        setShowDatePicker(Platform.OS === 'ios');
        setBirthday(currentDate);
    };

    const validateStep = (currentStep: number) => {
        switch (currentStep) {
            case 1: // Name
                return name.trim().length > 0 && surname.trim().length > 0;
            case 2: // Identity
                return gender !== null;
            case 3: // Credentials
                return email.includes('@') && password.length >= 6;
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(step)) {
            if (step === 3) {
                signUpWithEmail();
            } else {
                setStep(step + 1);
            }
        } else {
            Alert.alert(t('common.error'), t('auth.fillAllFields'));
        }
    };

    const prevStep = () => {
        if (step > 0) {
            setStep(step - 1);
        } else {
            router.back();
        }
    };

    async function signUpWithEmail() {
        setLoading(true);
        setStep(4); // Move to loading step

        try {
            const { data, error } = await auth.signUp(email, password, {
                name,
                surname,
                gender,
                birthday
            });

            if (error) {
                Alert.alert(t('common.error'), error.message);
                setStep(3); // Go back to credentials
            } else {
                // Success - wait a bit to show success animation if we had one
                setTimeout(() => {
                    Alert.alert(t('common.success'), t('auth.accountCreated'));
                }, 1000);
            }
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
            setStep(3);
        } finally {
            setLoading(false);
        }
    }

    const renderProgressBar = () => {
        const progress = (step / 3) * 100; // Steps 0-3 map to 0-100%
        if (step === 0 || step === 4) return null;

        return (
            <View className="h-1 bg-slate-100 w-full rounded-full overflow-hidden mb-8">
                <Animated.View
                    style={{ width: `${Math.min(progress, 100)}%` }}
                    className="h-full bg-[#3A1AEB] rounded-full"
                    layout={Layout.springify()}
                />
            </View>
        );
    };

    const renderWelcome = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="flex-1 items-center justify-center p-6">
            <View className="w-64 h-64 bg-indigo-50 rounded-full items-center justify-center mb-10 overflow-hidden">
                {/* 
                  TODO: Add your Lottie file here! 
                  <LottieView
                    autoPlay
                    ref={animationRef}
                    style={{
                      width: 200,
                      height: 200,
                    }}
                    source={require('../../assets/welcome_animation.json')}
                  />
                */}
                <MaterialCommunityIcons name="wardrobe-outline" size={80} color="#3A1AEB" />
            </View>
            <Text className="text-3xl font-black font-inter-black text-slate-900 text-center mb-4">
                {t('auth.welcome')}
            </Text>
            <Text className="text-slate-500 font-inter-medium text-center text-lg mb-12">
                {t('auth.signInSubtitle')}
            </Text>

            <TouchableOpacity
                onPress={() => setStep(1)}
                className="bg-[#3A1AEB] w-full py-4 rounded-[20px] items-center shadow-xl shadow-[#3A1AEB]/30"
            >
                <Text className="text-white font-bold font-inter-bold text-lg">{t('common.next')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} className="mt-4 py-2">
                <Text className="text-slate-500 font-inter-bold">{t('auth.signIn')}</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderNameStep = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="flex-1">
            <Text className="text-2xl font-black font-inter-black text-slate-900 mb-2">
                {t('auth.name')} & {t('auth.surname')}
            </Text>
            <Text className="text-slate-500 font-inter-medium mb-8">
                Let's get to know you better.
            </Text>

            <View className="space-y-6">
                <View>
                    <Text className="text-slate-700 mb-2 font-bold font-inter-bold ml-1 text-sm">{t('auth.name')}</Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 font-inter-bold text-lg focus:border-[#3A1AEB]"
                        placeholder="John"
                        placeholderTextColor="#cbd5e1"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />
                </View>
                <View>
                    <Text className="text-slate-700 mb-2 font-bold font-inter-bold ml-1 text-sm">{t('auth.surname')}</Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 font-inter-bold text-lg focus:border-[#3A1AEB]"
                        placeholder="Doe"
                        placeholderTextColor="#cbd5e1"
                        value={surname}
                        onChangeText={setSurname}
                    />
                </View>
            </View>
        </Animated.View>
    );

    const renderIdentityStep = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="flex-1">
            <Text className="text-2xl font-black font-inter-black text-slate-900 mb-2">
                Almost there
            </Text>
            <Text className="text-slate-500 font-inter-medium mb-8">
                A few more details for your profile.
            </Text>

            <View className="space-y-6">
                <View>
                    <Text className="text-slate-700 mb-6 font-bold font-inter-bold ml-1 text-sm">{t('auth.gender')}</Text>
                    <View className="flex-row gap-4">
                        <TouchableOpacity
                            onPress={() => setGender('male')}
                            className={`flex-1 p-6 rounded-3xl border-2 items-center justify-center ${gender === 'male' ? 'border-[#3A1AEB] bg-[#3A1AEB]/5' : 'border-slate-100 bg-slate-50'}`}
                        >
                            <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${gender === 'male' ? 'bg-[#3A1AEB]' : 'bg-slate-200'}`}>
                                <MaterialCommunityIcons name="gender-male" size={24} color={gender === 'male' ? '#fff' : '#64748b'} />
                            </View>
                            <Text className={`font-bold font-inter-bold text-lg ${gender === 'male' ? 'text-[#3A1AEB]' : 'text-slate-500'}`}>{t('auth.male')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setGender('female')}
                            className={`flex-1 p-6 rounded-3xl border-2 items-center justify-center ${gender === 'female' ? 'border-pink-500 bg-pink-500/5' : 'border-slate-100 bg-slate-50'}`}
                        >
                            <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${gender === 'female' ? 'bg-pink-500' : 'bg-slate-200'}`}>
                                <MaterialCommunityIcons name="gender-female" size={24} color={gender === 'female' ? '#fff' : '#64748b'} />
                            </View>
                            <Text className={`font-bold font-inter-bold text-lg ${gender === 'female' ? 'text-pink-600' : 'text-slate-500'}`}>{t('auth.female')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View>
                    <Text className="text-slate-700 mb-3 font-bold font-inter-bold ml-1 text-sm">{t('auth.birthday')}</Text>
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 flex-row items-center justify-between"
                    >
                        <Text className="text-slate-900 text-lg font-inter-bold">
                            {birthday.toLocaleDateString()}
                        </Text>
                        <MaterialCommunityIcons name="calendar-month" size={24} color="#64748b" />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={birthday}
                            mode="date"
                            display="default"
                            onChange={onChangeDate}
                            maximumDate={new Date()}
                        />
                    )}
                </View>
            </View>
        </Animated.View>
    );

    const renderCredentialStep = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="flex-1">
            <Text className="text-2xl font-black font-inter-black text-slate-900 mb-2">
                Secure your account
            </Text>
            <Text className="text-slate-500 font-inter-medium mb-8">
                Create your login credentials.
            </Text>

            <View className="space-y-6">
                <View>
                    <Text className="text-slate-700 mb-2 font-bold font-inter-bold ml-1 text-sm">{t('auth.email')}</Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 font-inter-bold text-lg focus:border-[#3A1AEB]"
                        placeholder="hello@example.com"
                        placeholderTextColor="#cbd5e1"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoFocus
                    />
                </View>
                <View>
                    <Text className="text-slate-700 mb-2 font-bold font-inter-bold ml-1 text-sm">{t('auth.password')}</Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 font-inter-bold text-lg focus:border-[#3A1AEB]"
                        placeholder="••••••••"
                        placeholderTextColor="#cbd5e1"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <Text className="text-slate-400 text-xs mt-2 ml-1 font-inter-medium">Must be at least 6 characters</Text>
                </View>
            </View>
        </Animated.View>
    );

    const renderLoadingStep = () => (
        <Animated.View entering={FadeInRight} className="flex-1 items-center justify-center">
            {/* 
                TODO: Add loading Lottie animation
                <LottieView source={require('../../assets/loading.json')} autoPlay loop style={{width: 150, height: 150}} />
            */}
            <View className="w-32 h-32 bg-indigo-50 rounded-full items-center justify-center mb-8 animate-pulse">
                <MaterialCommunityIcons name="loading" size={48} color="#3A1AEB" />
            </View>
            <Text className="text-2xl font-black font-inter-black text-slate-900 mb-2 text-center">
                Setting things up...
            </Text>
            <Text className="text-slate-500 font-inter-medium text-center">
                We are preparing your digital wardrobe.
            </Text>
        </Animated.View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#fff' }}
        >
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Language Selector */}
            <View className="absolute right-6 z-10" style={{ top: top + 10 }}>
                <LanguageSelector />
            </View>

            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: top + 20, paddingBottom: bottom + 20 }}>
                {step > 0 && step < 4 && (
                    <View className="mb-4 flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={prevStep}
                            className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100"
                        >
                            <Ionicons name="arrow-back" size={20} color="#1e293b" />
                        </TouchableOpacity>
                        <Text className="font-inter-bold text-slate-400">Step {step} of 3</Text>
                        <View className="w-10" />
                    </View>
                )}

                {renderProgressBar()}

                <View className="flex-1">
                    {step === 0 && renderWelcome()}
                    {step === 1 && renderNameStep()}
                    {step === 2 && renderIdentityStep()}
                    {step === 3 && renderCredentialStep()}
                    {step === 4 && renderLoadingStep()}
                </View>

                {/* Footer Buttons for Wizard Steps (Not Welcome or Loading) */}
                {step > 0 && step < 4 && (
                    <View className="pt-4">
                        <TouchableOpacity
                            onPress={nextStep}
                            className="bg-[#3A1AEB] w-full py-4 rounded-[20px] items-center shadow-xl shadow-[#3A1AEB]/30"
                        >
                            <Text className="text-white font-bold font-inter-bold text-lg">
                                {step === 3 ? t('auth.createAccount') : t('common.next')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}
