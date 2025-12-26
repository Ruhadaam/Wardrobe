import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { wardrobeService } from '../services/wardrobeService';
import { WardrobeItem } from '../services/visionApi';
import Toast from 'react-native-toast-message';

interface WardrobeContextType {
    items: WardrobeItem[];
    loading: boolean;
    initialLoadComplete: boolean;
    refreshItems: () => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextType>({
    items: [],
    loading: false,
    initialLoadComplete: false,
    refreshItems: async () => { },
});

export const useWardrobe = () => useContext(WardrobeContext);

export function WardrobeProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [items, setItems] = useState<WardrobeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    useEffect(() => {
        if (user) {
            loadItems();
        } else {
            setItems([]);
            // If no user, mark as complete so splash can hide
            setInitialLoadComplete(true);
        }
    }, [user]);

    const loadItems = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Initialize DB (safe to call multiple times)
            await wardrobeService.initialize();

            // 2. Load Local Items (Fast)
            const localData = await wardrobeService.getLocalItems(user.id);
            if (localData && localData.length > 0) {
                setItems(mapItems(localData));
            }

            // 3. Fetch Remote & Sync (Background update if local existed, else primary loading)
            const remoteData = await wardrobeService.fetchItems(user.id);
            setItems(mapItems(remoteData));

        } catch (error) {
            console.error('Failed to load items in provider:', error);
            Toast.show({
                type: 'error',
                text1: 'Error loading wardrobe',
                text2: 'Could not sync with cloud.',
            });
        } finally {
            setLoading(false);
            setInitialLoadComplete(true);
        }
    };

    const mapItems = (data: any[]): WardrobeItem[] => {
        return data.map((row: any) => {
            const analysis = row.analysis_json.analysis || row.analysis_json;
            return {
                ...row.analysis_json,
                item_id: row.id,
                image_url: row.image_url,
                analysis: analysis
            };
        });
    };

    const refreshItems = async () => {
        await loadItems();
    };

    return (
        <WardrobeContext.Provider value={{ items, loading, initialLoadComplete, refreshItems }}>
            {children}
        </WardrobeContext.Provider>
    );
}

