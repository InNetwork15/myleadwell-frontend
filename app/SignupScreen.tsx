import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { STATE_ABBREVIATIONS, ABBREVIATION_TO_STATE } from '../utils/stateAbbreviations';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://myleadwell-backend.onrender.com';

export default function SignupScreen() {
    const router = useRouter();
    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [roles, setRoles] = useState<string[]>([]);
    const [job_title, setJobTitle] = useState('');
    const [customRef, setCustomRef] = useState('');

    const [availableStates, setAvailableStates] = useState<string[]>([]);
    const [countiesByState, setCountiesByState] = useState<{ [key: string]: string[] }>({});
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [serviceAreas, setServiceAreas] = useState<{ state: string; county: string }[]>([]);
    const [loadingCounties, setLoadingCounties] = useState(true);

    useEffect(() => {
        const fetchCounties = async () => {
            setLoadingCounties(true);
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
                    if (!byState[state]) byState[state] = [];
                    if (!byState[state].includes(county)) byState[state].push(county);
                });

                Object.keys(byState).forEach((state) => {
                    byState[state] = byState[state].sort((a, b) => a.localeCompare(b));
                });
                setCountiesByState(byState);
                setAvailableStates(Object.keys(byState).sort());
            } catch (err) {
                console.error("❌ County fetch failed", err);
                Toast.show({ type: 'error', text1: 'Failed to load county list' });
            } finally {
                setLoadingCounties(false);
            }
        };
        fetchCounties();
    }, []);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.toLowerCase());
    };

    const handleSignup = async () => {
        // ✅ Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        if (!validateEmail(normalizedEmail)) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Email',
                text2: 'Please enter a valid email address.',
            });
            return;
        }

        if (roles.includes('Provider')) {
            if (!job_title) {
                Toast.show({ type: 'error', text1: 'Missing Job Title', text2: 'Please select a job title.' });
                return;
            }
            if (selectedStates.length === 0) {
                Toast.show({ type: 'error', text1: 'Missing State', text2: 'Select at least one state.' });
                return;
            }
            if (serviceAreas.length === 0) {
                Toast.show({ type: 'error', text1: 'Missing Service Area', text2: 'Select at least one county.' });
                return;
            }
        }

        try {
            // ✅ Clean payload structure
            const payload = {
                email: normalizedEmail,
                password,
                first_name,
                last_name,
                phone,
                roles: roles.map((r) => r.toLowerCase()),
                job_title: roles.includes('Provider') ? job_title : '',
                states: selectedStates,
                service_areas: serviceAreas,
                affiliate_link: customRef.trim() || null,
            };

            console.log('📦 Payload to submit:', payload);

            const response = await axios.post(`${API_BASE_URL}/signup`, payload);
            
            if (response.data?.success) {
                Toast.show({
                    type: 'success',
                    text1: '✅ Account Created',
                    text2: 'Check your email to verify your account.',
                });
                setTimeout(() => {
                    router.replace({ pathname: '/EmailVerification', params: { email: normalizedEmail } });
                }, 1500);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Signup Failed',
                    text2: response.data.message || 'Unknown error occurred',
                });
            }
        } catch (error: any) {
            let errorMessage = error.response?.data?.message || error.message || 'Failed to register. Try again.';
            Toast.show({ type: 'error', text1: 'Signup Error', text2: errorMessage });
        }
    };

    const navigateToLogin = () => router.push('/login');

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create Account</Text>
            <TextInput style={styles.input} placeholder="First Name" value={first_name} onChangeText={setFirstName} />
            <TextInput style={styles.input} placeholder="Last Name" value={last_name} onChangeText={setLastName} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

            <Text style={styles.label}>Select Your Roles</Text>
            <View style={styles.roleButtons}>
                {['Provider', 'Affiliate'].map((r) => {
                    const selected = roles.includes(r);
                    return (
                        <TouchableOpacity
                            key={r}
                            style={[styles.roleButton, { backgroundColor: selected ? '#007bff' : '#ccc' }]}
                            onPress={() => setRoles(selected ? roles.filter(role => role !== r) : [...roles, r])}
                        >
                            <Text style={{ color: '#fff' }}>{r}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {roles.includes('Provider') && (
                <>
                    <Text style={styles.label}>Job Title</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={job_title}
                            onValueChange={setJobTitle}
                            style={styles.picker}
                        >
                            <Picker.Item label="Select a job title" value="" />
                            <Picker.Item label="Real Estate Agent" value="Real Estate Agent" />
                            <Picker.Item label="Loan Originator" value="Loan Originator" />
                            <Picker.Item label="Title Agent" value="Title Agent" />
                            <Picker.Item label="Insurance Agent" value="Insurance Agent" />
                            <Picker.Item label="Home Inspector" value="Home Inspector" />
                        </Picker>
                    </View>

                    <Text style={styles.label}>States</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {availableStates.map((state) => {
                            const isSelected = selectedStates.includes(state);
                            return (
                                <TouchableOpacity
                                    key={state}
                                    onPress={() => {
                                        if (isSelected) {
                                            setSelectedStates(selectedStates.filter(s => s !== state).sort());
                                            setServiceAreas(serviceAreas.filter(area => area.state !== state));
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
                                    <Text style={{ color: isSelected ? '#fff' : '#000' }}>{ABBREVIATION_TO_STATE[state] || state}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* County Selection */}
                    <Text style={styles.label}>Service Areas (Counties)</Text>
                    {loadingCounties ? (
                        <ActivityIndicator />
                    ) : selectedStates.length > 0 ? (
                        selectedStates.map((state) => (
                            <View key={state}>
                                <Text style={styles.label}>{ABBREVIATION_TO_STATE[state] || state} Counties</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        const all = countiesByState[state] || [];
                                        const newAreas = all.filter(c => !serviceAreas.some(a => a.county === c && a.state === state))
                                            .map(c => ({ state, county: c }));
                                        setServiceAreas([...serviceAreas, ...newAreas]);
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
                                            if (itemValue && !serviceAreas.some(area => area.county === itemValue && area.state === state)) {
                                                setServiceAreas([...serviceAreas, { state, county: itemValue }]);
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

                    <Text style={styles.label}>Selected Service Areas:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {serviceAreas
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
                                        onPress={() => setServiceAreas(serviceAreas.filter(a => !(a.county === area.county && a.state === area.state)))}
                                    >
                                        <Text style={{ marginLeft: 8, color: 'red' }}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                    </View>
                </>
            )}

            {roles.includes('Affiliate') && (
                <>
                    <Text style={styles.label}>Customize Your Affiliate Link</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter custom referral link (e.g. johndoe123)"
                        value={customRef}
                        onChangeText={setCustomRef}
                    />
                </>
            )}

            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
                <Text style={styles.signupText}>SIGN UP</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={navigateToLogin}>
                <Text style={styles.loginText}>Already have an account? Login</Text>
            </TouchableOpacity>

            <Toast />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#f8f9fa' },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    label: { fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
    input: {
        backgroundColor: '#fff',
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        fontSize: 16,
    },
    roleButtons: { flexDirection: 'row', marginBottom: 16 },
    roleButton: {
        padding: 10,
        marginRight: 10,
        borderRadius: 8,
    },
    pickerWrapper: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    picker: { height: 48, width: '100%' },
    signupButton: {
        backgroundColor: '#28a745',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 16,
    },
    signupText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loginLink: {
        alignItems: 'center',
    },
    loginText: {
        color: '#007bff',
        fontSize: 15,
        fontWeight: '500',
    },
});

