import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UserProfile = {
    name: string;
    surname: string;
    gender: string;
    birthday: string;
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

        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes on auth state (session)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                refreshPremiumStatus();
            } else {
                setProfile(null);
                setIsPremium(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
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

    const value = {
        session,
        user,
        profile,
        isPremium,
        loading,
        signOut,
        updateProfile,
        refreshPremiumStatus
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
