import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { loadAuthData } from '../utils/auth';

const AffiliateEarningsScreen = () => {
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = async (token) => {
    try {
      const [paidRes, pendingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/affiliate-earnings-total-paid`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/affiliate-earnings-total-pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setTotalPaid(parseFloat(paidRes.data.total_paid || 0));
      setTotalPending(parseFloat(pendingRes.data.total_pending || 0));
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
      <Text style={styles.header}>Affiliate Earnings</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Total Paid:</Text>
        <Text style={styles.amount}>${totalPaid.toFixed(2)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Total Pending:</Text>
        <Text style={styles.amount}>${totalPending.toFixed(2)}</Text>
      </View>
    </ScrollView>
  );
};

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
});

export default AffiliateEarningsScreen;
