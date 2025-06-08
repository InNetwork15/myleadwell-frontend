import Toast from 'react-native-toast-message'; // ✅ Import Toast at the top
import React, { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  ScrollView, // ✅ Add this import
  ActivityIndicator,
} from 'react-native';
import { getCurrentUser } from '../utils/auth'; // Ensure proper import
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native'; // Import navigation hook


const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://myleadwell-backend.onrender.com';



const formatCurrency = (value: string | number | null) => {
  if (!value) return '';
  return parseFloat(value.toString()).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

export default function MyLeadsScreen() {
  interface Lead {
    lead_id: string;
    purchase_id?: string;
    lead_name: string;
    lead_email: string;
    lead_phone: string;
    state_name?: string;
    state?: string;
    county_name?: string;
    county?: string;
    provider_revenue?: string | number;
    last_updated?: string | null;
    purchase_status?: string;
  }

  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusByLead, setStatusByLead] = useState<Record<string, string | number | undefined>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
  const [loading, setLoading] = useState(false);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const navigation = useNavigation(); // Initialize navigation

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Missing token');

      const res = await axios.get(`${API_BASE_URL}/my-purchased-leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const leadsWithProperData = res.data.map((lead: any) => ({
        ...lead,
        purchase_id: lead.purchase_id || lead.id || '',
        state: lead.state_name || lead.state || 'N/A',
        county: lead.county_name || lead.county || 'N/A',
        provider_revenue: lead.provider_revenue || '',
        last_updated: lead.last_updated || null,
        purchase_status: lead.purchase_status || lead.status || 'new',
      }));

      setLeads(leadsWithProperData);

      const initialStatusByLead: { [key: string]: string | number | undefined } = {};
      leadsWithProperData.forEach((lead) => {
        initialStatusByLead[lead.lead_id] = lead.purchase_status;
        if (lead.provider_revenue) {
          initialStatusByLead[`${lead.lead_id}_provider_revenue`] = lead.provider_revenue;
        }
      });

      setStatusByLead(initialStatusByLead);
    } catch (error) {
      console.error('❌ Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = (leadId: string, newStatus: string) => {
    setStatusByLead((prev) => ({
      ...prev,
      [leadId]: newStatus,
    }));
    Alert.alert('ℹ️ Status Changed', `Status for lead ${leadId} changed to ${newStatus}`);
  };

  const handleSaveStatus = async (lead: { lead_id: string; purchase_id?: string }, newStatus: string, provider_revenue: string | number | undefined) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Missing token');

      if (!lead.purchase_id || !newStatus) {
        Toast.show({
          type: 'error',
          text1: '❌ Save Failed',
          text2: 'Missing lead information.',
          position: 'top',
        });
        return;
      }

      setSavingLeadId(lead.lead_id); // ✅ Show saving indicator for this lead

      const res = await axios.patch(
        `${API_BASE_URL}/lead-purchases/${lead.purchase_id}/status`,
        { status: newStatus, provider_revenue: provider_revenue || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        Toast.show({
          type: 'success',
          text1: '✅ Lead Updated!',
          text2: `Lead ${lead.lead_id} saved successfully.`,
          position: 'top',
        });

        setTimeout(() => {
          fetchLeads();
        }, 100);
      } else {
        Toast.show({
          type: 'error',
          text1: '❌ Save Failed',
          text2: 'Unexpected server response.',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('❌ Error saving status:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          Toast.show({
            type: 'error',
            text1: '❌ Save Failed',
            text2: error.response.data.error || 'Unexpected server response.',
            position: 'top',
          });
        } else if (error.request) {
          Toast.show({
            type: 'error',
            text1: '❌ Network Error',
            text2: 'No response received from server.',
            position: 'top',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: '❌ Save Error',
            text2: error.message,
            position: 'top',
          });
        }
      } else if (error instanceof Error) {
        Toast.show({
          type: 'error',
          text1: '❌ Save Error',
          text2: error.message,
          position: 'top',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: '❌ Unknown Error',
          text2: 'An unexpected problem occurred.',
          position: 'top',
        });
      }
    } finally {
      setSavingLeadId(null); // ✅ Hide saving indicator
    }
  };
  

  const handleprovider_revenueChange = (leadId: string, value: string) => {
    setStatusByLead((prev) => ({
      ...prev,
      [`${leadId}_provider_revenue`]: value,
    }));
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('HomeScreen')} // Navigate to HomeScreen
      >
        <Text style={styles.homeButtonText}>Home</Text>
      </TouchableOpacity>

      <Text style={styles.title}>📥 My Purchased Leads</Text>

      {/* Filter and Sort Dropdowns */}
      <Picker selectedValue={statusFilter} onValueChange={setStatusFilter}>
        <Picker.Item label="All Statuses" value="all" />
        <Picker.Item label="New" value="new" />
        <Picker.Item label="Attempted Contact" value="attempted-contact" />
        <Picker.Item label="In Progress" value="in-progress" />
        <Picker.Item label="Closed Sale Made" value="closed-sale-made" />
        <Picker.Item label="Closed No Sale" value="closed-no-sale" />
        <Picker.Item label="Ineligible" value="ineligible" />
      </Picker>

      <Picker selectedValue={sortOrder} onValueChange={setSortOrder}>
        <Picker.Item label="Most Recently Updated" value="recent" />
        <Picker.Item label="Oldest First" value="oldest" />
      </Picker>

      <Text>Total Leads: {leads.length}</Text>

      {/* Filter and Sort Leads */}
      {leads
        .filter((lead) =>
          statusFilter === 'all' || lead.purchase_status === statusFilter
        )
        .sort((a, b) =>
          sortOrder === 'recent'
            ? new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime()
            : new Date(a.last_updated || 0).getTime() - new Date(b.last_updated || 0).getTime()
        )
        .map((lead) => (
          <View key={lead.lead_id} style={styles.card}>
            <Text style={styles.name}>{lead.lead_name}</Text>
            <Text>📧 {lead.lead_email}</Text>
            <Text>📞 {lead.lead_phone}</Text>
            <Text>📍 State: {lead.state || '—'}</Text>
            <Text>🗺 County: {lead.county || '—'}</Text>
            <Text>📦 Status:</Text>
            <Picker
              selectedValue={statusByLead[lead.lead_id] ?? lead.purchase_status ?? 'new'}
              onValueChange={(value) => handleStatusChange(lead.lead_id, String(value))}
            >
              <Picker.Item label="New" value="new" />
              <Picker.Item label="Attempted Contact" value="attempted-contact" />
              <Picker.Item label="Ineligible" value="ineligible" />
              <Picker.Item label="In Progress" value="in-progress" />
              <Picker.Item label="Closed Sale Made" value="closed-sale-made" />
              <Picker.Item label="Closed No Sale" value="closed-no-sale" />
            </Picker>

            {statusByLead[lead.lead_id] === 'closed-sale-made' && (
              <>
                <TextInput
                  style={styles.provider_revenueInput}
                  placeholder="Enter provider_revenue"
                  keyboardType="numeric"
                  onChangeText={(value) => handleprovider_revenueChange(lead.lead_id, value)} // ✅ Use the defined function
                  value={String(statusByLead[`${lead.lead_id}_provider_revenue`] ?? '')}
                />
                {statusByLead[`${lead.lead_id}_provider_revenue`] && (
                  <Text style={styles.currencyDisplay}>
                    {formatCurrency(statusByLead[`${lead.lead_id}_provider_revenue`] ?? null)}
                  </Text>
                )}
              </>
            )}

            <Text>
              🗓 Last Updated:{' '}
              {lead.last_updated
                ? new Date(lead.last_updated).toLocaleString()
                : 'Not available'}
            </Text>

            <TouchableOpacity
              disabled={savingLeadId === lead.lead_id} // ✅ Disable button while saving
              onPress={() =>
                handleSaveStatus(
                  lead,
                  String(statusByLead[lead.lead_id] || lead.purchase_status || 'new'),
                  statusByLead[`${lead.lead_id}_provider_revenue`]
                )
              }
              style={{
                marginTop: 12,
                backgroundColor: savingLeadId === lead.lead_id ? '#aaa' : '#007bff',
                padding: 10,
                borderRadius: 4,
              }}
            >
              {savingLeadId === lead.lead_id ? (
                <ActivityIndicator color="#fff" /> // ✅ Show spinner while saving
              ) : (
                <Text style={{ color: '#fff', textAlign: 'center' }}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  card: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  saveButton: {
    backgroundColor: '#28a745',
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  provider_revenueInput: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  currencyDisplay: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  provider_revenueDisplay: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#d4edda', // Green highlight
    color: '#155724',
    fontSize: 16,
    fontWeight: 'bold',
    borderRadius: 6,
  },
  homeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa', // Light gray background
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ced4da', // Light border
    marginBottom: 12,
  },
  homeButtonText: {
    color: '#007bff', // Blue text
    fontWeight: '600',
    fontSize: 16,
  },
});
