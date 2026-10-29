import { useLocalSearchParams } from 'expo-router';

import { MyttConnectView } from '../src/features/mytt';

export default function MyttConnectScreen() {
    const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

    return <MyttConnectView returnTo={returnTo} />;
}
