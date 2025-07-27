import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Platform } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdministerPayouts() {
  const [loading, setLoading] = useState(false);
  const [previewLeads, setPreviewLeads] = useState([]);
  const [history, setHistory] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchPreviewLeads();
    fetchHistory();
  }, []);

  const fetchPreviewLeads = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/preview-payouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreviewLeads(res.data.payouts || []);
    } catch (err) {
      console.error('Error fetching payout preview', err);
    }
  };

  const fetchHistory = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/recent-payouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data.leads || []);
    } catch (err) {
      console.error('Error fetching history', err);
    }
  };

  const runPayouts = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    try {
      console.log('🔄 Running payouts for', previewLeads.length, 'leads');
      const response = await axios.post(`${API_BASE_URL}/admin/process-affiliate-payouts`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Toast.show({
        type: 'success',
        text1: `✅ Payouts processed`,
        text2: `${response.data.processed} leads were paid`,
      });
      fetchPreviewLeads();
      fetchHistory();
    } catch (error) {
      console.error('❌ Error processing payouts:', error);
      Alert.alert('Error', error?.response?.data?.error || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayouts = async () => {
    console.log("⚡ Button pressed!");
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to process payouts for ${previewLeads.length} leads?`)) {
        console.log("⚡ Web confirmation!");
        await runPayouts();
      }
    } else {
      Alert.alert(
        'Confirm Payouts',
        `Are you sure you want to process payouts for ${previewLeads.length} leads?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: async () => {
              console.log("⚡ Alert confirmation!");
              await runPayouts();
            }
          }
        ]
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        <Text style={{ color: '#007bff', fontWeight: '600', fontSize: 16 }}>
          Home
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>Administer Affiliate Payouts</Text>

      <Text style={styles.sectionTitle}>🧾 Leads Eligible for Payout</Text>
      {previewLeads.length === 0 ? (
        <Text style={styles.message}>💧 No leads eligible for payout yet.</Text>
      ) : (
        previewLeads.map((lead, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.label}>Lead Name: <Text style={styles.bold}>{lead.lead_name}</Text></Text>
            <Text style={styles.label}>Affiliate: <Text style={styles.bold}>{lead.affiliate_name || 'N/A'}</Text></Text>
            <Text style={styles.label}>Provider: <Text style={styles.bold}>{lead.provider_name || 'N/A'}</Text></Text>
            <Text style={styles.label}>Lead Status: <Text style={styles.bold}>{lead.lead_status}</Text></Text>
            <Text style={styles.label}>Payout Amount: <Text style={styles.bold}>${lead.projected_payout?.toFixed(2)}</Text></Text>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.button} onPress={handlePayouts} disabled={loading || previewLeads.length === 0}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Run Payouts</Text>}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>📜 Recent Payout History</Text>
      {history.map((lead, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.bold}>{lead.lead_name}</Text>
          <Text>Affiliate: {lead.affiliate_name}</Text>
          <Text>Payout: ${lead.payout_amount?.toFixed(2)}</Text>
          <Text>Status: {lead.payout_status}</Text>
        </View>
      ))}

      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F3F4F6', // soft neutral background
  },
  button: {
    backgroundColor: '#1D4ED8', // brand blue
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  bold: {
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1D4ED8',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    color: '#1D4ED8',
  },
  subtext: {
    fontStyle: 'italic',
    color: '#555',
    textAlign: 'center',
  },
});



