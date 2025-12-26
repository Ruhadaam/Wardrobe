import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, Dimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase, auth } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/LanguageSelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Login() {
    const router = useRouter();
    const { t } = useTranslation();
    const { top } = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await auth.signIn(email, password);

        if (error) {
            Alert.alert(t('common.error'), error.message);
        }
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#fff' }}
        >
            <StatusBar style="dark" />

            {/* Language Selector absolute position */}
            <View className="absolute right-6 z-10" style={{ top: top + 10 }}>
                <LanguageSelector />
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View className="p-8 w-full max-w-md mx-auto">

                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-[#3A1AEB]/5 rounded-full items-center justify-center mb-6 border border-[#3A1AEB]/10">
                            <MaterialCommunityIcons name="wardrobe" size={40} color="#3A1AEB" />
                        </View>
                        <Text className="text-3xl font-black font-inter-black text-slate-900 tracking-tight text-center">{t('auth.welcome')}</Text>
                        <Text className="text-slate-500 mt-3 text-center font-inter-medium leading-6">{t('auth.signInSubtitle')}</Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-slate-700 mb-2 font-bold font-inter-bold ml-1 text-sm">{t('auth.email')}</Text>
                            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#3A1AEB] transition-colors">
                                <MaterialCommunityIcons name="email-outline" size={20} color="#64748b" />
                                <TextInput
                                    className="flex-1 ml-3 text-slate-900 font-inter-medium"
                                    placeholder={t('auth.emailPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-slate-700 mb-2 font-bold font-inter-bold ml-1 text-sm">{t('auth.password')}</Text>
                            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#3A1AEB] transition-colors">
                                <MaterialCommunityIcons name="lock-outline" size={20} color="#64748b" />
                                <TextInput
                                    className="flex-1 ml-3 text-slate-900 font-inter-medium"
                                    placeholder={t('auth.passwordPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            className="items-end"
                        >
                            <Text className="text-[#3A1AEB] text-sm m-2 font-bold font-inter-bold">{t('auth.forgotPassword')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={signInWithEmail}
                            disabled={loading}
                            className={`bg-[#3A1AEB] py-4 rounded-[20px] items-center shadow-xl shadow-[#3A1AEB]/30 mt-2 ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? (
                                <Text className="text-white font-bold font-inter-bold text-lg">{t('auth.signingIn')}</Text>
                            ) : (
                                <Text className="text-white font-bold font-inter-bold text-lg">{t('auth.signIn')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-center mt-10">
                        <Text className="text-slate-500 font-inter-medium">{t('auth.noAccount')} </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text className="text-[#3A1AEB] font-bold font-inter-bold">{t('auth.signUp')}</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView >
    );
}
