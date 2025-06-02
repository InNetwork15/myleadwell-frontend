import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';

export default function HomeScreen() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [roles, setRoles] = useState<string[]>([]);

    useEffect(() => {
        const loadUser = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                try {
                    const res = await axios.get('http://localhost:5000/account', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    console.log('🔍 Loaded user profile:', res.data);
                    setUser(res.data);
                    setRoles(res.data.roles || []);
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                }
            }
        };
        loadUser();
    }, []);

    if (!roles) {
        return <ActivityIndicator size="large" color="#007bff" />;
    }

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace('/login');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.placeholder}>[Image with "LEAD" will go here]</Text>
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