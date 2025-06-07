import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import { getUserFromToken } from '../utils/auth';

import { API_BASE_URL} } from '../config'; // adjust path if needed


const showToast = (message: string, type: 'info' | 'error' = 'info') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Toast.show({
      type,
      text1: type === 'error' ? 'Error' : 'Notification',
      text2: message,
      position: 'top',
    });
  }
};

const JOB_TITLES = ['Real Estate Agent', 'Loan Originator', 'Title Agent', 'Insurance Agent', 'Home Inspector'];

const AvailableLeadsScreen = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadIds, setLeadIds] = useState([]);

  interface Lead {
    id: number;
    lead_name: string;
    lead_email?: string;
    lead_phone?: string;
    state: string;
    county: string;
    affiliate_name: string; // Added to display affiliate marketer's name
    purchased_by?: { job_title: string; first_name: string; last_name: string }[];
    role_enabled?: { [key: string]: boolean };
    distribution_method: 'JUMPBALL' | 'NETWORK' | string;
    preferred_provider_ids?: number[];
    status?: string;
    provider_price?: number;
  }

  const fetchAvailableLeads = async (token: string, user: any) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}}/api/leads/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📦 Leads returned from /api/leads/available:', res.data);

      if (!Array.isArray(res.data) || res.data.length === 0) {
        // No toast, just show empty state in UI
        setLeads([]);
      } else {
        setLeads(res.data);
      }
    } catch (error: any) {
      console.error('❌ Error fetching leads:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      showToast(error.response?.data?.message || 'Failed to load leads. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      console.log('🟢 Running init()');
      const storedToken = await AsyncStorage.getItem('token');
      console.log('🔐 Token:', storedToken);
      if (!storedToken) return;

      setToken(storedToken);
      const userLoaded = await fetchUserProfile(storedToken);
      console.log('👤 fetchUserProfile result:', userLoaded);

      if (userLoaded) {
        console.log('✅ Calling fetchAvailableLeads with:', userLoaded);
        fetchAvailableLeads(storedToken, userLoaded);
      } else {
        console.warn('⛔ No user profile returned');
      }
    };

    init();
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ Loaded user profile:', response.data);
      setUser(response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error?.response?.data || error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load user profile',
        text2: error.message || 'Please try again later.',
        position: 'top',
      });
      return false;
    }
  };

  const onPurchaseLead = async (lead: Lead) => {
    if (!token || !user) {
      showToast('Please log in to purchase leads.', 'error');
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}}/api/stripe/create-checkout-session`,
        {
          lead_id: lead.id,
          provider_id: user.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const { url } = res.data;
      if (!url) {
        console.error('❌ No Stripe checkout URL returned');
        showToast('Failed to initiate payment.', 'error');
        return;
      }

      console.log('✅ Opening Stripe checkout URL:', url);
      const result = await WebBrowser.openBrowserAsync(url, {
        dismissButtonStyle: 'cancel',
        toolbarColor: '#007bff',
        enableDefaultShareMenuItem: false,
      });

      console.log('🌐 WebBrowser result:', result);

      await fetchAvailableLeads(token, user);
      const availableResponse = await axios.get(`${API_BASE_URL}}/api/leads/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(Array.isArray(availableResponse.data) ? availableResponse.data : []);

      let isPurchased = false;
      const startTime = Date.now();
      const timeout = 30000; // 30 seconds
      while (Date.now() - startTime < timeout) {
        const purchaseCheck = await axios.get(`${API_BASE_URL}}/my-purchased-leads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        isPurchased = purchaseCheck.data.some(p => p.lead_id === lead.id);
        console.log(`🔍 Purchase check for lead ${lead.id} at ${new Date().toISOString()}:`, { isPurchased });
        if (isPurchased) break;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (isPurchased) {
        showToast('Purchase completed. Redirecting to Home.');
      } else {
        console.warn(`⚠️ Lead ${lead.id} not found in purchased leads after timeout`);
        showToast('Purchase may have failed. Check your Stripe Dashboard or contact support if not recorded soon.', 'error');
      }
      router.replace('/');
    } catch (err: any) {
      console.error('❌ Stripe purchase error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || 'Failed to process payment. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (lead: Lead) => {
    onPurchaseLead(lead);
  };

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: '#f5f5f5',
      flex: 1,
    },
    card: {
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 10,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    detail: {
      fontSize: 14,
      marginBottom: 4,
    },
    purchaseButton: {
      backgroundColor: '#007bff',
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 10,
    },
    purchaseButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      marginBottom: 16,
    },
  });

  const maskName = (name?: string) => {
    if (!name) return '';
    return 'REDACTED';
  };

  const maskEmail = (email?: string) => {
    if (!email) return '';
    return 'REDACTED';
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return '';
    return 'REDACTED';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => router.push('/')} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={28} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.header}>🔥 Available Leads</Text>
      </View>
      <Text style={styles.subtitle}>Leads ready for purchase</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : leads.length === 0 ? (
        <Text>No available leads found.</Text>
      ) : (
        leads.map((lead: Lead) => {
          const alreadyPurchasedByRole = lead.purchased_by?.some(
            (p) => p.job_title?.toLowerCase() === user?.job_title?.toLowerCase()
          );
          return (
            <View key={lead.id} style={styles.card}>
              <Text style={styles.title}>{maskName(lead.lead_name)}</Text>
              <Text style={styles.detail}>📧 {maskEmail(lead.lead_email)}</Text>
              <Text style={styles.detail}>📞 {maskPhone(lead.lead_phone)}</Text>
              <Text style={styles.detail}>📍 {lead.state}, {lead.county}</Text>
              <Text style={styles.detail}>👤 Affiliate: {lead.affiliate_name}</Text>
              <Text style={styles.detail}>
                💲 Lead Cost: $
                {typeof lead.provider_price === 'number' && !isNaN(lead.provider_price)
                  ? lead.provider_price.toFixed(2)
                  : 'N/A'}
              </Text>
              <Text style={styles.detail}>
                📦 Status: {lead.status || 'Pending'}
              </Text>
              <Text style={styles.detail}>📡 Distribution: {lead.distribution_method}</Text>
              <TouchableOpacity
                disabled={alreadyPurchasedByRole}
                style={{
                  backgroundColor: alreadyPurchasedByRole ? 'gray' : '#007bff',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 10,
                }}
                onPress={() => handlePurchase(lead)}
              >
                <Text style={{ color: 'white', textAlign: 'center' }}>
                  {alreadyPurchasedByRole ? 'Already Purchased' : 'Purchase Lead'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
      <Toast />
    </ScrollView>
  );
};

export default AvailableLeadsScreen;