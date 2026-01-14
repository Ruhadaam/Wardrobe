import Purchases, {
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage,
    LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
};

let initializationPromise: Promise<void> | null = null;

export const RevenueCatService = {
    init: async () => {
        if (initializationPromise) return initializationPromise;

        initializationPromise = (async () => {
            try {
                const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

                // KRİTİK DÜZELTME: API Key yoksa durma, hata fırlat ki Singleton hatasına düşme
                if (!apiKey) {
                    const errorMsg = `RevenueCat API key is MISSING for platform: ${Platform.OS}. Check your EAS Secrets or .env file.`;
                    console.error(errorMsg);
                    throw new Error(errorMsg); 
                }

                Purchases.setLogHandler((level, message) => {
                    // TestFlight'ta logları görebilmek için console.log kullanmaya devam ediyoruz
                    console.log(`[RevenueCat][${level}] ${message}`);
                });

                // TestFlight'ta DEBUG loglarını görmek istiyorsan bunu geçici olarak DEBUG yapabilirsin
                await Purchases.setLogLevel(LOG_LEVEL.DEBUG);

                await Purchases.configure({ apiKey });
                console.log('RevenueCat initialized successfully with API Key:', apiKey.substring(0, 8) + "...");
            } catch (e) {
                console.error('Error initializing RevenueCat:', e);
                initializationPromise = null; 
                throw e; // Hatayı yukarı ilet
            }
        })();

        return initializationPromise;
    },

    ensureInitialized: async () => {
        if (!initializationPromise) {
            return await RevenueCatService.init();
        }
        try {
            await initializationPromise;
        } catch (e) {
            // Eğer önceki deneme başarısız olduysa tekrar dene
            initializationPromise = null;
            return await RevenueCatService.init();
        }
    },

    getPurchaserInfo: async (): Promise<CustomerInfo | null> => {
        try {
            await RevenueCatService.ensureInitialized();
            const info = await Purchases.getCustomerInfo();
            return info;
        } catch (e) {
            console.error('Error getting purchaser info:', e);
            return null;
        }
    },

    logIn: async (userId: string): Promise<CustomerInfo | null> => {
        try {
            await RevenueCatService.ensureInitialized();
            const { customerInfo } = await Purchases.logIn(userId);
            console.log('RevenueCat user logged in:', userId);
            return customerInfo;
        } catch (e) {
            console.error('Error logging in user to RevenueCat:', e);
            return null;
        }
    },

    logOut: async (): Promise<CustomerInfo | null> => {
        try {
            await RevenueCatService.ensureInitialized();
            const customerInfo = await Purchases.logOut();
            console.log('RevenueCat user logged out');
            return customerInfo;
        } catch (e) {
            console.error('Error logging out user from RevenueCat:', e);
            return null;
        }
    },

    getOfferings: async (retryCount = 0): Promise<PurchasesOffering | null> => {
        const MAX_RETRIES = 2;
        try {
            // Burada init'in bitmesini kesin olarak bekliyoruz
            await RevenueCatService.ensureInitialized();
            
            const offerings = await Purchases.getOfferings();
            
            if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
                return offerings.current;
            }

            // Eğer current boşsa ama 'all' içinde paket varsa ilkini dön
            const allOfferings = Object.values(offerings.all);
            if (allOfferings.length > 0 && allOfferings[0].availablePackages.length > 0) {
                return allOfferings[0];
            }

            if (retryCount < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return RevenueCatService.getOfferings(retryCount + 1);
            }
            
            return null;
        } catch (e: any) {
            console.error('[RevenueCat] getOfferings Error:', e);
            return null;
        }
    },

    purchasePackage: async (pack: PurchasesPackage) => {
        try {
            await RevenueCatService.ensureInitialized();
            const { customerInfo } = await Purchases.purchasePackage(pack);
            return customerInfo;
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error('Error purchasing package:', e);
            }
            throw e;
        }
    },

    restorePurchases: async () => {
        try {
            await RevenueCatService.ensureInitialized();
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo;
        } catch (e) {
            console.error('Error restoring purchases:', e);
            throw e;
        }
    },

    isPro: async (customerInfo?: CustomerInfo): Promise<boolean> => {
        try {
            const info = customerInfo || await RevenueCatService.getPurchaserInfo();
            // "Wardrobe Pro" isminin RC Dashboard ile birebir aynı olduğundan emin ol!
            return info?.entitlements.active['Wardrobe Pro'] !== undefined;
        } catch (e) {
            return false;
        }
    },
};