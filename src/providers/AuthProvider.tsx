import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UserProfile = {
    name: string;
    surname: string;
    gender?: string | null;
    birthday?: string | null;
    photo_url?: string;
    credits?: number; // Added credits
};

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: any }>;
    deleteAccount: () => Promise<{ success: boolean; error?: any }>;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: any }>;
    updatePassword: (password: string) => Promise<{ success: boolean; error?: any }>;
    isPremium: boolean;
    refreshPremiumStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    updateProfile: async () => ({ success: false }),
    deleteAccount: async () => ({ success: false }),
    resetPassword: async () => ({ success: false }),
    updatePassword: async () => ({ success: false }),
    isPremium: false,
    refreshPremiumStatus: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial premium check
        refreshPremiumStatus();

        // Handle deep links for authentication (reset password, etc.)
        const handleDeepLink = (url: string) => {
            const fragment = url.split('#')[1];
            if (fragment) {
                const params = new URLSearchParams(fragment);
                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');

                if (access_token && refresh_token) {
                    supabase.auth.setSession({
                        access_token,
                        refresh_token,
                    });
                }
            }
        };

        // Check for initial URL
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink(url);
        });

        // Listen for incoming URLs
        const linkingSubscription = Linking.addEventListener('url', (event) => {
            handleDeepLink(event.url);
        });

        // Check active sessions and sets the user
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                // Identify user in RevenueCat
                try {
                    const { RevenueCatService } = await import('../lib/revenuecat');
                    await RevenueCatService.init();
                    await RevenueCatService.logIn(session.user.id);
                } catch (e) {
                    console.error('Error identifying user in RevenueCat:', e);
                }
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const handlePasswordRecovery = async () => {
            // We'll set a flag or just let the layout handle navigation
            // Expo Router normally handles the URL if the scheme is right
            console.log('[AuthProvider] Password recovery event detected');
        };

        // Listen for changes on auth state (session)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                await handlePasswordRecovery();
            }

            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                // Identify user in RevenueCat
                try {
                    const { RevenueCatService } = await import('../lib/revenuecat');
                    await RevenueCatService.init();
                    await RevenueCatService.logIn(session.user.id);
                } catch (e) {
                    console.error('Error identifying user in RevenueCat:', e);
                }
                fetchProfile(session.user.id);
                refreshPremiumStatus();
            } else {
                // Logout from RevenueCat
                try {
                    const { RevenueCatService } = await import('../lib/revenuecat');
                    await RevenueCatService.logOut();
                } catch (e) {
                    console.error('Error logging out from RevenueCat:', e);
                }
                setProfile(null);
                setIsPremium(false);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            linkingSubscription.remove();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // If profile doesn't exist yet (race condition), try to create it from metadata
                if (error.code === 'PGRST116') {
                    console.log('Profile not found, checking metadata...');
                    const session = await supabase.auth.getSession();
                    const user = session.data.session?.user;

                    if (user?.user_metadata) {
                        const metadata = user.user_metadata;
                        // Attempt to rescue by creating the profile
                        const { data: newProfile, error: createError } = await supabase
                            .from('users')
                            .upsert({
                                id: userId,
                                email: user.email,
                                name: metadata.name,
                                surname: metadata.surname,
                                gender: metadata.gender,
                                birthday: metadata.birthday,
                                photo_url: '',
                            })
                            .select()
                            .single();

                        if (createError) {
                            console.error('Error creating profile from metadata:', createError);
                        } else {
                            console.log('Recovered profile from metadata');
                            setProfile(newProfile);
                            // Also update the local user state to reflect any changes if needed
                        }
                    }
                } else {
                    console.error('Error fetching profile:', error);
                }
            } else {
                setProfile(data);
            }
        } catch (e) {
            console.error('Exception fetching profile:', e);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        // Logout from RevenueCat before signing out
        try {
            const { RevenueCatService } = await import('../lib/revenuecat');
            await RevenueCatService.logOut();
        } catch (e) {
            console.error('Error logging out from RevenueCat:', e);
        }
        await supabase.auth.signOut();
        setProfile(null);
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) return { success: false, error: 'No user session' };
        try {
            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;
            setProfile(data);
            return { success: true };
        } catch (e) {
            console.error('Error updating profile:', e);
            return { success: false, error: e };
        }
    };

    const refreshPremiumStatus = async () => {
        try {
            const { RevenueCatService } = require('../lib/revenuecat');
            const status = await RevenueCatService.isPro();
            setIsPremium(status);
        } catch (e) {
            console.error('Error refreshing premium status:', e);
        }
    };

    const deleteAccount = async () => {
        if (!user) return { success: false, error: 'No user session' };

        try {
            const userId = user.id;

            // 1. Call Supabase Edge Function for full wipe (Storage, DB, Auth)
            try {
                const { data, error } = await supabase.functions.invoke('delete-account');

                if (error) {
                    console.error('[AuthProvider] Edge Function error:', error);
                    // Fallback: Try to wipe locally if edge function failed (though it might have partially succeeded)
                } else {
                    console.log('[AuthProvider] Full account deletion via Edge Function triggered');
                }
            } catch (edgeError) {
                console.error('[AuthProvider] Edge Function exception:', edgeError);
            }

            // 2. Wipe Local Database (Still needed since it's client-side)
            try {
                const { databaseService } = await import('../services/databaseService');
                await databaseService.wipeUserData(userId);
            } catch (localWipeError) {
                console.error('[AuthProvider] Local wipe failed:', localWipeError);
            }

            // 3. Logout from RevenueCat
            try {
                const { RevenueCatService } = await import('../lib/revenuecat');
                await RevenueCatService.logOut();
            } catch (e) {
                console.error('[AuthProvider] Error logging out from RevenueCat:', e);
            }

            // 4. Sign out from Supabase Auth
            await supabase.auth.signOut();
            setProfile(null);
            setUser(null);
            setSession(null);

            return { success: true };
        } catch (e) {
            console.error('[AuthProvider] Error in deleteAccount:', e);
            return { success: false, error: e };
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const { createURL } = await import('expo-linking');
            const redirectTo = createURL('reset-password');
            console.log('[AuthProvider] Reset password redirect URL:', redirectTo);

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectTo,
            });
            if (error) throw error;
            return { success: true };
        } catch (e) {
            console.error('Error in resetPassword:', e);
            return { success: false, error: e };
        }
    };

    const updatePassword = async (password: string) => {
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            return { success: true };
        } catch (e) {
            console.error('Error in updatePassword:', e);
            return { success: false, error: e };
        }
    };

    const value = {
        session,
        user,
        profile,
        isPremium,
        loading,
        signOut,
        updateProfile,
        deleteAccount,
        resetPassword,
        updatePassword,
        refreshPremiumStatus
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
