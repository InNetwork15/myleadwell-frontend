import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { loadAuthData } from '../utils/auth';

const AffiliateEarningsScreen = () => {
  const router = useRouter();
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [recentPaid, setRecentPaid] = useState([]);
  const [recentPending, setRecentPending] = useState([]);

  const fetchEarnings = async (token) => {
    try {
      const [paidRes, pendingRes, paidLeadsRes, pendingLeadsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/affiliate-earnings-total-paid`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/affiliate-earnings-total-pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/affiliate-earnings-recent-paid`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/affiliate-earnings-recent-pending`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setTotalPaid(parseFloat(paidRes.data.total_paid || 0));
      setTotalPending(parseFloat(pendingRes.data.total_pending || 0));
      setRecentPaid(paidLeadsRes.data || []);
      console.log('🟡 Pending Leads API Response:', pendingLeadsRes.data);
      setRecentPending(pendingLeadsRes.data || []);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const init = async () => {
    const { token } = await loadAuthData();
    if (token) {
      await fetchEarnings(token);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await init();
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
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#f8f9fa',
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#ced4da',
          marginBottom: 12,
        }}
        onPress={() => router.push('/HomeScreen')}
      >
        <Text
          style={{
            color: '#007bff',
            fontWeight: '600',
            fontSize: 16,
          }}
        >
          Home
        </Text>
      </TouchableOpacity>

      <Text style={styles.header}>Affiliate Earnings</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Total Paid:</Text>
        <Text style={styles.amount}>${totalPaid.toFixed(2)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Total Pending:</Text>
        <Text style={styles.amount}>${totalPending.toFixed(2)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subHeader}>🟢 10 Most Recent Paid Leads</Text>
        {recentPaid.length === 0 ? (
          <Text style={styles.leadItem}>No paid leads found.</Text>
        ) : (
          recentPaid.slice(0, 10).map((lead, index) => (
            <Text key={index} style={styles.leadItem}>
              {lead.lead_name} — ${lead.payout_amount} on {lead.paid_at ? new Date(lead.paid_at).toLocaleDateString() : 'N/A'}
            </Text>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.subHeader}>🟡 10 Most Recent Pending Leads</Text>
        {recentPending.length === 0 ? (
          <Text style={styles.leadItem}>No pending leads found.</Text>
        ) : (
          recentPending.slice(0, 10).map((lead, index) => (
            <View key={index} style={{ marginBottom: 8 }}>
              <Text style={styles.leadItem}>
                <Text style={{ fontWeight: 'bold' }}>{lead.lead_name}</Text>
                {lead.job_title ? ` — ${lead.job_title}` : ''}
              </Text>
              <Text style={styles.leadItem}>
                Projected Payout:{' '}
                <Text style={{ color: '#007AFF' }}>${Number(lead.projected_payout).toFixed(2)}</Text>
              </Text>
              <Text style={styles.leadItem}>
                Submitted: {lead.purchased_at ? new Date(lead.purchased_at).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          ))
        )}
      </Text>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  amount: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 5,
    color: '#007AFF',
  },
  section: { marginTop: 20 },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  leadItem: {
    fontSize: 14,
    marginBottom: 6,
    color: '#555',
  },
});

export default AffiliateEarningsScreen;
