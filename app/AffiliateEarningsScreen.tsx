import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_BASE_URL} from '../config';

const AffiliateEarningsScreen = () => {
  const router = useRouter();
  const [paidEarnings, setPaidEarnings] = useState([]);
  const [pendingEarnings, setPendingEarnings] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthData = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUserId = await AsyncStorage.getItem('user_id');
      console.log('User ID:', storedUserId);
      setToken(storedToken);
      setUserId(storedUserId);

      if (!storedToken || !storedUserId) {
        setLoading(false);
        return;
      }

      await fetchEarnings(storedToken, storedUserId);
    };

    fetchAuthData();
  }, []);

  const fetchEarnings = async (authToken: string, userId: string) => {
    try {
      const paidRes = await axios.get(`${BASE_URL}/affiliate-earnings`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log('Paid earnings:', JSON.stringify(paidRes.data, null, 2));
      setPaidEarnings(paidRes.data);
      const paidSum = paidRes.data.reduce((acc, lead) => acc + parseFloat(lead.payout_amount || 0), 0);
      setTotalPaid(paidSum);

      const pendingRes = await axios.get(`${BASE_URL}/affiliate-earnings-pending`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log('Pending earnings:', JSON.stringify(pendingRes.data, null, 2));
      setPendingEarnings(pendingRes.data);
      const pendingSum = pendingRes.data.reduce((acc, lead) => acc + parseFloat(lead.payout_amount || 0), 0);
      setTotalPending(pendingSum);
    } catch (err) {
      console.error('Error fetching earnings:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshEarnings = async () => {
    setLoading(true);
    const storedToken = await AsyncStorage.getItem('token');
    const storedUserId = await AsyncStorage.getItem('user_id');
    if (storedToken && storedUserId) {
      await fetchEarnings(storedToken, storedUserId);
    } else {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => router.push('/HomeScreen')}
      >
        <Text style={styles.homeButtonText}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={refreshEarnings}
      >
        <Text style={styles.refreshButtonText}>Refresh Earnings</Text>
      </TouchableOpacity>
      <Text style={styles.header}>💸 Total Paid Earnings: ${totalPaid.toFixed(2)}</Text>
      <Text style={styles.subHeader}>💰 Total Pending Earnings: ${totalPending.toFixed(2)}</Text>

      <Text style={styles.sectionTitle}>Paid Earnings</Text>
      {paidEarnings.length === 0 ? (
        <Text style={styles.noData}>No paid earnings yet.</Text>
      ) : (
        paidEarnings.map((lead, index) => (
          <View key={`paid-${lead.id ?? index}`} style={styles.card}>
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
        pendingEarnings.map((lead, index) => (
          <View key={`pending-${lead.id ?? index}`} style={[styles.card, { backgroundColor: '#e6f7ff' }]}>
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