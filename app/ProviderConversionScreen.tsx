import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API_BASE_URL} from '../config';
import { loadAuthData } from '../utils/auth';

const showToast = (message: string, type: 'info' | 'error' = 'info') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Toast.show({
      type,
      text1: type === 'error' ? 'Error' : 'Notification',
      text2: message,
      position: 'top',
      visibilityTime: 5000,
    });
  }
};

interface ConversionData {
  totalSpent: string;
  revenueEarned: string;
  conversionRate: string;
  inProgress: number;
  recentLeads: Array<{
    id: string;
    leadId: string;
    leadName: string;
    state: string;
    county: string;
    status: string;
    leadAcquisitionCost: string; // Updated field name
  }>;
}

const ProviderConversionScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);

  const fetchConversionData = async () => {
    setLoading(true);
    try {
      const { token, user } = await loadAuthData();
      if (!token || !user) {
        console.error('❌ Missing token or user ID:', { token, user });
        showToast('Please log in to view your conversion data.', 'error');
        return;
      }

      console.log('👤 Raw user object:', user);
const userId = user?.id;

console.log('🧪 Token:', token);
console.log('🧪 User:', user);

const userId = user?.id;


  showToast('Please log in again.', 'error');
  router.push('/login');
  return;
}


  console.error('❌ Missing token or valid user ID:', { token, userId });
  showToast('Please log in again.', 'error');
  router.push('/login');
  return;
}



  console.error('❌ Missing token or valid user ID:', { token, userId });
  showToast('Please log in again.', 'error');
  router.push('/login'); // optional redirect
  return;
}
      console.log('👤 Fetching conversion data for user ID:', userId);

      const response = await axios.get(`${API_BASE_URL}/provider/conversion/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📊 Conversion data response:', response.data);
      setConversionData(response.data);
    } catch (error: any) {
      console.error('❌ Failed to fetch conversion data:', error.response?.data || error.message);
      const errorMessage = error.response?.status === 401
        ? 'Unauthorized. Please log in again.'
        : error.response?.data?.error || 'Failed to load conversion data. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversionData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />;
  }

  if (!conversionData) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No conversion data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => router.push('/')} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={28} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.header}>📊 Provider Conversion Metrics</Text>
      </View>
      <Text style={styles.subtitle}>Your lifetime performance as a provider</Text>

      {/* Defensive UI for conversionData */}
      {conversionData ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lifetime Spend</Text>
            <Text style={styles.cardValue}>${conversionData.totalSpent}</Text>
            <Text style={styles.cardDescription}>Total amount spent on purchasing leads</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Revenue Earned</Text>
            <Text style={styles.cardValue}>${conversionData.revenueEarned}</Text>
            <Text style={styles.cardDescription}>Total revenue from closed sales</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Conversion Rate</Text>
            <Text style={styles.cardValue}>{conversionData.conversionRate}%</Text>
            <Text style={styles.cardDescription}>Percentage of purchased leads that converted to closed sales</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Leads in Progress</Text>
            <Text style={styles.cardValue}>{conversionData.inProgress}</Text>
            <Text style={styles.cardDescription}>Number of leads currently in progress</Text>
          </View>

          <Text style={styles.sectionHeader}>Recent Leads</Text>
          {conversionData.recentLeads.length === 0 ? (
            <Text style={styles.noData}>No recent leads found.</Text>
          ) : (
            conversionData.recentLeads.map((lead) => (
              <View key={lead.id} style={styles.leadCard}>
                <Text style={styles.leadTitle}>{lead.leadName}</Text>
                <Text style={styles.leadDetail}>📍 {lead.state}, {lead.county}</Text>
                <Text style={styles.leadDetail}>💲 Cost: ${lead.leadAcquisitionCost}</Text>
                <Text style={styles.leadDetail}>📦 Status: {lead.status}</Text>
              </View>
            ))
          )}
        </>
      ) : (
        <Text style={styles.noData}>Loading conversion stats...</Text>
      )}

      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginVertical: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  noData: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  leadCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  leadDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
});

export default ProviderConversionScreen;