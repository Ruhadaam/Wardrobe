import { View, Text, TouchableOpacity, ScrollView, Platform, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export default function AccountInfoPage() {
    const { profile, user, updateProfile, deleteAccount } = useAuth();
    const router = useRouter();
    const { top } = useSafeAreaInsets();
    const { t } = useTranslation();

    const [name, setName] = useState(profile?.name || '');
    const [surname, setSurname] = useState(profile?.surname || '');
    const [gender, setGender] = useState<'male' | 'female' | null>(
        profile?.gender === 'male' || profile?.gender === 'female' ? profile.gender : null
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setSurname(profile.surname);
            setGender(profile.gender === 'male' || profile.gender === 'female' ? profile.gender : null);
        }
    }, [profile]);

    const handleSave = async () => {
        if (!name.trim() || !surname.trim()) {
            Alert.alert(t('account.missingInfo'), t('account.fillBoth'));
            return;
        }

        setIsSaving(true);
        const { success, error } = await updateProfile({
            name: name.trim(),
            surname: surname.trim(),
            gender: gender
        });

        setIsSaving(false);

        if (success) {
            Toast.show({
                type: 'success',
                text1: t('account.profileUpdated'),
                text2: t('account.profileUpdatedDesc'),
                position: 'top'
            });
        } else {
            Alert.alert(t('common.error'), t('account.updateError'));
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('account.deleteAccountTitle'),
            t('account.deleteAccountMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel'
                },
                {
                    text: t('account.deleteConfirm'),
                    style: 'destructive',
                    onPress: async () => {
                        // Double confirmation
                        Alert.alert(
                            t('account.finalWarning'),
                            t('account.finalWarningMessage'),
                            [
                                {
                                    text: t('common.cancel'),
                                    style: 'cancel'
                                },
                                {
                                    text: t('account.deleteConfirm'),
                                    style: 'destructive',
                                    onPress: async () => {
                                        setIsDeleting(true);
                                        const { success, error } = await deleteAccount();
                                        setIsDeleting(false);

                                        if (success) {
                                            Toast.show({
                                                type: 'success',
                                                text1: t('account.accountDeleted'),
                                                position: 'top'
                                            });
                                            // Navigation will happen automatically via auth state change
                                            router.replace('/(auth)/login');
                                        } else {
                                            Alert.alert(
                                                t('common.error'),
                                                error?.message || t('account.deleteError')
                                            );
                                        }
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

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
                <Text className="text-xl font-black font-inter-black text-slate-900">{t('account.title')}</Text>
                <View className="w-12" />
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                {/* Profile Avatar Card */}
                <View className="items-center mb-10">
                    <View className="w-32 h-32 bg-slate-50 rounded-full items-center justify-center border-8 border-slate-50 shadow-sm relative">
                        <MaterialCommunityIcons
                            name={profile?.gender === 'female' ? "face-woman" : "face-man"}
                            size={80}
                            color="#3A1AEB"
                        />
                        <TouchableOpacity className="absolute bottom-0 right-0 bg-[#3A1AEB] w-10 h-10 rounded-full items-center justify-center border-4 border-white">
                            <Ionicons name="camera" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info List */}
                <View className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm mb-6">
                    {/* First Name */}
                    <View className="flex-row items-center p-6 border-b border-slate-50">
                        <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                            <MaterialCommunityIcons name="account-outline" size={24} color="#64748b" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs font-black font-inter-black text-slate-400 uppercase tracking-widest mb-1">
                                {t('account.firstName')}
                            </Text>
                            <TextInput
                                className="text-base font-inter-bold font-bold text-slate-900 p-0"
                                value={name}
                                onChangeText={setName}
                                placeholder="Your first name"
                                placeholderTextColor="#cbd5e1"
                            />
                        </View>
                    </View>

                    {/* Last Name */}
                    <View className="flex-row items-center p-6 border-b border-slate-50">
                        <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                            <MaterialCommunityIcons name="account-outline" size={24} color="#64748b" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs font-black font-inter-black text-slate-400 uppercase tracking-widest mb-1">
                                {t('account.lastName')}
                            </Text>
                            <TextInput
                                className="text-base font-inter-bold font-bold text-slate-900 p-0"
                                value={surname}
                                onChangeText={setSurname}
                                placeholder="Your last name"
                                placeholderTextColor="#cbd5e1"
                            />
                        </View>
                    </View>

                    {/* Email (Read-only) */}
                    <View className="flex-row items-center p-6 border-b border-slate-50 opacity-60">
                        <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                            <MaterialCommunityIcons name="email-outline" size={24} color="#64748b" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs font-black font-inter-black text-slate-400 uppercase tracking-widest mb-1">
                                {t('account.email')}
                            </Text>
                            <Text className="text-base font-inter-bold font-bold text-slate-900">
                                {user?.email}
                            </Text>
                        </View>
                    </View>

                    {/* Gender Selector */}
                    <View className="p-6">
                        <View className="flex-row items-center mb-4">
                            <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                                <MaterialCommunityIcons name="gender-male-female" size={24} color="#64748b" />
                            </View>
                            <Text className="text-xs font-black font-inter-black text-slate-400 uppercase tracking-widest">
                                {t('account.gender')}
                            </Text>
                        </View>

                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                onPress={() => setGender(gender === 'male' ? null : 'male')}
                                className={`flex-1 flex-row items-center justify-center py-4 rounded-2xl border ${gender === 'male' ? 'bg-[#3A1AEB] border-[#3A1AEB]' : 'bg-slate-50 border-slate-100'}`}
                            >
                                <MaterialCommunityIcons name="human-male" size={20} color={gender === 'male' ? 'white' : '#64748b'} />
                                <Text className={`ml-2 font-inter-bold font-bold ${gender === 'male' ? 'text-white' : 'text-slate-600'}`}>{t('account.male')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setGender(gender === 'female' ? null : 'female')}
                                className={`flex-1 flex-row items-center justify-center py-4 rounded-2xl border ${gender === 'female' ? 'bg-[#3A1AEB] border-[#3A1AEB]' : 'bg-slate-50 border-slate-100'}`}
                            >
                                <MaterialCommunityIcons name="human-female" size={20} color={gender === 'female' ? 'white' : '#64748b'} />
                                <Text className={`ml-2 font-inter-bold font-bold ${gender === 'female' ? 'text-white' : 'text-slate-600'}`}>{t('account.female')}</Text>
                            </TouchableOpacity>
                        </View>
                        {gender && (
                            <TouchableOpacity
                                onPress={() => setGender(null)}
                                className="mt-2 self-end"
                            >
                                <Text className="text-red-500 text-sm font-inter-bold">Clear selection</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    className={`mt-4 bg-[#3A1AEB] py-5 rounded-[24px] items-center justify-center shadow-lg shadow-[#3A1AEB]/30 mb-6 ${isSaving ? 'opacity-70' : ''}`}
                >
                    {isSaving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-black font-inter-black text-base uppercase tracking-widest">
                            {t('account.save')}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Danger Zone - Delete Account */}
                <View className="mb-10">
                    <View className="bg-red-50 rounded-[24px] border border-red-100 p-6">
                        <View className="flex-row items-center mb-3">
                            <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#ef4444" />
                            <Text className="text-red-600 font-black font-inter-black text-sm uppercase tracking-widest ml-2">
                                {t('account.dangerZone')}
                            </Text>
                        </View>
                        <Text className="text-red-700 font-inter-medium text-sm mb-4 leading-5">
                            {t('account.deleteAccountDesc')}
                        </Text>
                        <TouchableOpacity
                            onPress={handleDeleteAccount}
                            disabled={isDeleting}
                            className={`bg-red-500 py-4 rounded-2xl items-center justify-center ${isDeleting ? 'opacity-70' : ''}`}
                        >
                            {isDeleting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <View className="flex-row items-center">
                                    <MaterialCommunityIcons name="delete-outline" size={20} color="white" />
                                    <Text className="text-white font-black font-inter-black text-sm uppercase tracking-widest ml-2">
                                        {t('account.deleteAccount')}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </Animated.View>
    );
}
