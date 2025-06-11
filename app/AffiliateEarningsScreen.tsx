import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from 'jwt-decode';
import { API_BASE_URL } from '../config';

const AffiliateEarningsScreen = () => {
  const router = useRouter();
  const [paidEarnings, setPaidEarnings] = useState([]);
  const [pendingEarnings, setPendingEarnings] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) throw new Error('No token found');

      const decoded: any = jwt_decode(storedToken);
      const uid = decoded?.id;

      if (!uid) throw new Error('No user ID in token');

      console.log('🔐 Decoded user ID:', uid);
      setToken(storedToken);
      setUserId(uid);
      await AsyncStorage.setItem('user_id', uid.toString());

      await fetchEarnings(storedToken, uid);
    } catch (err) {
      console.error('❌ Init/auth error:', err);
      setLoading(false);
    }
  };

  const fetchEarnings = async (authToken: string, uid: number) => {
    try {
      console.log('📡 Fetching earnings for UID:', uid);

      const [paidRes, pendingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/affiliate-earnings`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_BASE_URL}/affiliate-earnings-pending`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      const paid = paidRes.data || [];
      const pending = pendingRes.data || [];

      setPaidEarnings(paid);
      setTotalPaid(
        paid.reduce((sum: number, l: any) => sum + parseFloat(l.payout_amount || 0), 0)
      );

      setPendingEarnings(pending);
      setTotalPending(
        pending.reduce((sum: number, l: any) => sum + parseFloat(l.payout_amount || 0), 0)
      );

      console.log('✅ Earnings loaded:', { paid, pending });
    } catch (err: any) {
      console.error('❌ Fetch earnings error:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshEarnings = async () => {
    if (token && userId !== null) {
      setLoading(true);
      await fetchEarnings(token, userId);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/HomeScreen')}>
        <Text style={styles.homeButtonText}>🏠 Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.refreshButton} onPress={refreshEarnings}>
        <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
      </TouchableOpacity>

      <Text style={styles.header}>💸 Total Paid: ${totalPaid.toFixed(2)}</Text>
      <Text style={styles.subHeader}>💰 Total Pending: ${totalPending.toFixed(2)}</Text>

      <Text style={styles.sectionTitle}>Paid Earnings</Text>
      {paidEarnings.length === 0 ? (
        <Text style={styles.noData}>No paid earnings yet.</Text>
      ) : (
        paidEarnings.map((lead: any, index: number) => (
          <View key={`paid-${lead.id || index}`} style={styles.card}>
            <Text style={styles.clientName}>{lead.lead_name}</Text>
            <Text>📅 Submitted: {new Date(lead.created_at).toLocaleDateString()}</Text>
            <Text>👤 Purchased By: {lead.provider_name || 'Unknown'}</Text>
            <Text>💵 Payout: ${lead.payout_amount}</Text>
            <Text>📆 Paid on: {new Date(lead.payout_sent_at).toLocaleDateString()}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Pending Earnings</Text>
      {pendingEarnings.length === 0 ? (
        <Text style={styles.noData}>No pending earnings.</Text>
      ) : (
        pendingEarnings.map((lead: any, index: number) => (
          <View key={`pending-${lead.id || index}`} style={[styles.card, { backgroundColor: '#e6f7ff' }]}>
            <Text style={styles.clientName}>{lead.lead_name}</Text>
            <Text>📅 Submitted: {new Date(lead.created_at).toLocaleDateString()}</Text>
            <Text>👤 Purchased By: {lead.provider_name || 'Unknown'}</Text>
            <Text>💵 Expected Payout: ${lead.payout_amount}</Text>
            <Text>📆 Purchased on: {new Date(lead.purchased_at).toLocaleDateString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#f4f4f4',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noData: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  homeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ced4da',
    marginBottom: 12,
  },
  homeButtonText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 16,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AffiliateEarningsScreen;
