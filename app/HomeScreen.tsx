import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native'; // <-- Add Image import
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../utils/config';

export default function HomeScreen() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [stripeStatus, setStripeStatus] = useState<'not_connected' | 'pending' | 'connected'>('not_connected');

    useEffect(() => {
        const loadUser = async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.warn('⛔ No token found, redirecting to login');
                router.replace('/login');
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(`${API_BASE_URL}/account`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('🔍 Loaded user profile:', res.data);
                setUser(res.data);
                setRoles(res.data.roles || []);

                // Check Stripe status
                if (res.data.stripe_account_id) {
                    const stripeResponse = await axios.post(
                        `${API_BASE_URL}/stripe/onboard`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setStripeStatus(stripeResponse.data.status || 'pending');
                    if (stripeResponse.data.status === 'pending') {
                        Toast.show({
                            type: 'info',
                            text1: 'Complete Stripe Setup',
                            text2: 'Connect your Stripe account to receive payouts. Go to My Account to set it up.',
                        });
                    }
                } else {
                    setStripeStatus('not_connected');
                    Toast.show({
                        type: 'info',
                        text1: 'Connect with Stripe',
                        text2: 'Set up your Stripe account to receive payouts. Go to My Account to connect.',
                    });
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
                Toast.show({ type: 'error', text1: 'Failed to load user profile' });
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    if (loading || !roles) {
        return <ActivityIndicator size="large" color="#007bff" />;
    }

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace('/login');
        Toast.show({ type: 'success', text1: 'Logged out successfully' });
    };

    return (
        <View style={styles.container}>
            <Image
source={require('../assets/leadwellimage.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.title}>MyLeadWell</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/my-leads-created')}>
                <Text style={styles.buttonText}>My Leads Created</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/AvailableLeadsScreen')}>
                <Text style={styles.buttonText}>View Available Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/my-leads')}>
                <Text style={styles.buttonText}>My Purchased Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/account')}>
                <Text style={styles.buttonText}>My Account</Text>
            </TouchableOpacity>
            {(roles.includes('affiliate_marketer') || roles.includes('admin')) && (
                <TouchableOpacity style={styles.button} onPress={() => router.push('/AffiliateEarningsScreen')}>
                    <Text style={styles.buttonText}>Affiliate Earnings</Text>
                </TouchableOpacity>
            )}
            {(roles.includes('provider') || roles.includes('admin')) && (
                <TouchableOpacity style={styles.button} onPress={() => router.push('/ProviderConversionScreen')}>
                    <Text style={styles.buttonText}>Provider Conversion Metrics</Text>
                </TouchableOpacity>
            )}
            {roles.includes('admin') && (
                <>
                    <TouchableOpacity style={styles.button} onPress={() => router.push('/Admin-leads')}>
                        <Text style={styles.buttonText}>Admin: View All Leads</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => router.push('/admin-users')}>
                        <Text style={styles.buttonText}>Admin: Manage Users</Text>
                    </TouchableOpacity>
                </>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.buttonText}>Log Out</Text>
            </TouchableOpacity>
            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    logo: {
        width: 200,
        height: 100,
        marginBottom: 20,
    },
    placeholder: {
        fontSize: 16,
        color: '#888',
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 36,
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginVertical: 6,
        width: 280,
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginTop: 30,
        width: 280,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});