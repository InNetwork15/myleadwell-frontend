import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, Pressable,
    ScrollView, ToastAndroid, Platform, TouchableOpacity,
    Button, Alert, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { STATE_ABBREVIATIONS, ABBREVIATION_TO_STATE } from '../utils/stateAbbreviations';
import * as Linking from 'expo-linking'; // Keep only one Linking import
import { API_BASE_URL} from '../config';

const retry = async (fn: () => Promise<any>, retries: number = 3, delay: number = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

const AccountScreen = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [customRef, setCustomRef] = useState('');
    const [userId, setUserId] = useState('');
    const [availableStates, setAvailableStates] = useState<string[]>([]);
    const [countiesByState, setCountiesByState] = useState<Record<string, string[]>>({});
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [serviceAreas, setServiceAreas] = useState<{ state: string; county: string }[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isStripeConnected, setStripeConnected] = useState(false);
    const [stripeStatus, setStripeStatus] = useState<'not_connected' | 'pending' | 'connected'>('not_connected');
    const [loading, setLoading] = useState(true);
    const [selectedCounty, setSelectedCounty] = useState('');
    const [polling, setPolling] = useState(false);
    const router = useRouter();

    const fetchProfile = async () => {
const token = await AsyncStorage.getItem('token');

        console.log('🔑 JWT Token:', token); // Add this line
        if (!token || token === 'null' || token === 'undefined') {
            console.warn('⛔ Skipping API call — no token loaded');
            setLoading(false);
            router.push('/login');
            return;
        }

        try {
            const res = await axios.get(`${API_BASE_URL}/account`, {
  headers: { Authorization: `Bearer ${token}` },
});

            const userData = res.data;
            console.log("🔍 Fetched user profile:", userData);

            if (userData) {
                setUser(userData);
                setFirstName(userData.first_name || '');
                setLastName(userData.last_name || '');
                setEmail(userData.email || '');
                setPhone(userData.phone || '');
                setJobTitle(userData.job_title || '');
                setCustomRef(userData.affiliate_link || '');
                setSelectedStates(userData.states || []);
                setServiceAreas(userData.service_areas || []);
                setStripeConnected(!!userData.stripe_account_id);
                setStripeStatus(userData.stripe_onboarding_status || 'not_connected');
                setUserId(userData.id || '');
            }
        } catch (err) {
            console.error('❌ Failed to load profile:', err);
            Toast.show({ type: 'error', text1: 'Failed to load account profile' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        const fetchCounties = async () => {
            try {
                const res = await axios.get(
                    'https://public.opendatasoft.com/api/records/1.0/search/',
                    {
                        params: {
                            dataset: 'georef-united-states-of-america-county',
                            q: '',
                            rows: 10000,
                        },
                    }
                );

                const records = res.data?.records || [];
                const byState: Record<string, string[]> = {};

                records.forEach((record: { fields?: { ste_name?: string; coty_name_long?: string } }) => {
                    const fullState = record.fields?.ste_name?.trim();
                    const state = fullState ? STATE_ABBREVIATIONS[fullState] : undefined;
                    const county = record.fields?.coty_name_long?.trim();

                    if (!state || !county) return;

                    if (!byState[state]) {
                        byState[state] = [];
                    }

                    if (!byState[state].includes(county)) {
                        byState[state].push(county);
                    }
                });

                Object.keys(byState).forEach((state) => {
                    byState[state] = byState[state].sort((a, b) => a.localeCompare(b));
                });

                setCountiesByState(byState);
                setAvailableStates(Object.keys(byState).sort());
            } catch (err) {
                console.error("❌ County fetch failed", err);
            }
        };

        fetchCounties();
    }, []);

    const handleSave = async () => {
        const token = await AsyncStorage.getItem('token');
        try {
            const payload = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                job_title: jobTitle,
                states: selectedStates,
                service_areas: serviceAreas,
                affiliate_link: customRef,
            };

            console.log('📤 Saving Account:', payload);

            await axios.put(`${API_BASE_URL}/account`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            Toast.show({ type: 'success', text1: '✅ Profile saved successfully!' });
        } catch (err) {
            console.error('❌ Error saving profile:', err.response?.data || err.message);
            Toast.show({ type: 'error', text1: 'Failed to save profile.' });
        }
    };

    const handleCopyLink = async () => {
        const refLink = `https://MyLeadWell.com/submit-lead?ref=${encodeURIComponent(customRef || userId)}`;
        try {
            await Clipboard.setStringAsync(refLink);
            console.log('📋 Copied link:', refLink);
            Toast.show({
                type: 'success',
                text1: 'Link copied to clipboard!',
            });
        } catch (error) {
            console.error('❌ Failed to copy:', error);
            Toast.show({ type: 'error', text1: 'Failed to copy link.' });
        }
    };

    const startPolling = () => {
        setPolling(true);
        const interval = setInterval(async () => {
            await fetchProfile();
            if (stripeStatus === 'connected') {
                setPolling(false);
                clearInterval(interval);
                Toast.show({ type: 'success', text1: 'Stripe account connected!' });
            }
        }, 5000); // Poll every 5 seconds

        // Stop polling after 2 minutes if no update
        setTimeout(() => {
            setPolling(false);
            clearInterval(interval);
            Toast.show({ type: 'info', text1: 'Stripe status check timed out. Please refresh manually.' });
        }, 120000);
    };

    const handleStripeConnect = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Toast.show({ type: 'error', text1: 'No authentication token found' });
                router.push('/login');
                return;
            }

            setLoading(true);
            const response = await axios.post(
                `${API_BASE_URL}/api/stripe/create-account-link`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("🔗 Stripe response:", response.data);

            setLoading(false);

            if (response.data.status === 'connected') {
                setStripeStatus('connected');
                setStripeConnected(true);
                Toast.show({ type: 'success', text1: 'Stripe account is fully connected!' });
                return;
            }

            if (response.data.url) {
                await Linking.openURL(response.data.url);
                setStripeStatus('pending');
                Toast.show({ type: 'success', text1: 'Redirecting to Stripe onboarding' });
                startPolling();
            } else {
                console.error('No Stripe onboarding URL returned:', response.data);
                Toast.show({ type: 'error', text1: 'No Stripe onboarding URL provided' });
            }
        } catch (err) {
            setLoading(false);
            console.error("❌ Stripe connect error:", err.response?.data || err.message);
            Toast.show({ type: "error", text1: "Failed to connect to Stripe" });
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            router.push('/login');
            Toast.show({ type: 'success', text1: 'Logged out successfully' });
        } catch (error) {
            console.error('❌ Error during logout:', error);
            Toast.show({ type: 'error', text1: 'Failed to log out' });
        }
    };

    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            const { path } = Linking.parse(event.url);
            console.log('🔗 Deep link received:', event.url, path);
            if (path === 'account') {
                await fetchProfile();
            }
        };

        // Add listener for deep links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if the app was opened with a deep link
        Linking.getInitialURL().then((url) => {
            if (url) {
                const { path } = Linking.parse(url);
                if (path === 'account') {
                    fetchProfile();
                }
            }
        });

        // Cleanup listener on unmount
        return () => {
            subscription.remove();
        };
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const referralLink = `https://MyLeadWell.com/submit-lead?ref=${encodeURIComponent(customRef || userId)}`;

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
            <Text style={styles.header}>👤 My Account</Text>

            {/* Customize Affiliate Link at the top, inline */}
<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 8 }}>
  <Text style={styles.label}>Customize Your Link:</Text>
  <TextInput
    style={[styles.input, { flex: 1, marginLeft: 8, marginTop: 0 }]}
    value={customRef}
    onChangeText={setCustomRef}
    placeholder="Enter your unique link"
    autoCapitalize="none"
  />
</View>

{/* Unique Referral Link */}
<Text style={styles.previewLabel}>Your Unique Link:</Text>
<Text selectable style={styles.link}>{referralLink}</Text>
<Pressable style={styles.button} onPress={handleCopyLink}>
  <Text style={styles.buttonText}>📋 Copy Link</Text>
</Pressable>

{/* Stripe Integration Section - moved here, and removed Refresh Stripe Status button */}
<View style={{ marginTop: 40 }}>
  <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Stripe Integration</Text>
  <Text style={{ marginBottom: 10 }}>
    {stripeStatus === 'connected'
      ? '✅ Stripe account connected and ready for payouts'
      : stripeStatus === 'pending'
      ? '⚠️ Stripe account created but onboarding incomplete. Complete setup to receive payouts.'
      : '🔌 Not connected to Stripe. Connect to receive payouts for leads.'}
  </Text>
  <Button
    title={
      stripeStatus === 'connected'
        ? 'Manage Stripe Account'
        : stripeStatus === 'pending'
        ? 'Complete Stripe Setup'
        : 'Connect with Stripe'
    }
    onPress={handleStripeConnect}
    color="#28a745"
    disabled={loading}
  />
</View>

            {/* First Name */}
            <Text style={styles.label}>First Name:</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

            {/* Last Name */}
            <Text style={styles.label}>Last Name:</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

            {/* Email */}
            <Text style={styles.label}>Email:</Text>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            {/* Phone */}
            <Text style={styles.label}>Phone:</Text>
            <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
            />

            {/* Job Title */}
            <Text style={styles.label}>Job Title:</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={jobTitle}
                    onValueChange={(itemValue) => setJobTitle(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select Job Title" value="" />
                    <Picker.Item label="Real Estate Agent" value="Real Estate Agent" />
                    <Picker.Item label="Loan Originator" value="Loan Originator" />
                    <Picker.Item label="Title Agent" value="Title Agent" />
                    <Picker.Item label="Insurance Agent" value="Insurance Agent" />
                    <Picker.Item label="Home Inspector" value="Home Inspector" />
                </Picker>
            </View>

            {/* State Selection */}
            <Text style={styles.label}>States</Text>
<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
  {availableStates.map((state) => {
    const isSelected = selectedStates.includes(state);
    return (
      <TouchableOpacity
        key={state}
        onPress={() => {
          if (isSelected) {
            setSelectedStates(selectedStates.filter((s) => s !== state).sort());
            setServiceAreas(serviceAreas.filter((area) => area.state !== state));
          } else {
            setSelectedStates([...new Set([...selectedStates, state])].sort());
          }
        }}
        style={{
          backgroundColor: isSelected ? '#007bff' : '#eee',
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 6,
          margin: 4,
        }}
      >
        <Text style={{ color: isSelected ? '#fff' : '#000' }}>
          {ABBREVIATION_TO_STATE[state] || state}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>

            {/* County Selection with Dropdown */}
            <Text style={styles.label}>Service Areas (Counties)</Text>
            {selectedStates.length > 0 ? (
  selectedStates.map((state) => (
    <View key={state}>
  <Text style={styles.label}>{ABBREVIATION_TO_STATE[state] || state} Counties</Text>

  <TouchableOpacity
    onPress={() => {
      if (!selectedStates.includes(state)) {
        setSelectedStates([...new Set([...selectedStates, state])].sort());
      }
      const all = countiesByState[state] || [];
      const newAreas = all
        .filter(c => !serviceAreas.some(a => a.county === c && a.state === state))
        .map(c => ({ state, county: c }));
      const updated = [...serviceAreas, ...newAreas];
      setServiceAreas(updated);
      // Toast.show({ text1: "Don't forget to hit Save!" }); // Optional reminder
    }}
  >
    <Text style={{ color: 'green', fontWeight: 'bold', marginBottom: 6 }}>
      🗺️ Add All Counties in {ABBREVIATION_TO_STATE[state] || state}
    </Text>
  </TouchableOpacity>

  <View style={styles.pickerWrapper}>

        <Picker
          selectedValue=""
          onValueChange={(itemValue) => {
            if (
              itemValue &&
              !serviceAreas.some((area) => area.county === itemValue && area.state === state)
            ) {
              setServiceAreas([...serviceAreas, { state, county: itemValue }]);
              // Toast.show({ text1: "Don't forget to hit Save!" }); // Optional reminder
            }
          }}
          style={styles.picker}
        >
          <Picker.Item label="Select a County" value="" />
          {countiesByState[state]?.map((county) => (
            <Picker.Item key={county} label={county} value={county} />
          ))}
        </Picker>
      </View>
    </View>
  ))
) : (
  <Text style={{ color: '#666', marginTop: 5 }}>Please select at least one state</Text>
)}

            {/* Display Selected Service Areas */}
            <Text style={styles.label}>Selected Service Areas:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {serviceAreas
                    // Show all selected service areas, grouped visually
                    .slice()
                    .sort((a, b) =>
                      a.state === b.state
                        ? a.county.localeCompare(b.county)
                        : a.state.localeCompare(b.state)
                    )
                    .map((area, index) => (
                        <View
                            key={`${area.state}-${area.county}-${index}`}
                            style={{
                                backgroundColor: '#ddd',
                                borderRadius: 20,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                margin: 4,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Text>{area.county}</Text>
                            <TouchableOpacity
                                onPress={() =>
                                    setServiceAreas(
                                        serviceAreas.filter(
                                            (a) => !(a.county === area.county && a.state === area.state)
                                        )
                                    )
                                }
                            >
                                <Text style={{ marginLeft: 8, color: 'red' }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
            </View>

            {/* Logout Button */}
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>🚪 Logout</Text>
            </Pressable>
            {/* Save Profile Button */}
            <Pressable style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>💾 Save Profile</Text>
            </Pressable>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff' },
    header: { fontSize: 26, fontWeight: 'bold', marginVertical: 10 },
    label: { fontWeight: 'bold', marginTop: 10 },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 8,
        marginTop: 4,
        borderRadius: 5,
        backgroundColor: '#fff'
    },
    pickerWrapper: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginTop: 4,
        marginBottom: 10,
    },
    picker: { height: 48, width: '100%' },
    button: {
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10, },
    logoutButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginTop: 30,
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    previewLabel: { fontWeight: 'bold', marginTop: 20 },
    link: { color: 'blue', marginBottom: 8 },
});

export default AccountScreen;