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
    TextInput,
    Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { API_BASE_URL } from '../config'; // adjust path if needed

// Utility to load auth data from AsyncStorage
async function loadAuthData() {
const token = await AsyncStorage.getItem('token');

    const userString = await AsyncStorage.getItem('user');
    let user = null;
    try {
        user = userString ? JSON.parse(userString) : null;
    } catch (e) {
        user = null;
    }
    return { token, user };
}

const JOB_TITLES = ['Real Estate Agent', 'Loan Originator', 'Title Agent', 'Insurance Agent', 'Home Inspector'];

interface Provider {
    id: string | number;
    first_name: string;
    last_name: string;
    job_title: string;
}

interface Lead {
    id: number;
    lead_id: string;
    purchase_id?: string | number;
    lead_name: string;
    lead_email?: string;
    lead_phone?: string;
    state?: string; // <-- optional or remove if unused
    county?: string; // <-- optional or remove if unused
    service_areas?: { state: string; county: string }[]; // <-- ✅ Add this
    affiliate_name: string;
    purchased_by?: { job_title: string; first_name: string; last_name: string }[];
    role_enabled?: { [key: string]: boolean };
    distribution_method: 'JUMPBALL' | 'NETWORK' | string;
    distribution_method_by_role?: { [key: string]: string };
    preferred_provider_ids?: number[];
    status?: string;
    provider_price?: number;
    affiliate_prices_by_role?: { [key: string]: number };
    preferred_providers_by_role?: { [key: string]: string[] };
    notes_by_role?: { [key: string]: string };
    created_at?: string;
    last_updated?: string | null;
}


const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
        Toast.show({
            type,
            text1: type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notification',
            text2: message,
            position: 'top',
            visibilityTime: 5000,
        });
    }
};

export default function MyLeadsCreatedAccordion() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
    const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
    const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
    const [showRecent, setShowRecent] = useState(false);
    const [showAvailableRoles, setShowAvailableRoles] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [providersLoading, setProvidersLoading] = useState(true);
    const [jobTitle, setJobTitle] = useState('');
    const router = useRouter();

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const { token, user } = await loadAuthData();
            console.log('🔑 Loaded auth data:', { token, user });
            if (!token || !user || !user.id) {
                console.error('❌ Missing token or user', { token, user });
                showToast('Please log in to view your created leads.', 'error');
                router.push('/login');
                return;
            }
            console.log('👤 User ID:', user.id);
            const response = await axios.get(`${API_BASE_URL}/my-leads-created/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // ✅ Type check before mapping
            if (!Array.isArray(response.data)) {
                console.error('❌ Expected an array of leads but got:', response.data);
                showToast('Failed to load leads: unexpected response format.', 'error');
                setLeads([]);
                setLoading(false);
                return;
            }

           const leadsWithProperData: Lead[] = response.data.map((lead: any) => ({
    id: lead.id ?? lead.lead_id ?? '',
    lead_id: lead.lead_id,
    purchase_id: lead.purchase_id,
    lead_name: lead.lead_name || 'Unknown',

    // Optional: Keep these if still used anywhere
    state: lead.state_name || lead.state || 'N/A',
    county: lead.county_name || lead.county || 'N/A',

    // ✅ Add this for service_areas if the API returns it
    service_areas: lead.service_areas || [],

    affiliate_name: lead.affiliate_name || 'Unknown',
    distribution_method: lead.distribution_method || null,
    distribution_method_by_role:
        lead.distribution_method_by_role ||
        JOB_TITLES.reduce((acc, role) => ({ ...acc, [role]: 'JUMPBALL' }), {}),
    affiliate_prices_by_role:
        lead.affiliate_prices_by_role ||
        JOB_TITLES.reduce((acc, role) => ({ ...acc, [role]: 0 }), {}),
    preferred_providers_by_role:
        lead.preferred_providers_by_role ||
        JOB_TITLES.reduce((acc, role) => ({ ...acc, [role]: [] }), {}),
    role_enabled:
        lead.role_enabled ||
        JOB_TITLES.reduce((acc, role) => ({ ...acc, [role]: false }), {}),
    notes_by_role:
        lead.notes_by_role ||
        JOB_TITLES.reduce((acc, role) => ({ ...acc, [role]: '' }), {}),
    purchased_by: lead.purchased_by || [],
    created_at: lead.created_at || new Date().toISOString(),
    last_updated: lead.last_updated || null,
}));


            console.log('📦 Loaded leads with defaults:', leadsWithProperData);
            setLeads(leadsWithProperData);
        } catch (error: any) {
            if (error.response?.status === 401) {
                showToast('Unauthorized. Please log in again.', 'error');
                router.push('/login');
                return;
            }
            console.error('❌ Failed to fetch leads:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.error || 'Failed to load your created leads. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchProviders = async () => {
        try {
            const { token } = await loadAuthData();
            console.log('🔑 fetchProviders: token=', token);
            if (!token) {
                console.error('❌ No token found for providers request');
                showToast('Please log in to load providers.', 'error');
                router.push('/login');
                return;
            }
            const response = await axios.get(`${API_BASE_URL}/providers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProviders(response.data);
            console.log('✅ Providers loaded:', response.data);
        } catch (error: any) {
            console.error('❌ Failed to load providers:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });
            const errorMessage = error.response?.status === 401
                ? 'Unauthorized. Please log in again.'
                : 'Failed to load providers. Some functionality may be limited.';
            showToast(errorMessage, 'error');
            if (error.response?.status === 401) {
                router.push('/login');
            }
        } finally {
            setProvidersLoading(false);
        }
    };

    // Fetch the user's job title on mount
    useEffect(() => {
      const fetchUser = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await axios.get(`${API_BASE_URL}/my-profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setJobTitle(res.data.job_title); // 👈 set job title
        } catch (err) {
          console.error('Failed to load profile:', err);
        }
      };
      fetchUser();
    }, []);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const loadData = async () => {
                await fetchLeads();
                if (isActive) await fetchProviders();
            };
            loadData();
            return () => {
                isActive = false;
            };
        }, [])
    );

    const toggleAccordion = (id: string) => {
        setExpandedLeadId(expandedLeadId === id ? null : id);
    };

    const toggleTab = (leadId: string, role: string) => {
        setActiveTabs((prev) => ({ ...prev, [leadId]: role }));
    };

    const toggleProviderByRole = (leadId: string, providerId: string, role: string) => {
        setLeads((prev) =>
            prev.map((l) => {
                if (l.lead_id !== leadId) return l;
                const current = (l.preferred_providers_by_role ?? {})[role] || [];
                const updated = current.includes(providerId)
                    ? current.filter((id) => id !== providerId)
                    : [...current, providerId];
                return {
                    ...l,
                    preferred_providers_by_role: {
                        ...l.preferred_providers_by_role,
                        [role]: updated,
                    },
                };
            })
        );
    };

    const saveLead = async (leadId: string) => {
        try {
            const { token } = await loadAuthData();
            const lead = leads.find((l) => l.lead_id === leadId);
            if (!token || !lead) {
                console.error('❌ Missing token or lead data');
                showToast('Token or lead data is missing.', 'error');
                return;
            }

            // Validate distribution method
            if (!lead.distribution_method_by_role?.[activeTabs[leadId]] || !['JUMPBALL', 'NETWORK'].includes(lead.distribution_method_by_role?.[activeTabs[leadId]])) {
                console.error('❌ Missing or invalid distribution_method for lead:', leadId);
                showToast('Distribution method must be JUMPBALL or NETWORK.', 'error');
                return;
            }

            // Validate that at least one role is enabled
            const hasEnabledRole = Object.values(lead.role_enabled ?? {}).some(enabled => enabled);
            if (!hasEnabledRole) {
                console.error('❌ No roles enabled for lead:', leadId);
                showToast('At least one role must be enabled.', 'error');
                return;
            }

            // Sanitize affiliate prices for enabled roles
            const sanitizedPrices = { ...lead.affiliate_prices_by_role };
            Object.entries(lead.role_enabled || {}).forEach(([role, enabled]) => {
              if (enabled) {
                const price = sanitizedPrices[role];
                if (!price || price <= 0) {
                  // fallback to default or existing value
                  sanitizedPrices[role] = 6; // e.g., default price
                }
              }
            });

            // For NETWORK, ensure preferred providers are selected for enabled roles
            if (lead.distribution_method_by_role?.[activeTabs[leadId]] === 'NETWORK') {
                for (const [role, enabled] of Object.entries(lead.role_enabled)) {
                    if (enabled) {
                        const providersForRole = (lead.preferred_providers_by_role ?? {})[role] || [];
                        if (providersForRole.length === 0) {
                            console.error(`❌ No preferred providers for enabled role ${role} in lead ${leadId}`);
                            showToast(`At least one preferred provider must be selected for ${role} in NETWORK distribution.`, 'error');
                            return;
                        }
                    }
                }
            }

            const payload = {
              distribution_method: lead.distribution_method_by_role || 'JUMPBALL',
              distribution_method_by_role: lead.distribution_method_by_role || {},
              role_enabled: lead.role_enabled || {},
              affiliate_prices_by_role: sanitizedPrices,
              preferred_providers_by_role: lead.preferred_providers_by_role || {},
              notes_by_role: lead.notes_by_role || {},
            };

            console.log('🔍 Saving lead with payload:', payload);

            setSavingLeadId(leadId);

            // Use lead.id if available, otherwise fallback to leadId
            const apiLeadId = lead?.id || leadId;

            const response = await axios.put(`${API_BASE_URL}/leads/${apiLeadId}/update`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('✅ Save response:', response.data);

            setLeads((prev) =>
                prev.map((l) =>
                    l.lead_id === leadId ? { ...l, ...response.data.lead } : l
                )
            );

            showToast('Lead updated successfully.', 'success');
        } catch (e: any) {
            console.error('❌ Error saving lead:', {
                message: e.message,
                response: e.response?.data,
                status: e.response?.status,
                headers: e.response?.headers,
            });

            const errorMessage = e.response?.status === 401
                ? 'Unauthorized. Please log in again.'
                : e.response?.status === 403
                    ? 'You are not authorized to update this lead.'
                    : e.response?.data?.error || 'Failed to save lead. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setSavingLeadId(null);
        }
    };

    // Filter leads based on selected criteria and search query
  const filteredLeads = leads.filter((lead) => {
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (lead.lead_name && lead.lead_name.toLowerCase().includes(query)) ||
          (lead.state && lead.state.toLowerCase().includes(query)) ||
          (lead.county && lead.county.toLowerCase().includes(query)) ||
          (Array.isArray(lead.service_areas) &&
            lead.service_areas.some(area =>
              (area.state && area.state.toLowerCase().includes(query)) ||
              (area.county && area.county.toLowerCase().includes(query))
            ));

        if (!matchesSearch) {
            return false;
        }
    }

        if (showRecent) {
            const createdAt = new Date(lead.created_at ?? '');
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            if (createdAt < sevenDaysAgo) {
                return false;
            }
        }

        if (showAvailableRoles) {
            const hasAvailableRole = JOB_TITLES.some((role) => {
                const isEnabled = (lead.role_enabled?.[role] === true);
                const hasPrice = !!lead.affiliate_prices_by_role && lead.affiliate_prices_by_role[role] > 0;
                const isNotPurchased = !(lead.purchased_by ?? []).some((provider) => provider.job_title === role);
                return isEnabled && hasPrice && isNotPurchased;
            });
            if (!hasAvailableRole) {
                return false;
            }
        }

        return true;
    });

    if (loading || providersLoading) {
        return <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />;
    }

    console.log('🧪 Leads rendered:', filteredLeads);
    console.log('🔍 API_BASE_URL:', API_BASE_URL);

    return (
        <ScrollView style={styles.container}>
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
                <Text
                    style={{
                        color: '#007bff',
                        fontWeight: '600',
                        fontSize: 16,
                    }}
                >
                    Home
                </Text>
            </TouchableOpacity>

            <Text style={styles.header}>📤 My Leads Created</Text>

            <TextInput
                style={styles.searchInput}
                placeholder="Search by name, state, or county..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <View style={styles.filterContainer}>
                <View style={styles.filterRow}>
                    <Text style={styles.filterLabel}>Show Leads from Last 7 Days</Text>
                    <Switch
                        value={showRecent}
                        onValueChange={(value) => setShowRecent(value)}
                        trackColor={{ false: '#767577', true: '#007bff' }}
                        thumbColor={showRecent ? '#fff' : '#f4f3f4'}
                    />
                </View>
                <View style={styles.filterRow}>
                    <Text style={styles.filterLabel}>Show Leads with Available Roles</Text>
                    <Switch
                        value={showAvailableRoles}
                        onValueChange={(value) => setShowAvailableRoles(value)}
                        trackColor={{ false: '#767577', true: '#007bff' }}
                        thumbColor={showAvailableRoles ? '#fff' : '#f4f3f4'}
                    />
                </View>
            </View>

            {filteredLeads.length === 0 ? (
                <Text style={styles.noData}>No leads match the selected filters or search query.</Text>
            ) : (
                filteredLeads.map((lead, index) => {
                    const isExpanded = expandedLeadId === lead.lead_id;
                    const activeRole = activeTabs[lead.lead_id] || JOB_TITLES[0];
                    const selectedProviders = (lead.preferred_providers_by_role?.[activeRole]) || [];
                    const availableProviders = providers.filter(
                        (p) => p.job_title === activeRole && !selectedProviders.includes(String(p.id))
                    );

                    // Check if there are enabled roles that haven't been purchased
                    const enabledRoles = Object.entries(lead.role_enabled ?? {})
                        .filter(([_, enabled]) => enabled)
                        .map(([role]) => role);
                    const purchasedRoles = (lead.purchased_by ?? []).map(provider => provider.job_title);
                    const canChangeDistribution = enabledRoles.some(role => !purchasedRoles.includes(role));

                    return (
                        <View key={lead.purchase_id || lead.lead_id || index} style={styles.card}>
                            <TouchableOpacity onPress={() => toggleAccordion(lead.lead_id)}>
                                <Text style={styles.title}>{lead.lead_name}</Text>
                                <Text>{lead.state}, {lead.county}</Text>
                                <Text>💰 Affiliate Prices:</Text>
                                {JOB_TITLES.map((role) => {
  const rawAffiliatePrice = lead.affiliate_prices_by_role?.[role];
  let parsedAffiliatePrice: number | null = null;
  if (rawAffiliatePrice !== undefined && rawAffiliatePrice !== null) {
    parsedAffiliatePrice = typeof rawAffiliatePrice === 'number'
      ? rawAffiliatePrice
      : parseFloat(rawAffiliatePrice);
  }
  return (
    <Text key={role} style={styles.priceDetail}>
      {role}:{' '}
      {parsedAffiliatePrice !== null && !isNaN(parsedAffiliatePrice)
        ? `$${parsedAffiliatePrice.toFixed(2)}`
        : 'Not set'}
    </Text>
  );
})}
                                {lead.purchased_by && lead.purchased_by.length > 0 ? (
                                    <View style={styles.purchasedByContainer}>
                                        <Text style={styles.purchasedByLabel}>Purchased By:</Text>
                                        <View style={styles.purchasedByNames}>
                                            {lead.purchased_by.map((provider, idx) => (
                                                <View key={idx} style={styles.purchasedBadge}>
                                                    <Text style={styles.purchasedName}>
                                                        {provider.job_title}: {provider.first_name} {provider.last_name}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.purchasedByContainer}>
                                        <Text style={styles.purchasedByLabel}>Purchased By:</Text>
                                        <Text style={{ color: '#666', fontSize: 14 }}>Not Purchased</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.expanded}>
                                    <Text style={styles.label}>Select Role to Edit:</Text>
                                    <Picker
                                      selectedValue={activeRole}
                                      onValueChange={(role) => toggleTab(lead.lead_id, role)}
                                    >
                                      {JOB_TITLES.map((role) => (
                                        <Picker.Item key={role} label={role} value={role} />
                                      ))}
                                    </Picker>

                                    {(() => {
                                      const isPurchased = (lead.purchased_by ?? []).some((provider) => provider.job_title === activeRole);
                                      const distribution = lead.distribution_method_by_role?.[activeRole] ?? '';
                                      const rawPrice = activeRole && lead.affiliate_prices_by_role?.[activeRole];
                                      let affiliatePrice: number = 0;
                                      if (rawPrice !== undefined && rawPrice !== null) {
                                        affiliatePrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice);
                                      }
                                      const note = lead.notes_by_role?.[activeRole] ?? '';
                                      const isEnabled = lead.role_enabled?.[activeRole] ?? false;
                                      const selectedProviders = (lead.preferred_providers_by_role?.[activeRole]) || [];
                                      const availableProviders = providers.filter(
                                        (p) => p.job_title === activeRole && !selectedProviders.includes(String(p.id))
                                      );
                                      const isLocked = (lead.purchased_by ?? []).some(
                                        (p) => p.job_title?.toLowerCase() === activeRole.toLowerCase()
                                      );

                                      return (
                                        <View style={styles.section}>
                                          <Text style={styles.label}>Distribution Method:</Text>
                                          <Picker
                                            selectedValue={distribution || ''}
                                            onValueChange={(val) => {
                                              setLeads((prev) =>
                                                prev.map((l) =>
                                                  l.lead_id === lead.lead_id
                                                    ? {
                                                        ...l,
                                                        distribution_method_by_role: {
                                                          ...l.distribution_method_by_role,
                                                          [activeRole]: val,
                                                        },
                                                      }
                                                    : l
                                                )
                                              );
                                            }}
                                            enabled={!isLocked}
                                          >
                                            <Picker.Item label="Select..." value="" />
                                            <Picker.Item label="NETWORK" value="NETWORK" />
                                            <Picker.Item label="JUMPBALL" value="JUMPBALL" />
                                          </Picker>

                                          <Text style={styles.label}>Affiliate Price:</Text>
                                          <TextInput
                                            style={[styles.input, { textAlign: 'left' }]}
                                            keyboardType="decimal-pad"
                                            value={
                                              !isLocked
                                                ? (affiliatePrice > 0 ? String(affiliatePrice) : '')
                                                : undefined
                                            }
                                            onChangeText={(val) => {
                                              // Only allow numbers and decimals
                                              const cleaned = val.replace(/[^0-9.]/g, '');
                                              const parsed = parseFloat(cleaned);
                                              setLeads((prev) =>
                                                prev.map((l) =>
                                                  l.lead_id === lead.lead_id
                                                    ? {
                                                        ...l,
                                                        affiliate_prices_by_role: {
                                                          ...l.affiliate_prices_by_role,
                                                          [activeRole]: isNaN(parsed) ? 0 : parsed,
                                                        },
                                                      }
                                                    : l
                                                )
                                              );
                                            }}
                                            editable={!isLocked}
                                            placeholder="Affiliate Price"
                                          />
                                          {isLocked && (
                                            <TextInput
                                              style={[styles.input, { textAlign: 'left', backgroundColor: '#f1f1f1' }]}
                                              value={affiliatePrice > 0 ? String(affiliatePrice) : ''}
                                              editable={false}
                                              placeholder="Affiliate Price"
                                            />
                                          )}
                                          <Text style={styles.helperText}>
                                            Displaying: ${affiliatePrice.toFixed(2)}
                                          </Text>

                                          <TouchableOpacity
                                            onPress={() => {
                                              setLeads((prev) =>
                                                prev.map((l) =>
                                                  l.lead_id === lead.lead_id
                                                    ? {
                                                        ...l,
                                                        role_enabled: {
                                                          ...l.role_enabled,
                                                          [activeRole]: !isEnabled,
                                                        },
                                                      }
                                                    : l
                                                )
                                              );
                                            }}
                                            disabled={isPurchased}
                                          >
                                            <Text style={isEnabled ? styles.enabled : styles.disabled}>
                                              {isEnabled ? '✅ Enabled' : '🚫 Disabled'}
                                              {isLocked && '  🔒'}
                                            </Text>
                                          </TouchableOpacity>
                                          {isLocked && (
                                            <Text style={{ color: '#dc3545', fontSize: 13, marginBottom: 8 }}>
                                              This role has already been purchased and cannot be edited.
                                            </Text>
                                          )}

                                          <Text style={styles.label}>Preferred Providers:</Text>
                                          {selectedProviders.map((id) => {
                                            const provider = providers.find((p) => String(p.id) === id);
                                            return (
                                              <View key={id} style={styles.providerRow}>
                                                <Text>{provider?.first_name} {provider?.last_name}</Text>
                                                <TouchableOpacity
                                                  onPress={() => toggleProviderByRole(lead.lead_id, id, activeRole)}
                                                  disabled={isPurchased}
                                                >
                                                  <Text style={styles.removeText}>✕</Text>
                                                </TouchableOpacity>
                                              </View>
                                            );
                                          })}
                                          <Picker
                                            selectedValue={null}
                                            onValueChange={(selectedId) => {
                                              if (!selectedId || selectedId === 'null') return;
                                              toggleProviderByRole(lead.lead_id, String(selectedId), activeRole);
                                            }}
                                            enabled={!isPurchased}
                                          >
                                            <Picker.Item label="Add a provider..." value="null" />
                                            {availableProviders.map((p) => (
                                              <Picker.Item
                                                key={p.id}
                                                label={`${p.first_name} ${p.last_name}`}
                                                value={String(p.id)}
                                              />
                                            ))}
                                          </Picker>

                                          <Text style={styles.label}>Note:</Text>
                                          <TextInput
                                            style={styles.input}
                                            value={note}
                                            onChangeText={(text) =>
                                              setLeads((prev) =>
                                                prev.map((l) =>
                                                  l.lead_id === lead.lead_id
                                                    ? {
                                                        ...l,
                                                        notes_by_role: {
                                                          ...l.notes_by_role,
                                                          [activeRole]: text,
                                                        },
                                                      }
                                                    : l
                                                )
                                              )
                                            }
                                            editable={!isPurchased}
                                          />
                                        </View>
                                      );
                                    })()}

                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={() => saveLead(lead.lead_id)}
                                        disabled={savingLeadId === lead.lead_id}
                                    >
                                        {savingLeadId === lead.lead_id ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.saveButtonText}>Save Changes</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                })
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
    },
    filterContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
        padding: 16,
        marginBottom: 16,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 16,
        color: '#333',
    },
    noData: {
        textAlign: 'center',
        fontSize: 18,
        color: '#666',
        marginTop: 50,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#007bff',
        marginBottom: 8,
    },
    priceDetail: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    purchasedByContainer: {
        marginTop: 12,
    },
    purchasedByLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    purchasedByNames: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    purchasedBadge: {
        backgroundColor: '#e9ecef',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    purchasedName: {
        fontSize: 14,
        color: '#333',
    },
    expanded: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#ced4da',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    tabRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    tabWithPrice: {
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#ddd',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 6,
        marginBottom: 6,
        width: 100,
    },
    activeTab: {
        backgroundColor: '#007bff',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '600',
    },
    tabText: {
        color: '#333',
        fontWeight: '500',
    },
    tabPriceInput: {
        backgroundColor: '#fff',
        marginTop: 4,
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 6,
        fontSize: 12,
        width: '100%',
        textAlign: 'center',
    },
    providerSection: {
        marginTop: 16,
    },
    providerList: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
        padding: 16,
        marginBottom: 16,
    },
    providerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
    },
    providerName: {
        fontSize: 16,
        color: '#333',
    },
    removeProvider: {
        padding: 4,
    },
    addProviderContainer: {
        marginTop: 8,
    },
    providerPicker: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    notesContainer: {
        marginTop: 16,
    },
    notesInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
        paddingVertical: 10,
        paddingHorizontal: 16,
        minHeight: 60,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 8,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#ced4da',
    },
    providerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: '#f8f9fa',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#ced4da',
    },
    enabled: {
      color: '#28a745',
      fontWeight: '500',
      fontSize: 16,
    },
    disabled: {
      color: '#dc3545',
      fontWeight: '500',
      fontSize: 16,
    },
    input: {
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ced4da',
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginBottom: 16,
      fontSize: 16,
      textAlign: 'left', // Ensures left alignment
    },
    removeText: {
      color: '#dc3545',
      fontSize: 16,
      fontWeight: '500',
    },
    helperText: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
});