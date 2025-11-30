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