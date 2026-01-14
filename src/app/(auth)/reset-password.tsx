import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';

export default function ResetPassword() {
    const router = useRouter();
    const { t } = useTranslation();
    const { updatePassword } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!password.trim() || !confirmPassword.trim()) {
            Alert.alert(t('common.error'), t('auth.fillAllFields'));
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(t('common.error'), t('auth.passwordsDoNotMatch'));
            return;
        }

        setLoading(true);
        const { success, error } = await updatePassword(password);
        setLoading(false);

        if (success) {
            Alert.alert(t('common.success'), t('auth.passwordUpdated'));
            router.replace('/(auth)/login');
        } else {
            Alert.alert(t('common.error'), error?.message || 'Error updating password');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#fff' }}
        >
            <StatusBar style="dark" />
            <View className="flex-1 p-8 justify-center">
                <View className="items-center mb-10">
                    <View className="w-20 h-20 bg-[#3A1AEB]/5 rounded-full items-center justify-center mb-6 border border-[#3A1AEB]/10">
                        <MaterialCommunityIcons name="lock-reset" size={40} color="#3A1AEB" />
                    </View>
                    <Text className="text-3xl font-black font-inter-black text-slate-900 tracking-tight text-center">
                        {t('auth.resetPasswordTitle')}
                    </Text>
                    <Text className="text-slate-500 mt-3 text-center font-inter-medium leading-6">
                        {t('auth.resetPasswordDesc')}
                    </Text>
                </View>

                <View className="space-y-4">
                    <View>
                        <Text className="text-slate-700 mb-2 font-bold font-inter-bold ml-1 text-sm">{t('auth.password')}</Text>
                        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#3A1AEB]">
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

                    <View>
                        <Text className="text-slate-700 mb-2 font-bold font-inter-bold ml-1 text-sm">{t('auth.confirmPassword')}</Text>
                        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#3A1AEB]">
                            <MaterialCommunityIcons name="lock-check-outline" size={20} color="#64748b" />
                            <TextInput
                                className="flex-1 ml-3 text-slate-900 font-inter-medium"
                                placeholder={t('auth.confirmPassword')}
                                placeholderTextColor="#94a3b8"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleResetPassword}
                        disabled={loading}
                        className={`bg-[#3A1AEB] py-4 rounded-[20px] items-center shadow-xl shadow-[#3A1AEB]/30 mt-4 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold font-inter-bold text-lg uppercase tracking-widest">
                                {t('auth.updatePassword')}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.replace('/(auth)/login')}
                        className="mt-6 items-center"
                    >
                        <Text className="text-slate-400 font-inter-bold text-sm">
                            {t('auth.signIn')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
