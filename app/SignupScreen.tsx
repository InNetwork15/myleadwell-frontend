import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, StyleSheet, ScrollView
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { STATE_ABBREVIATIONS, ABBREVIATION_TO_STATE } from '../utils/stateAbbreviations';
import jwtDecode from 'jwt-decode';
import { getCurrentUser } from '../utils/auth'; // or correct path
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/config'; // ✅ Import shared config
import Toast from 'react-native-toast-message'; // ✅ Import Toast
import { useNavigation, NavigationProp, CommonActions } from '@react-navigation/native'; // ✅ Update import
import { useRouter } from 'expo-router'; // ✅ Import useRouter

// Define RootStackParamList if not already defined elsewhere
type RootStackParamList = {
  Signup: undefined;
  Login: undefined; // Add other screens as needed
};

export default function SignupScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const router = useRouter(); // ✅ Initialize router
  const navigateToLogin = () => {
    console.log("🔁 navigating to Login...");
    navigation.navigate('login');
  };
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [countiesByState, setCountiesByState] = useState<{ [key: string]: string[] }>({});
  const [counties, setCounties] = useState<string[]>([]);
  const [job_title, setJobTitle] = useState('');
  const [customRef, setCustomRef] = useState(''); // ✅ Add state for custom referral link

  useEffect(() => {
    interface RecordFields {
      ste_name?: string;
      coty_name_long?: string;
    }

    interface Record {
      fields?: RecordFields;
    }

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

        const records: Record[] = res.data?.records || [];
        const byState: { [key: string]: string[] } = {};

        records.forEach((record: Record) => {
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
          byState[state] = byState[state].sort();
        });

        setCountiesByState(byState);
        setStates(Object.keys(byState).sort());
      } catch (error) {
        console.error('❌ Failed to fetch counties', error);
      }
    };

    fetchCounties();
  }, []);

  const handleSignup = async () => {
    if (roles.includes('Provider') && !job_title) {
      Toast.show({
        type: 'error',
        text1: 'Missing Job Title',
        text2: 'Please select a job title to continue.',
      });
      return;
    }
  
    try {
      const payload = {
        first_name,
        last_name,
        email,
        phone,
        password,
        roles: roles.map((r) => (r === 'Provider' ? 'provider' : 'affiliate')),
        job_title: roles.includes('Provider') ? job_title : '',
        state: selectedState,
        service_areas: counties.map((county) => ({ state: selectedState, county })),
        affiliate_link: customRef,
      };
  
      console.log('📦 Payload to submit:', JSON.stringify(payload, null, 2));
  
      const response = await axios.post(`${BASE_URL}/signup`, payload);
  
      console.log('✅ Signup response:', response.data);
  
      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: '✅ Account Created',
          text2: 'Check your email to verify your account.',
        });

        // ✅ Replace navigation with router.replace
        setTimeout(() => {
          console.log("🔁 navigating to email verification...");
          router.replace({
            pathname: '/EmailVerification',
            params: { email },
          });
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Signup Failed',
          text2: response.data.message || 'Unknown error occurred',
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || error.response?.data?.error || error.message;
        console.error('❌ Axios error:', message);
        Toast.show({
          type: 'error',
          text1: 'Signup Error',
          text2: message,
        });
      } else {
        console.error('❌ Unexpected error:', error);
        Toast.show({
          type: 'error',
          text1: 'Signup Error',
          text2: 'Failed to register. Try again.',
        });
      }
    }
  };
  
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
        {['Provider', 'Affiliate Marketer'].map((r) => {
          const selected = roles.includes(r);
          return (
            <TouchableOpacity
              key={r}
              style={[styles.roleButton, { backgroundColor: selected ? '#007bff' : '#ccc' }]}
              onPress={() => {
                setRoles((prev) =>
                  selected ? prev.filter(role => role !== r) : [...prev, r]
                );
              }}
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
              onValueChange={(val) => setJobTitle(val)}
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

          <Text style={styles.label}>State</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedState}
              onValueChange={(val) => {
                setSelectedState(val);
                setCounties([]); // reset counties when state changes
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select a state" value="" />
              {states.map((state) => (
                <Picker.Item key={state} label={ABBREVIATION_TO_STATE[state] || state} value={state} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Service Area Counties</Text>
          {countiesByState[selectedState]?.map((county) => {
            const isSelected = counties.includes(county);
            return (
              <TouchableOpacity
                key={county}
                style={[styles.countyItem, { backgroundColor: isSelected ? '#28a745' : '#eee' }]}
                onPress={() => {
                  setCounties((prev) =>
                    isSelected ? prev.filter(c => c !== county) : [...prev, county]
                  );
                }}
              >
                <Text style={{ color: isSelected ? '#fff' : '#000' }}>{county}</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {roles.includes('Affiliate Marketer') && ( // ✅ Add input field for custom referral link
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

      <Toast /> {/* ✅ Add this line to include the Toast component */}
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
  countyItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
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
