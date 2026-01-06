import React, { createContext, useContext, useEffect, useState } from 'react';
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

        // Listen for changes on auth state (session)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

            // 1. Delete all user's clothes from Supabase (this will also clean up storage references)
            const { error: clothesError } = await supabase
                .from('clothes')
                .delete()
                .eq('user_id', userId);

            if (clothesError) {
                console.error('Error deleting clothes:', clothesError);
                // Continue anyway - clothes deletion failure shouldn't block account deletion
            }

            // 2. Delete all user's outfits from Supabase
            const { error: outfitsError } = await supabase
                .from('outfits')
                .delete()
                .eq('user_id', userId);

            if (outfitsError) {
                console.error('Error deleting outfits:', outfitsError);
                // Continue anyway
            }

            // 3. Delete all user's storage files (uploads/{userId}/*)
            try {
                // List all files in user's folder
                const { data: files, error: listError } = await supabase.storage
                    .from('uploads')
                    .list(userId, {
                        limit: 1000,
                        offset: 0,
                        sortBy: { column: 'name', order: 'asc' }
                    });

                if (!listError && files && files.length > 0) {
                    // Delete all files
                    const filePaths = files.map(file => `${userId}/${file.name}`);
                    const { error: deleteStorageError } = await supabase.storage
                        .from('uploads')
                        .remove(filePaths);

                    if (deleteStorageError) {
                        console.error('Error deleting storage files:', deleteStorageError);
                        // Try to delete the folder itself if supported
                        try {
                            await supabase.storage
                                .from('uploads')
                                .remove([userId]);
                        } catch (e) {
                            console.warn('Could not delete user folder:', e);
                        }
                    } else {
                        console.log(`Deleted ${filePaths.length} files from storage`);
                    }
                }
            } catch (storageError) {
                console.error('Error cleaning up storage:', storageError);
                // Continue anyway - storage cleanup failure shouldn't block account deletion
            }

            // 4. Delete user profile from users table
            const { error: profileError } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (profileError) {
                console.error('Error deleting user profile:', profileError);
                // Continue anyway
            }

            // 5. Clear local database (clothes and outfits)
            try {
                const { databaseService } = await import('../services/databaseService');
                // Get all local items and outfits for this user
                const localItems = await databaseService.getItems(userId);
                const localOutfits = await databaseService.getOutfits(userId);
                
                // Delete all local items
                for (const item of localItems) {
                    await databaseService.deleteItem(item.id);
                }
                
                // Delete all local outfits
                for (const outfit of localOutfits) {
                    await databaseService.deleteOutfit(outfit.id);
                }
            } catch (localDbError) {
                console.error('Error cleaning local database:', localDbError);
                // Continue anyway
            }

            // 6. Logout from RevenueCat
            try {
                const { RevenueCatService } = await import('../lib/revenuecat');
                await RevenueCatService.logOut();
            } catch (e) {
                console.error('Error logging out from RevenueCat:', e);
            }

            // 7. Sign out from Supabase Auth
            await supabase.auth.signOut();
            setProfile(null);
            setUser(null);
            setSession(null);

            return { success: true };
        } catch (e) {
            console.error('Error deleting account:', e);
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
        refreshPremiumStatus
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
