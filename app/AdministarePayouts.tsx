import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdministerPayouts() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handlePayouts = async () => {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/process-affiliate-payouts`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            Toast.show({
                type: 'success',
                text1: `✅ Payouts processed`,
                text2: `${response.data.processed} leads were paid`,
            });
        } catch (error) {
            console.error('❌ Error processing payouts:', error);
            Alert.alert('Error', error?.response?.data?.error || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Administer Affiliate Payouts</Text>
            <TouchableOpacity style={styles.button} onPress={handlePayouts} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Run Payouts</Text>}
            </TouchableOpacity>
            <Toast />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#28a745',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        width: 240,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
