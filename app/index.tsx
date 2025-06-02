import { useEffect } from 'react';
import { router } from 'expo-router';
import { loadAuthData } from '../utils/auth';

export default function Index() {
    useEffect(() => {
        const timeout = setTimeout(() => {
            const loadUserData = async () => {
                try {
                    const { token, user } = await loadAuthData();
                    if (token && user) {
                        console.log('✅ Authenticated user found:', user);
                        router.replace('/HomeScreen');
                    } else {
                        console.log('❌ No authenticated user, redirecting to login');
                        router.replace('/login');
                    }
                } catch (error) {
                    console.error('❌ Error loading auth data:', error);
                    router.replace('/login');
                }
            };
            loadUserData();
        }, 100);
        return () => clearTimeout(timeout);
    }, []);

    return null;
}