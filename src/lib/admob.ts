import { Platform } from 'react-native';
import {
    InterstitialAd,
    RewardedAd,
    AdEventType,
    RewardedAdEventType,
    TestIds,
} from 'react-native-google-mobile-ads';

// Production Ad Unit IDs - platform specific
const ANDROID_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-2397116022706721/1481850397';
const IOS_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-2397116022706721/8626499787';

// Rewarded Ad Unit IDs (you'll need to create these in AdMob console)
const ANDROID_REWARDED_AD_UNIT_ID = 'ca-app-pub-2397116022706721/REWARDED_ANDROID'; // TODO: Replace with actual ID
const IOS_REWARDED_AD_UNIT_ID = 'ca-app-pub-2397116022706721/REWARDED_IOS'; // TODO: Replace with actual ID

const getInterstitialAdUnitId = () => {
    if (__DEV__) {
        return TestIds.INTERSTITIAL;
    }
    return Platform.OS === 'ios' ? IOS_INTERSTITIAL_AD_UNIT_ID : ANDROID_INTERSTITIAL_AD_UNIT_ID;
};

const getRewardedAdUnitId = () => {
    if (__DEV__) {
        return TestIds.REWARDED;
    }
    return Platform.OS === 'ios' ? IOS_REWARDED_AD_UNIT_ID : ANDROID_REWARDED_AD_UNIT_ID;
};

class AdMobService {
    private interstitial: InterstitialAd | null = null;
    private rewarded: RewardedAd | null = null;
    private isLoaded: boolean = false;
    private isLoading: boolean = false;
    private isRewardedLoaded: boolean = false;
    private isRewardedLoading: boolean = false;

    /**
     * Pre-load an interstitial ad for later display
     */
    async loadInterstitial(): Promise<void> {
        if (this.isLoading || this.isLoaded) return;

        this.isLoading = true;

        return new Promise((resolve) => {
            const adUnitId = getInterstitialAdUnitId();
            this.interstitial = InterstitialAd.createForAdRequest(adUnitId, {
                requestNonPersonalizedAdsOnly: false,
            });

            const loadedUnsubscribe = this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
                console.log('[AdMob] Interstitial ad loaded');
                this.isLoaded = true;
                this.isLoading = false;
                loadedUnsubscribe();
                resolve();
            });

            const errorUnsubscribe = this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
                console.error('[AdMob] Ad failed to load:', error);
                this.isLoading = false;
                this.isLoaded = false;
                errorUnsubscribe();
                resolve(); // Resolve anyway to not block the flow
            });

            this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
                console.log('[AdMob] Interstitial ad closed');
                this.isLoaded = false;
                this.interstitial = null;
            });

            this.interstitial.load();
        });
    }

    /**
     * Show the pre-loaded interstitial ad
     * @returns true if ad was shown, false otherwise
     */
    async showInterstitial(): Promise<boolean> {
        if (!this.isLoaded || !this.interstitial) {
            console.log('[AdMob] No ad loaded to show');
            return false;
        }

        try {
            await this.interstitial.show();
            this.isLoaded = false;
            return true;
        } catch (error) {
            console.error('[AdMob] Failed to show ad:', error);
            this.isLoaded = false;
            return false;
        }
    }

    /**
     * Pre-load a rewarded ad for later display
     */
    async loadRewarded(): Promise<void> {
        if (this.isRewardedLoading || this.isRewardedLoaded) return;

        this.isRewardedLoading = true;

        return new Promise((resolve) => {
            const adUnitId = getRewardedAdUnitId();
            this.rewarded = RewardedAd.createForAdRequest(adUnitId, {
                requestNonPersonalizedAdsOnly: false,
            });

            const loadedUnsubscribe = this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
                console.log('[AdMob] Rewarded ad loaded');
                this.isRewardedLoaded = true;
                this.isRewardedLoading = false;
                loadedUnsubscribe();
                resolve();
            });

            const errorUnsubscribe = this.rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
                console.error('[AdMob] Rewarded ad failed to load:', error);
                this.isRewardedLoading = false;
                this.isRewardedLoaded = false;
                errorUnsubscribe();
                resolve();
            });

            this.rewarded.load();
        });
    }

    /**
     * Show the pre-loaded rewarded ad
     * @returns true if user earned reward, false otherwise
     */
    async showRewarded(): Promise<boolean> {
        if (!this.isRewardedLoaded || !this.rewarded) {
            console.log('[AdMob] No rewarded ad loaded to show');
            return false;
        }

        return new Promise((resolve) => {
            let earned = false;

            const earnedUnsubscribe = this.rewarded!.addAdEventListener(
                RewardedAdEventType.EARNED_REWARD,
                () => {
                    console.log('[AdMob] User earned reward!');
                    earned = true;
                    earnedUnsubscribe();
                }
            );

            const closedUnsubscribe = this.rewarded!.addAdEventListener(AdEventType.CLOSED, () => {
                console.log('[AdMob] Rewarded ad closed');
                this.isRewardedLoaded = false;
                this.rewarded = null;
                closedUnsubscribe();
                resolve(earned);
            });

            this.rewarded!.show().catch((error) => {
                console.error('[AdMob] Failed to show rewarded ad:', error);
                this.isRewardedLoaded = false;
                resolve(false);
            });
        });
    }

    /**
     * Check if an interstitial ad is ready to be shown
     */
    isAdLoaded(): boolean {
        return this.isLoaded;
    }

    /**
     * Check if a rewarded ad is ready to be shown
     */
    isRewardedAdLoaded(): boolean {
        return this.isRewardedLoaded;
    }

    /**
     * Clean up resources
     */
    cleanup(): void {
        this.interstitial = null;
        this.rewarded = null;
        this.isLoaded = false;
        this.isLoading = false;
        this.isRewardedLoaded = false;
        this.isRewardedLoading = false;
    }
}

export const adMobService = new AdMobService();

