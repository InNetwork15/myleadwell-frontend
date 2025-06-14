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
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) throw new Error('No token found');
      const decoded: any = jwt_decode(storedToken);
      if (!decoded?.id) throw new Error('Invalid token');
      setToken(storedToken);
      setUserId(decoded.id);
      await fetchEarnings(storedToken);
    } catch (error) {
      console.error('Init error:', error);
      setLoading(false);
    }
  };

  const fetchEarnings = async (authToken: string) => {
    try {
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
      setPendingEarnings(pending);

      setTotalPaid(
        paid.reduce((sum: number, item: any) => sum + (parseFloat(item.payout_amount) || 0), 0)
      );
      setTotalPending(
        pending.reduce((sum: number, item: any) => sum + (parseFloat(item.payout_amount) || 0), 0)
      );
    } catch (error: any) {
      console.error('Fetch error:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (token) {
      setLoading(true);
      await fetchEarnings(token);
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

      <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
        <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
      </TouchableOpacity>

      <Text style={styles.header}>💸 Total Paid: ${totalPaid.toFixed(2)}</Text>
      <Text style={styles.subHeader}>💰 Total Pending: ${totalPending.toFixed(2)}</Text>

      <Text style={styles.sectionTitle}>Paid Earnings</Text>
      {paidEarnings.length === 0 ? (
        <Text style={styles.noData}>No paid earnings found.</Text>
      ) : (
        paidEarnings.map((entry: any, idx: number) => (
          <View key={`paid-${entry.id || idx}`} style={styles.card}>
            <Text style={styles.clientName}>{entry.lead_name}</Text>
            <Text>👤 Purchased By: {entry.provider_name || 'Unknown'}</Text>
            <Text>💵 Paid: ${entry.payout_amount}</Text>
            <Text>
              📆 Paid On:{' '}
              {entry.payout_sent_at
                ? new Date(entry.payout_sent_at).toLocaleDateString()
                : 'Unknown'}
            </Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Pending Earnings</Text>
      {pendingEarnings.length === 0 ? (
        <Text style={styles.noData}>No pending payments yet.</Text>
      ) : (
        pendingEarnings.map((entry: any, idx: number) => (
          <View key={`pending-${entry.id || idx}`} style={[styles.card, { backgroundColor: '#eaf7ff' }]}>
            <Text style={styles.clientName}>{entry.lead_name}</Text>
            <Text>👤 Purchased By: {entry.provider_name || 'Unknown'}</Text>
            <Text>💵 Expected: ${entry.payout_amount}</Text>
            <Text>
              📆 Purchased On:{' '}
              {entry.purchased_at
                ? new Date(entry.purchased_at).toLocaleDateString()
                : 'Unknown'}
            </Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
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
    color: '#999',
    marginBottom: 12,
  },
  homeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f3f5',
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
