import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase, auth } from '../../lib/supabase';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await auth.signIn(email, password);

        if (error) {
            Alert.alert('Error', error.message);
        }
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-slate-900"
        >
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View className="p-8 w-full max-w-md mx-auto">

                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-cyan-500/10 rounded-full items-center justify-center mb-4 border border-cyan-500/20">
                            <MaterialCommunityIcons name="wardrobe" size={40} color="#06b6d4" />
                        </View>
                        <Text className="text-3xl font-bold text-white tracking-tight">Welcome</Text>
                        <Text className="text-slate-400 mt-2 text-center">Sign in to access your digital wardrobe</Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-slate-300 mb-2 font-medium ml-1">Email</Text>
                            <View className="flex-row items-center bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:border-cyan-500 transition-colors">
                                <MaterialCommunityIcons name="email-outline" size={20} color="#94a3b8" />
                                <TextInput
                                    className="flex-1 ml-3 text-white"
                                    placeholder="Enter your email"
                                    placeholderTextColor="#64748b"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-slate-300 my-2 font-medium ml-1">Password</Text>
                            <View className="flex-row items-center bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:border-cyan-500 transition-colors">
                                <MaterialCommunityIcons name="lock-outline" size={20} color="#94a3b8" />
                                <TextInput
                                    className="flex-1 ml-3 text-white"
                                    placeholder="Enter your password"
                                    placeholderTextColor="#64748b"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            className="items-end"
                        >
                            <Text className="text-cyan-400 text-sm m-4 font-medium">Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={signInWithEmail}
                            disabled={loading}
                            className={`bg-cyan-500 py-4 rounded-xl items-center shadow-lg shadow-cyan-500/30 ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? (
                                <Text className="text-white font-bold text-lg">Signing in...</Text>
                            ) : (
                                <Text className="text-white font-bold text-lg">Sign In</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-center mt-8">
                        <Text className="text-slate-400">Don't have an account? </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text className="text-cyan-400 font-bold">Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
