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
    lead_id: string; // Added to match usage in code
    purchase_id?: string | number; // Optional, as used in key
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
                id: lead.id ?? lead.lead_id ?? '', // fallback if id is missing
                lead_id: lead.lead_id,
                purchase_id: lead.purchase_id,
                lead_name: lead.lead_name || 'Unknown',
                state: lead.state_name || lead.state || 'N/A',
                county: lead.county_name || lead.county || 'N/A',
                affiliate_name: lead.affiliate_name || 'Unknown', // fallback if missing
                distribution_method: lead.distribution_method || null,
                affiliate_prices_by_role: lead.affiliate_prices_by_role || JOB_TITLES.reduce((acc, role) => ({ ...acc, [role]: 0 }), {}),
                preferred_providers_by_role: lead.preferred_providers_by_role || JOB_TITLES.reduce((acc, role) => ({ ...acc, [role]: [] }), {}),
                role_enabled: lead.role_enabled || JOB_TITLES.reduce((acc, role) => ({ ...acc, [role]: false }), {}),
                notes_by_role: lead.notes_by_role || JOB_TITLES.reduce((acc, role) => ({ ...acc, [role]: '' }), {}),
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
            if (!lead.distribution_method || !['JUMPBALL', 'NETWORK'].includes(lead.distribution_method)) {
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

            // Validate affiliate prices for enabled roles
            for (const [role, enabled] of Object.entries(lead.role_enabled ?? {})) {
                if (enabled) {
                    const price = (lead.affiliate_prices_by_role?.[role] ?? 0);
                    if (typeof price !== 'number' || price <= 0) {
                        console.error(`❌ Invalid price for role ${role} in lead ${leadId}:`, price);
                        showToast(`Price for ${role} must be a positive number.`, 'error');
                        return;
                    }
                }
            }

            // For NETWORK, ensure preferred providers are selected for enabled roles
            if (lead.distribution_method === 'NETWORK') {
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
                distribution_method: lead.distribution_method,
                preferred_providers_by_role: lead.preferred_providers_by_role,
                role_enabled: lead.role_enabled,
                notes_by_role: lead.notes_by_role,
                affiliate_prices_by_role: lead.affiliate_prices_by_role,
            };

            console.log('🔍 Saving lead with payload:', payload);

            setSavingLeadId(leadId);
            const response = await axios.put(`${API_BASE_URL}/leads/${leadId}/update`, payload, {
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
                lead.lead_name.toLowerCase().includes(query) ||
                lead.state.toLowerCase().includes(query) ||
                lead.county.toLowerCase().includes(query);
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
                const isNotPurchased = !(lead.purchased_by ?? []).some((buyer) => buyer.job_title === role);
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
                    const purchasedRoles = (lead.purchased_by ?? []).map(buyer => buyer.job_title);
                    const canChangeDistribution = enabledRoles.some(role => !purchasedRoles.includes(role));

                    return (
                        <View key={lead.purchase_id || lead.lead_id || index} style={styles.card}>
                            <TouchableOpacity onPress={() => toggleAccordion(lead.lead_id)}>
                                <Text style={styles.title}>{lead.lead_name}</Text>
                                <Text>{lead.state}, {lead.county}</Text>
                                <Text>Distribution: {lead.distribution_method || 'Not Set'}</Text>
                                <Text>💰 Affiliate Prices:</Text>
                                {Object.entries(lead.affiliate_prices_by_role || {}).map(([role, price]) => (
                                    <Text key={role} style={styles.priceDetail}>
                                        {role}: ${typeof price === 'number' ? price.toFixed(2) : 'Not set'}
                                    </Text>
                                ))}
                                {lead.purchased_by && lead.purchased_by.length > 0 ? (
                                    <View style={styles.purchasedByContainer}>
                                        <Text style={styles.purchasedByLabel}>Purchased By:</Text>
                                        <View style={styles.purchasedByNames}>
                                            {lead.purchased_by.map((buyer, idx) => (
                                                <View key={idx} style={styles.purchasedBadge}>
                                                    <Text style={styles.purchasedName}>
                                                        {buyer.job_title}: {buyer.first_name} {buyer.last_name}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.purchasedByContainer}>
                                        <Text style={styles.purchasedByLabel}>Purchased By:</Text>
                                        <Text style={styles.notPurchased}>Not Purchased</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.expanded}>
                                    <Picker
                                        selectedValue={lead.distribution_method || ''}
                                        onValueChange={(val) => {
                                            setLeads((prev) =>
                                                prev.map((l) =>
                                                    l.lead_id === lead.lead_id ? { ...l, distribution_method: val || null } : l
                                                )
                                            );
                                        }}
                                        enabled={canChangeDistribution}
                                    >
                                        <Picker.Item label="Select Distribution Method" value="" />
                                        <Picker.Item label="NETWORK" value="NETWORK" />
                                        <Picker.Item label="JUMPBALL" value="JUMPBALL" />
                                    </Picker>

                                    <Text style={styles.label}>💰 Affiliate Prices:</Text>
                                    {JOB_TITLES.map((role) => {
                                        const isRolePurchased = (lead.purchased_by ?? []).some((buyer) => buyer.job_title === role);
                                        return (
                                            <View key={role} style={styles.priceRow}>
                                                <Text style={styles.priceLabel}>{role}:</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="$0.00"
                                                    keyboardType="numeric"
                                                    value={(lead.affiliate_prices_by_role?.[role] !== undefined ? String(lead.affiliate_prices_by_role?.[role]) : '0')}
                                                    onChangeText={(text) => {
                                                        const value = text ? parseFloat(text) : 0;
                                                        setLeads((prev) =>
                                                            prev.map((l) =>
                                                                l.lead_id === lead.lead_id
                                                                    ? {
                                                                        ...l,
                                                                        affiliate_prices_by_role: {
                                                                            ...l.affiliate_prices_by_role,
                                                                            [role]: value,
                                                                        },
                                                                    }
                                                                    : l
                                                            )
                                                        );
                                                    }}
                                                    editable={!isRolePurchased}
                                                />
                                            </View>
                                        );
                                    })}

                                    <View style={styles.tabRow}>
                                        {JOB_TITLES.map((role) => {
                                            const isPurchased = (lead.purchased_by ?? []).some((p) => p.job_title === role);
                                            return (
                                                <TouchableOpacity
                                                    key={role}
                                                    disabled={isPurchased}
                                                    style={[
                                                        styles.tab,
                                                        activeRole === role && styles.activeTab,
                                                        isPurchased && { backgroundColor: '#ccc' },
                                                    ]}
                                                    onPress={() => toggleTab(lead.lead_id, role)}
                                                >
                                                    <Text style={activeRole === role ? styles.activeTabText : styles.tabText}>
                                                        {role}
                                                        {isPurchased ? ' 🔒' : ''}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    <View style={styles.section}>
                                        <Text style={styles.label}>Enable for {activeRole}:</Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setLeads((prev) =>
                                                    prev.map((l) =>
                                                        l.lead_id === lead.lead_id
                                                            ? {
                                                                ...l,
                                                                role_enabled: {
                                                                    ...l.role_enabled,
                                                                    [activeRole]: !l.role_enabled?.[activeRole],
                                                                },
                                                            }
                                                            : l
                                                    )
                                                );
                                            }}
                                            disabled={(lead.purchased_by ?? []).some((buyer) => buyer.job_title === activeRole)}
                                        >
                                            <Text style={lead.role_enabled?.[activeRole] ? styles.enabled : styles.disabled}>
                                                {lead.role_enabled?.[activeRole] ? '✅ Enabled' : '🚫 Disabled'}
                                            </Text>
                                        </TouchableOpacity>

                                        <Text style={styles.label}>📝 Note:</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter a note for this role"
                                            value={lead.notes_by_role?.[activeRole] || ''}
                                            onChangeText={(text: string) =>
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
                                            editable={!((lead.purchased_by ?? []).some((buyer) => buyer.job_title === activeRole))}
                                        />

                                        <Text style={styles.label}>👥 Providers:</Text>
                                        {selectedProviders.map((id) => {
                                            const provider = providers.find((p) => String(p.id) === id);
                                            if (!provider) return null;
                                            return (
                                                <View key={id} style={styles.providerRow}>
                                                    <Text>
                                                        {provider.first_name} {provider.last_name}
                                                    </Text>
                                                    <TouchableOpacity
                                                        onPress={() => toggleProviderByRole(lead.lead_id, id, activeRole)}
                                                        disabled={(lead.purchased_by ?? []).some((buyer) => buyer.job_title === activeRole)}
                                                    >
                                                        <Text style={styles.removeText}>✕</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}

                                        <Picker
                                            selectedValue=""
                                            onValueChange={(selectedId) => {
                                                if (!selectedId) return;
                                                toggleProviderByRole(lead.lead_id, selectedId, activeRole);
                                            }}
                                            enabled={!((lead.purchased_by ?? []).some((buyer) => buyer.job_title === activeRole))}
                                        >
                                            <Picker.Item label="Add a provider..." value="" />
                                            {availableProviders.map((p) => (
                                                <Picker.Item
                                                    key={p.id}
                                                    label={`${p.first_name} ${p.last_name} (${p.job_title})`}
                                                    value={String(p.id)}
                                                />
                                            ))}
                                        </Picker>
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.saveButton,
                                            { opacity: savingLeadId === lead.lead_id ? 0.6 : 1 },
                                        ]}
                                        onPress={() => saveLead(lead.lead_id)}
                                        disabled={savingLeadId === lead.lead_id}
                                    >
                                        <Text style={styles.saveText}>
                                            {savingLeadId === lead.lead_id ? 'Saving...' : 'SAVE LEAD DISTRIBUTION'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                })
            )}
            <Toast />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff' },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    searchInput: {
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 8,
        borderRadius: 6,
        marginBottom: 16,
    },
    filterContainer: {
        marginBottom: 16,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    noData: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: { fontSize: 18, fontWeight: 'bold' },
    priceDetail: { marginLeft: 16, fontSize: 14 },
    purchasedByContainer: {
        marginTop: 8,
        marginBottom: 4,
    },
    purchasedByLabel: {
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#2e7d32',
    },
    purchasedByNames: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    purchasedBadge: {
        backgroundColor: '#e6ffed',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginRight: 6,
        marginBottom: 6,
    },
    purchasedName: {
        color: '#2e7d32',
        fontWeight: 'bold',
    },
    notPurchased: {
        color: '#666',
        fontStyle: 'italic',
    },
    expanded: { marginTop: 12 },
    tabRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginVertical: 10,
    },
    tab: {
        backgroundColor: '#ddd',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginRight: 6,
        marginBottom: 6,
    },
    activeTab: {
        backgroundColor: '#007bff',
    },
    tabText: { fontWeight: 'normal' },
    activeTabText: { color: '#fff', fontWeight: 'bold' },
    section: { marginTop: 12 },
    label: { fontWeight: 'bold', marginTop: 10 },
    priceLabel: { fontWeight: 'bold', marginTop: 10, flex: 1 },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    input: {
        backgroundColor: '#f4f4f4',
        padding: 10,
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 10,
        flex: 1,
    },
    providerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 6,
        marginTop: 4,
    },
    removeText: { color: 'red', marginLeft: 8 },
    enabled: { color: 'green' },
    disabled: { color: 'gray' },
    saveButton: {
        backgroundColor: '#007bff',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    saveText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});