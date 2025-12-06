import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { supabase, auth } from '../../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Register() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

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

    async function signUpWithEmail() {
        if (!email || !password || !name || !surname || !gender) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            console.log('Attempting sign up with:', { email: email.trim(), passwordLength: password.length, name, surname });

            const { data, error } = await auth.signUp(email, password, {
                name,
                surname,
                gender,
                birthday
            });

            console.log('Sign up response:', { data, error });

            if (error) {
                console.error('Sign up error details:', error);
                Alert.alert('Error', error.message);
            } else {
                Alert.alert('Success', 'Account created successfully!');
                // AuthProvider will handle redirect
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    const renderStep1 = () => (
        <View className="space-y-4">
            <View>
                <Text className="text-slate-300 mb-2 font-medium ml-1">Name</Text>
                <TextInput
                    className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500"
                    placeholder="Alperen"
                    placeholderTextColor="#64748b"
                    value={name}
                    onChangeText={setName}
                />
            </View>
            <View>
                <Text className="text-slate-300 mb-2 font-medium ml-1">Surname</Text>
                <TextInput
                    className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500"
                    placeholder="Kaya"
                    placeholderTextColor="#64748b"
                    value={surname}
                    onChangeText={setSurname}
                />
            </View>
            <View>
                <Text className="text-slate-300 mb-2 font-medium ml-1">Email</Text>
                <TextInput
                    className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500"
                    placeholder="test@example.com"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>
            <View>
                <Text className="text-slate-300 mb-2 font-medium ml-1">Password</Text>
                <TextInput
                    className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500"
                    placeholder="Create a password"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity
                onPress={() => setStep(2)}
                className="bg-cyan-500 py-4 rounded-xl items-center shadow-lg shadow-cyan-500/30 mt-4"
            >
                <Text className="text-white font-bold text-lg">Next</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View className="space-y-6">
            {/* Gender Selection */}
            <View>
                <Text className="text-slate-300 mb-3 font-medium ml-1">Gender</Text>
                <View className="flex-row space-x-4">
                    <TouchableOpacity
                        onPress={() => setGender('male')}
                        className={`flex-1 p-4 rounded-xl border-2 items-center ${gender === 'male' ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 bg-slate-800/30'}`}
                    >
                        <MaterialCommunityIcons name="gender-male" size={32} color={gender === 'male' ? '#06b6d4' : '#64748b'} />
                        <Text className={`mt-2 font-medium ${gender === 'male' ? 'text-white' : 'text-slate-400'}`}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setGender('female')}
                        className={`flex-1 p-4 rounded-xl border-2 items-center ${gender === 'female' ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 bg-slate-800/30'}`}
                    >
                        <MaterialCommunityIcons name="gender-female" size={32} color={gender === 'female' ? '#ec4899' : '#64748b'} />
                        <Text className={`mt-2 font-medium ${gender === 'female' ? 'text-white' : 'text-slate-400'}`}>Female</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Birthday Selection */}
            <View>
                <Text className="text-slate-300 mb-3 font-medium ml-1">Birthday</Text>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-4 flex-row items-center"
                >
                    <MaterialCommunityIcons name="calendar" size={20} color="#94a3b8" />
                    <Text className="ml-3 text-white text-base">
                        {birthday.toLocaleDateString()}
                    </Text>
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

            <View className="flex-row space-x-4 mt-8">
                <TouchableOpacity
                    onPress={() => setStep(1)}
                    className="flex-1 bg-slate-700 py-4 rounded-xl items-center"
                >
                    <Text className="text-white font-bold text-lg">Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={signUpWithEmail}
                    disabled={loading}
                    className={`flex-1 bg-cyan-500 py-4 rounded-xl items-center shadow-lg shadow-cyan-500/30 ${loading ? 'opacity-70' : ''}`}
                >
                    {loading ? (
                        <Text className="text-white font-bold text-lg">Creating...</Text>
                    ) : (
                        <Text className="text-white font-bold text-lg">Complete</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-slate-900"
        >
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center mb-6 mt-8"
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                <View className="mb-8">
                    <Text className="text-3xl font-bold text-white mb-2">Create Account</Text>
                    <Text className="text-slate-400">Step {step} of 2</Text>
                </View>

                {step === 1 ? renderStep1() : renderStep2()}

            </ScrollView>
        </KeyboardAvoidingView>
    );
}
