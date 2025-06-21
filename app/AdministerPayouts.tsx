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
        <Text style={styles.subtext}>No leads eligible for payout.</Text>
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
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  subtext: {
    fontStyle: 'italic',
    color: '#555',
  },
  card: {
    backgroundColor: '#f0f4f8',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
