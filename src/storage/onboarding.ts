import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DONE_KEY = 'tttracker.onboardingDone';

export async function isOnboardingDone() {
    return (await AsyncStorage.getItem(ONBOARDING_DONE_KEY)) === '1';
}

export async function markOnboardingDone() {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
}
