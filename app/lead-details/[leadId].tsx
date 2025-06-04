import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LeadDetailsScreen = () => {
    const { leadId } = useLocalSearchParams(); // dynamic param

    console.log('📦 leadId from route:', leadId);
    console.log('🧭 All search params:', useLocalSearchParams());

    interface Lead {
        lead_name: string;
        lead_email: string;
        lead_phone: string;
        state: string;
        county: string;
        status: string;
        distribution_method: string;
    }

    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLead = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token || token === 'null' || token === 'undefined') {
                    console.warn('⛔ Skipping API call — no token loaded');
                    return;
                }

                const res = await axios.get(`${apiBaseUrl}/leads/${leadId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setLead(res.data);
            } catch (error) {
                console.error('❌ Error fetching lead:', error);
            } finally {
                setLoading(false);
            }
        };

        if (leadId) fetchLead();
    }, [leadId]);

    if (!leadId) {
        return (
            <View style={styles.container}>
                <Text style={styles.error}>❗️ Lead ID not found in route.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>📄 Lead Details</Text>

            {loading ? (
                <ActivityIndicator size="large" color="blue" />
            ) : lead ? (
                <View style={styles.card}>
                    <Text style={styles.info}>🧑 Name: {lead.lead_name}</Text>
                    <Text style={styles.info}>📧 Email: {lead.lead_email}</Text>
                    <Text style={styles.info}>📞 Phone: {lead.lead_phone}</Text>
                    <Text style={styles.info}>📍 State: {lead.state}</Text>
                    <Text style={styles.info}>🗺 County: {lead.county}</Text>
                    <Text style={styles.info}>📦 Status: {lead.status}</Text>
                    <Text style={styles.info}>📡 Distribution: {lead.distribution_method}</Text>
                </View>
            ) : (
                <Text style={styles.error}>❌ Lead not found.</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff', flex: 1 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    card: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 16 },
    info: { fontSize: 16, marginBottom: 8 },
    error: { fontSize: 16, color: 'red' },
});

export default LeadDetailsScreen;
