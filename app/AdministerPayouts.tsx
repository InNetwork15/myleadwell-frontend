import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
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
      const res = await axios.get(`${API_BASE_URL}/admin/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const paidLeads = (res.data.leads || []).filter((l) => l.payout_status === 'paid');
      setHistory(paidLeads.slice(0, 10));
    } catch (err) {
      console.error('Error fetching history', err);
    }
  };

  const handlePayouts = async () => {
    Alert.alert(
      'Confirm Payouts',
      `Are you sure you want to process payouts for ${previewLeads.length} leads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            try {
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
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Administer Affiliate Payouts</Text>

      <Text style={styles.sectionTitle}>🧾 Leads Eligible for Payout</Text>
      {previewLeads.length === 0 ? (
        <Text style={styles.message}>💧 No leads eligible for payout yet.</Text>
      ) : (
        previewLeads.map((lead, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.label}>Lead Name: <Text style={styles.bold}>{lead.lead_name}</Text></Text>
            <Text style={styles.label}>Affiliate: <Text style={styles.bold}>{lead.affiliate_name}</Text></Text>
            <Text style={styles.label}>Provider: <Text style={styles.bold}>{lead.provider_name}</Text></Text>
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
    backgroundColor: '#F0F4F8', // light blue-gray background
    minHeight: '100%',
  },
  button: {
    backgroundColor: '#19334D', // navy blue
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF', // white text
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    color: '#19334D',
  },
  card: {
    backgroundColor: '#FFFFFF', // clean white card
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#19334D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#19334D',
  },
  bold: {
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    color: '#19334D',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    color: '#19334D',
  },
  subtext: {
    fontStyle: 'italic',
    color: '#555',
    textAlign: 'center',
  },
});
