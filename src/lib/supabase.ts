// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase panelinden Project Settings -> API kısmından alacağınız bilgiler:
const supabaseUrl = 'https://bcmvfwqemkiroufafezd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbXZmd3FlbWtpcm91ZmFmZXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTMxMDcsImV4cCI6MjA4MDA2OTEwN30.HVICd6NklOTi4ZpFMeT8V5RZQZuHa31Y8YkRhsd5fbs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type UserProfile = {
  name: string;
  surname: string;
  gender?: 'male' | 'female' | null;
  birthday?: Date | null;
};

export const auth = {
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase().replace(/[^\x00-\x7F]/g, ""),
      password,
    });
  },

  signUp: async (email: string, password: string, profile: UserProfile) => {
    // 1. Sign up with Supabase Auth
    const cleanEmail = email.trim().toLowerCase().replace(/[^\x00-\x7F]/g, "");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: profile.name,
          surname: profile.surname,
          gender: profile.gender || null,
          birthday: profile.birthday ? profile.birthday.toISOString().split('T')[0] : null,
        }
      }
    });

    if (signUpError) return { data, error: signUpError };

    const { user } = data;

    if (user) {
      // 2. Insert into public.users (Use upsert to handle potential race conditions safely)
      const { error: profileError } = await supabase
        .from('users')
        .upsert([
          {
            id: user.id,
            email: cleanEmail,
            name: profile.name,
            surname: profile.surname,
            gender: profile.gender || null,
            birthday: profile.birthday ? profile.birthday.toISOString().split('T')[0] : null, // YYYY-MM-DD
            photo_url: '',
          },
        ]);

      if (profileError) {
        return { data, error: profileError };
      }
    }

    return { data, error: null };
  }
};