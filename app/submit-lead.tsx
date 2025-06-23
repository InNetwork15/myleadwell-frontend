import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Linking,
    Pressable,
    Alert,
} from 'react-native';
import axios from 'axios';
import Toast from "react-native-toast-message";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FRONTEND_BASE_URL } from '../config';
import { useRouter, useLocalSearchParams } from 'expo-router'; // already present
import { Picker } from '@react-native-picker/picker';
import CheckBox from "expo-checkbox";
import { STATE_ABBREVIATIONS, ABBREVIATION_TO_STATE } from '../utils/stateAbbreviations';

const refBaseUrl = FRONTEND_BASE_URL; // Use FRONTEND_BASE_URL from config
const API_URL = process.env.EXPO_PUBLIC_API_URL;


export default function SubmitLeadScreen() {
    console.log("✅ SubmitLeadScreen mounted");
    const router = useRouter();
    const { ref } = useLocalSearchParams(); // Correctly extract the ref

    console.log('🔎 Ref param from URL:', ref);

    const [submittedByRef, setSubmittedByRef] = useState<string | null>(null);

    useEffect(() => {
        if (ref) {
            console.log("Affiliate ref:", ref); // Log the referral code
            const fullLink = `${FRONTEND_BASE_URL}/submit-lead?ref=${encodeURIComponent(ref as string)}`;
            console.log("Affiliate Ref Link:", fullLink); // Log the full referral link
            setSubmittedByRef(fullLink); // Update the referral link
        } else {
            console.warn("Referral ID is missing.");
        }
    }, [ref]);

    useEffect(() => {
        const fetchCounties = async () => {
            console.log("📡 Fetching counties...");

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
                console.log("✅ Records received:", records.length);

                const byState: Record<string, string[]> = {};
                let validCount = 0;

                records.forEach((record: { fields: { ste_name?: string; coty_name_long?: string } }) => {
                    const fullState = record.fields?.ste_name?.trim();
                    const state = fullState ? STATE_ABBREVIATIONS[fullState] : undefined; // converts to "MI", "CA", etc.
                    const county = record.fields?.coty_name_long?.trim();

                    if (!state || !county) return;

                    if (!byState[state]) {
                        byState[state] = [];
                    }

                    if (!byState[state].includes(county)) {
                        byState[state].push(county);
                        validCount++;
                    }
                });

                Object.keys(byState).forEach((state) => {
                    byState[state] = byState[state].sort((a, b) => a.localeCompare(b));
                });

                const stateList = Object.keys(byState).sort();

                if (stateList.length > 0) {
                    setStates(stateList);
                    setCountiesByState(byState);
                    console.log("✅ States loaded:", stateList.slice(0, 5));
                } else {
                    throw new Error("Parsed state list is empty");
                }
            } catch (error) {
                console.error("❌ Failed to fetch counties. Using fallback.");

                // Fallback hardcoded states
                const fallback = {
                    Michigan: ['Wayne County', 'Oakland County'],
                    California: ['Los Angeles County', 'Orange County'],
                };
                setStates(Object.keys(fallback));
                setCountiesByState(fallback);
            }
        };

        fetchCounties();
    }, []);

    // State variables
    const [lead_name, setName] = useState('');
    const [lead_email, setEmail] = useState('');
    const [lead_phone, setPhone] = useState('');
    const [preferredProviders, setPreferredProviders] = useState<string[]>([]);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [joinNetwork, setJoinNetwork] = useState(false);
    const [states, setStates] = useState<string[]>([]);
    const [countiesByState, setCountiesByState] = useState<Record<string, string[]>>({});
    const [selectedState, setSelectedState] = useState('');
    const [selectedCounty, setSelectedCounty] = useState('');
    const [affiliateName, setAffiliateName] = useState("Affiliate Partner"); // Example affiliate name

    const MOCK_PROVIDERS = [
        { id: '1', name: 'Sarah Thompson', job_title: 'Mortgage Broker' },
        { id: '2', name: 'David Lee', job_title: 'Real Estate Agent' },
        { id: '3', name: 'Monica Smith', job_title: 'Insurance Agent' },
    ];

    // Fetch affiliate name based on ref
    useEffect(() => {
        const fetchAffiliateName = async () => {
            if (!ref) return;
            if (!API_URL) {
                console.error("API_URL is undefined. Check your .env or expo config.");
                setAffiliateName("Affiliate Partner");
                return;
            }
            try {
                const response = await axios.get(`${API_URL}/affiliate-name/${ref}`);
                const name = response.data?.name;
                if (name) {
                    setAffiliateName(name);
                } else {
                    setAffiliateName("Affiliate Partner"); // fallback
                }
            } catch (err) {
                console.error("Failed to fetch affiliate name", err);
                setAffiliateName("Affiliate Partner");
            }
        };

        fetchAffiliateName();
    }, [ref]);

const handleSubmit = async () => {
  console.log("🟢 Submit button pressed");
  const token = await AsyncStorage.getItem("token");

  console.log('📤 Attempting to submit lead:', {
    lead_name,
    lead_email,
    lead_phone,
    state: selectedState,
    county: selectedCounty,
    ref,
  });

  console.log('📤 Attempting to submit lead with payload:', {
    lead_name,
    lead_email,
    lead_phone,
    ref,
    state: selectedState,
    county: selectedCounty,
  });

  // Validation
  if (!lead_name || !lead_email || !lead_phone) {
    Toast.show({
      type: "error",
      text1: "Validation Error",
      text2: "Please fill in all required fields.",
    });
    return;
  }

  if (!agreedToTerms) {
    Toast.show({
      type: "error",
      text1: "Consent Required",
      text2: "You must agree to the terms and conditions.",
    });
    return;
  }

  const payload = {
    lead_name,
    lead_email,
    lead_phone,
    state: selectedState,
    county: selectedCounty,
    ref,
    agreed_to_terms: agreedToTerms,
    join_network: joinNetwork,
  };

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const res = await axios.post(`${API_URL}/submit-lead`, payload, { headers });

    console.log("✅ Lead submitted:", res.data);

    // Reset form fields
    setName("");
    setEmail("");
    setPhone("");
    setPreferredProviders([]);
    setAgreedToTerms(false);
    setJoinNetwork(false);
    setSelectedState("");
    setSelectedCounty("");

    Toast.show({
      type: "success",
      text1: "Info Submitted",
      text2: "Your lead was submitted successfully.",
    });

    setTimeout(() => {
      router.push("/HomeScreen");
    }, 2000);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("❌ Submission error:", error.response.data);
    } else {
      if (error instanceof Error) {
        console.error("❌ Submission error:", error.message);
      } else {
        console.error("❌ Submission error:", error);
      }
    }
    Toast.show({
      type: "error",
      text1: "Submission Error",
      text2: "Failed to submit lead. Please try again.",
    });
  }
};

    return (
        <>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.container}>
                    <Pressable onPress={() => router.push('/HomeScreen')}>
                        <Text style={{ color: 'blue', fontWeight: 'bold', fontSize: 16 }}>🏠 Home</Text>
                    </Pressable>
                    <Text style={styles.title}>Submit a New Lead</Text>
                    {ref && <Text>Affiliate: {ref}</Text>} {/* Display the ref in the UI */}
                    {/* Input Fields */}
                    <TextInput style={styles.input} placeholder="Name" value={lead_name} onChangeText={setName} />
                    <TextInput style={styles.input} placeholder="Email" value={lead_email} onChangeText={setEmail} />
                    <TextInput style={styles.input} placeholder="Phone" value={lead_phone} onChangeText={setPhone} />

                    {/* Preferred Providers */}
                    {preferredProviders.length > 0 && (
                        <View style={styles.providersContainer}>
                            <Text style={styles.providersTitle}>Select Preferred Providers:</Text>
                            {MOCK_PROVIDERS.map((provider) => {
                                const selected = preferredProviders.includes(provider.id);
                                return (
                                    <TouchableOpacity
                                        key={provider.id}
                                        onPress={() => {
                                            setPreferredProviders((prev) =>
                                                prev.includes(provider.id.toString())
                                                    ? prev.filter((id) => id !== provider.id.toString())
                                                    : [...prev, provider.id.toString()] // Ensure provider.id is a string
                                            );
                                        }}
                                        style={[
                                            styles.providerButton,
                                            { backgroundColor: selected ? '#007BFF' : '#e0e0e0' },
                                        ]}
                                    >
                                        <Text style={{ color: selected ? '#fff' : '#000', fontWeight: '500' }}>
                                            {provider.name} — {provider.job_title}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    {/* State Dropdown */}
                    <View style={{ marginVertical: 10 }}>
                        <Text>State</Text>
                        <Picker
                            selectedValue={selectedState}
                            onValueChange={(value) => {
                                setSelectedState(value);
                                setSelectedCounty(''); // reset county
                            }}
                        >
                            <Picker.Item label="Select State" value="" />
                            {states.map((state, idx) => (
                                <Picker.Item
                                    key={`${state}-${idx}`}
                                    label={state}
                                    value={state}
                                />
                            ))}
                        </Picker>
                    </View>

                    {/* County Dropdown */}
                    <View style={{ marginVertical: 10 }}>
                        <Text>County (Service Area)</Text>
                        <Picker
                            selectedValue={selectedCounty}
                            onValueChange={(value) => setSelectedCounty(value)}
                            enabled={selectedState !== ''}
                        >
                            <Picker.Item label="Select County" value="" />
                            {countiesByState[selectedState]?.map((county, idx) => (
                                <Picker.Item key={`${county}-${idx}`} label={county} value={county} />
                            ))}
                        </Picker> {/* ✅ This line was missing */}
                    </View>

                    {/* Terms & Consent */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                      <CheckBox
                        value={agreedToTerms}
                        onValueChange={setAgreedToTerms}
                      />
                      <Text style={{ marginLeft: 8 }}>
                        I agree to the{' '}
                        <Text
                          style={{ color: 'blue', textDecorationLine: 'underline' }}
                          onPress={() => router.push('/terms')}
                        >
                          terms & conditions
                        </Text>
                        {' '}and consent to share my info with THE NETWORK.
                      </Text>
                    </View>

                    {/* Join NETWORK */}
                    {affiliateName && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                        <CheckBox
                          value={joinNetwork}
                          onValueChange={setJoinNetwork}
                        />
                        <Text style={{ marginLeft: 8 }}>
                          I want {affiliateName}'s NETWORK to contact me.
                        </Text>
                      </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.buttonText}>Submit Lead</Text>
                    </TouchableOpacity>

                    {/* Terms and Privacy Links */}
                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
                        <TouchableOpacity onPress={() => router.push('/terms')}>
                            <Text style={{ color: 'blue', textDecorationLine: 'underline' }}>Terms & Conditions</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/privacy')}>
                            <Text style={{ color: 'blue', textDecorationLine: 'underline' }}>Privacy Policy</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <Toast /> {/* Add Toast component here */}
        </>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 60, backgroundColor: '#f9f9f9' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        fontSize: 16,
    },
    providersContainer: { width: '100%', marginTop: 20 },
    providersTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
    providerButton: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    submitButton: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
