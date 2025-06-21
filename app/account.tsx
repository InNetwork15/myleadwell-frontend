// --- Full Updated Account Screen with Multi-State & County Select ---

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import MultiSelect from 'react-native-multiple-select';
import { Picker } from '@react-native-picker/picker';
import { STATE_ABBREVIATIONS, ABBREVIATION_TO_STATE } from '../utils/stateAbbreviations';

const US_STATES = Object.entries(ABBREVIATION_TO_STATE).map(([value, label]) => ({ label, value }));

const COUNTIES_BY_STATE = {
  MI: ['Wayne County', 'Washtenaw County', 'Macomb County', 'Oakland County'],
  OH: ['Franklin County', 'Cuyahoga County', 'Hamilton County'],
  CA: ['Los Angeles County', 'San Diego County', 'San Francisco County'],
};

export default function AccountScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [user, setUser] = useState({});
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedCounties, setSelectedCounties] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [stripeStatus, setStripeStatus] = useState('not_connected');

  useEffect(() => {
    const load = async () => {
      const t = await AsyncStorage.getItem('token');
      setToken(t);
      await fetchAccount(t);
    };
    load();
  }, []);

  const fetchAccount = async (t) => {
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/account`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setUser(res.data);
      setJobTitle(res.data.job_title || '');
      setSelectedStates(res.data.states || []);
      setSelectedCounties(res.data.counties || []);
      setStripeStatus(res.data.stripe_onboarding_status || 'not_connected');
      setReferralLink(`${process.env.EXPO_PUBLIC_FRONTEND_BASE_URL}/SubmitLeadScreen?ref=${res.data.id}`);
    } catch (err) {
      console.error('Error loading account:', err);
      Toast.show({ type: 'error', text1: 'Failed to load account' });
    } finally {
      setLoading(false);
    }
  };

  const toggleAllCountiesInState = (stateCode) => {
    const counties = COUNTIES_BY_STATE[stateCode] || [];
    const currentlySelected = selectedCounties.filter(c => counties.includes(c));
    const allSelected = currentlySelected.length === counties.length;
    const updated = allSelected
      ? selectedCounties.filter(c => !counties.includes(c))
      : [...new Set([...selectedCounties, ...counties])];
    setSelectedCounties(updated);
  };

  const handleSave = async () => {
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/account`, {
        first_name: user.first_name,
        last_name: user.last_name,
        job_title: jobTitle,
        states: selectedStates,
        counties: selectedCounties,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Toast.show({ type: 'success', text1: 'Account updated successfully' });
    } catch (err) {
      console.error('Save failed:', err);
      Toast.show({ type: 'error', text1: 'Failed to update account' });
    }
  };

  const handleStripeConnect = async () => {
    try {
      const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/stripe/create-account-link`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (err) {
      console.error('Stripe connect error:', err.response?.data || err.message);
      Toast.show({ type: 'error', text1: 'Stripe connection failed' });
    }
  };

  const copyReferralLink = () => {
    Clipboard.setString(referralLink);
    Toast.show({ type: 'info', text1: 'Referral link copied!' });
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#000" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Email: {user.email}</Text>
      <TextInput style={styles.input} value={user.first_name} onChangeText={(text) => setUser({ ...user, first_name: text })} placeholder="First Name" />
      <TextInput style={styles.input} value={user.last_name} onChangeText={(text) => setUser({ ...user, last_name: text })} placeholder="Last Name" />

      <Text style={styles.label}>Job Title:</Text>
      <Picker selectedValue={jobTitle} onValueChange={setJobTitle} style={styles.picker}>
        <Picker.Item label="Select a role" value="" />
        <Picker.Item label="Realtor" value="Real Estate Agent" />
        <Picker.Item label="Loan Officer" value="Loan Officer" />
        <Picker.Item label="Insurance Agent" value="Insurance Agent" />
        <Picker.Item label="Home Inspector" value="Home Inspector" />
        <Picker.Item label="Title Insurance Agent" value="Title Insurance Agent" />
      </Picker>

      <Text style={styles.label}>States:</Text>
      <MultiSelect
        items={US_STATES}
        uniqueKey="value"
        onSelectedItemsChange={setSelectedStates}
        selectedItems={selectedStates}
        selectText="Pick States"
        searchInputPlaceholderText="Search States..."
      />

      {selectedStates.map((stateCode) => (
        <View key={stateCode} style={styles.countyBlock}>
          <Text>{ABBREVIATION_TO_STATE[stateCode]} Counties:</Text>
          <TouchableOpacity onPress={() => toggleAllCountiesInState(stateCode)}>
            <Text style={styles.selectAll}>Toggle All {stateCode} Counties</Text>
          </TouchableOpacity>
          <MultiSelect
            items={(COUNTIES_BY_STATE[stateCode] || []).map(c => ({ id: c, name: c }))}
            uniqueKey="id"
            onSelectedItemsChange={(items) => {
              const remaining = selectedCounties.filter(c => !COUNTIES_BY_STATE[stateCode].includes(c));
              setSelectedCounties([...remaining, ...items]);
            }}
            selectedItems={selectedCounties.filter(c => COUNTIES_BY_STATE[stateCode].includes(c))}
            selectText={`Select ${stateCode} Counties`}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      <Text style={styles.referral}>Your Affiliate Marketing Link:</Text>
      <Text selectable style={styles.linkText}>{referralLink}</Text>
      <TouchableOpacity onPress={copyReferralLink}><Text style={styles.copyButton}>Copy</Text></TouchableOpacity>

      <Text style={styles.label}>Stripe Integration:</Text>
      <Text>{stripeStatus === 'connected' ? '✅ Connected to Stripe' : '🔌 Not connected to Stripe. Connect to receive payouts for leads.'}</Text>
      {stripeStatus !== 'connected' && (
        <TouchableOpacity style={styles.stripeButton} onPress={handleStripeConnect}>
          <Text style={styles.stripeButtonText}>Connect with Stripe</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { borderWidth: 1, marginBottom: 10, padding: 8 },
  picker: { borderWidth: 1, marginBottom: 10 },
  label: { fontWeight: 'bold', marginTop: 10 },
  saveButton: { backgroundColor: '#007BFF', padding: 12, marginTop: 20 },
  saveButtonText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold' },
  stripeButton: { backgroundColor: '#28a745', padding: 12, marginTop: 10 },
  stripeButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  linkText: { marginVertical: 8, color: '#555' },
  copyButton: { color: 'blue', marginBottom: 20 },
  countyBlock: { marginVertical: 10 },
  selectAll: { color: 'blue', marginVertical: 4 },
  referral: { marginTop: 20, fontWeight: 'bold' },
});
