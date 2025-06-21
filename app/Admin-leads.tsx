import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useNavigation, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://myleadwell-backend.onrender.com';


type Purchase = {
  status?: string;
  payout_status?: string;
  payout_amount?: number;
  payout_id?: string;
  payout_sent_at?: string;
  provider_revenue?: number;
  payment_intent_id?: string;
  provider_id?: string;
  provider_name?: string;
  status_history?: { previous_status: string; new_status: string; changed_at: string }[];
};

type Lead = {
  id: string;
  lead_name: string;
  lead_status?: string;
  email?: string;
  phone?: string;
  purchases?: Purchase[];
  created_at?: string;
  state?: string;
  submitted_by?: string;
  affiliate_name?: string;
  affiliate_prices_by_role?: Record<string, number>;
  distribution_method?: string;
  preferred_providers_by_role?: any;
  role_enabled?: any;
  notes_by_role?: any;
  notified_providers?: string;
  join_network?: boolean;
  agreed_to_terms?: boolean;
  selected_gift_card?: string;
  [key: string]: any;
};

type Provider = {
  id: string;
  name: string;
  job_title: string;
};

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const LEAD_STATUSES = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Attempted Contact', value: 'attempted-contact' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Closed Sale Made', value: 'closed-sale-made' },
  { label: 'Closed No Sale', value: 'closed-no-sale' },
  { label: 'Ineligible', value: 'ineligible' },
];
const DISTRIBUTION_METHODS = ['NETWORK', 'JUMPBALL'];
const BOOLEAN_OPTIONS = ['true', 'false'];
const GIFT_CARD_OPTIONS = ['visa', 'amazon', 'mastercard', 'none'];
const JOB_TITLES = [
  'Real Estate Agent',
  'Loan Originator',
  'Title Agent',
  'Insurance Agent',
  'Home Inspector',
];

export default function AdminLeadsScreen(): JSX.Element {
  const router = useNavigation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [affiliateFilter, setAffiliateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [editedLead, setEditedLead] = useState<any>(null);
  const [newLeadStatus, setNewLeadStatus] = useState<string | null>(null);
  const [giftCardStatus, setGiftCardStatus] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: { [section: string]: boolean } }>({});
  const [activeProviders, setActiveProviders] = useState<Provider[]>([]);
  const [providerNames, setProviderNames] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [purchaseFilter, setPurchaseFilter] = useState('all');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const params: Record<string, string> = {};
        if (statusFilter !== 'all') params.lead_status = statusFilter;
        if (stateFilter !== 'all') params.state = stateFilter;
        if (affiliateFilter !== 'all') params.submitted_by = affiliateFilter;

        const res = await axios.get(`${API_BASE_URL}/admin/leads`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        console.log('✅ Admin Leads:', res.data);
        setLeads(res.data.map((lead: any) => ({
          ...lead,
          lead_status: lead.status, // This lets you keep using lead.lead_status everywhere else if you want
        })));

        const providerMap: { [key: string]: string } = {};
        res.data.forEach((lead: Lead) => {
          lead.purchases?.forEach((purchase: Purchase) => {
            if (purchase.provider_id && purchase.provider_name) {
              providerMap[purchase.provider_id] = purchase.provider_name;
            }
          });
        });
        setProviderNames(providerMap);
      } catch (error) {
        console.error("❌ Failed to fetch admin leads:", error);
        setError("Unable to load leads. Please check your admin permissions or try again.");
      }
    };

    const fetchActiveProviders = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('❌ No token found for fetching active providers');
          throw new Error('No authentication token found');
        }
        const res = await axios.get(`${API_BASE_URL}/admin/active-providers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('✅ Active Providers Response:', res.data);
        setActiveProviders(res.data);
      } catch (err: any) {
        console.error('❌ Error fetching active providers:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          headers: err.response?.headers,
        });
        Toast.show({
          type: 'error',
          text1: 'Failed to load providers',
          text2: err.response?.data?.error || 'Please try again later.',
        });
      }
    };

    fetchLeads();
    fetchActiveProviders();
  }, [statusFilter, stateFilter, affiliateFilter]);

  useEffect(() => {
    if (expandedLeadId) {
      const fetchGiftCardStatus = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await axios.get(`${API_BASE_URL}/admin/leads/${expandedLeadId}/gift-card-status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setGiftCardStatus(res.data.status);
        } catch (err) {
          console.error('Error fetching gift card status:', err);
          setGiftCardStatus('error');
        }
      };
      fetchGiftCardStatus();
    }
  }, [expandedLeadId]);

  const refreshLeads = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/admin/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(res.data);
      Toast.show({
        type: 'success',
        text1: 'Leads Refreshed',
      });
    } catch (err) {
      console.error('Error refreshing leads:', err);
      Toast.show({
        type: 'error',
        text1: 'Failed to refresh leads',
      });
    }
  };

  const filteredLeads = leads
    // Purchase filter
    .filter((lead) => {
      if (purchaseFilter === 'yes') {
        return lead.purchases?.some((p) => p.purchase_event_status === 'purchased');
      } else if (purchaseFilter === 'no') {
        return !lead.purchases || lead.purchases.every((p) => p.purchase_event_status !== 'purchased');
      }
      return true;
    })
    .filter((lead) => {
      if (statusFilter === 'all') return true;
      return lead.purchases?.[0]?.status === statusFilter;
    })
    .filter((lead) => {
      if (!search.trim()) return true;
      const email = (lead.email || '').toLowerCase();
      const phone = (lead.phone || '').toLowerCase();
      return (
        lead.lead_name.toLowerCase().includes(search.toLowerCase()) ||
        email.includes(search.toLowerCase()) ||
        phone.includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      // Step 2: Update sort logic
      if (sortBy === 'created_at_desc') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      } else if (sortBy === 'created_at_asc') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      } else if (sortBy === 'payout_amount_desc') {
        const aPayout = a.purchases?.[0]?.payout_amount || 0;
        const bPayout = b.purchases?.[0]?.payout_amount || 0;
        return bPayout - aPayout;
      } else if (sortBy === 'payout_amount_asc') {
        const aPayout = a.purchases?.[0]?.payout_amount || 0;
        const bPayout = b.purchases?.[0]?.payout_amount || 0;
        return aPayout - bPayout;
      }
      return 0;
    });

  const uniqueStates = Array.from(new Set(leads.map((lead) => lead.state).filter(Boolean)));
  const uniqueAffiliates = Array.from(
    new Set(leads.map((lead) => lead.submitted_by).filter(Boolean))
  );

  function isJsonField(field: string) {
    return [
      'metadata',
      'custom_data',
      'preferred_providers_by_role',
      'role_enabled',
      'notes_by_role',
    ].includes(field);
  }

  const renderJsonField = (value: any, fieldName: string) => {
    if (!value) return <Text style={styles.value}>N/A</Text>;
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      if (Object.keys(parsed).length === 0) return <Text style={styles.value}>Empty</Text>;

      if (fieldName === 'preferred_providers_by_role') {
        return (
          <View style={styles.jsonField}>
            {Object.entries(parsed).map(([role, providerIds]: [string, any]) => (
              <Text key={role} style={styles.jsonEntry}>
                <Text style={styles.jsonKey}>{role}:</Text>{" "}
                {(Array.isArray(providerIds) ? providerIds : [providerIds]).map((id: string) => 
                  providerNames[id] ? `${providerNames[id]} (ID: ${id})` : id
                ).join(", ")}
              </Text>
            ))}
          </View>
        );
      }

      return (
        <View style={styles.jsonField}>
          {Object.entries(parsed).map(([key, val]) => (
            <Text key={key} style={styles.jsonEntry}>
              <Text style={styles.jsonKey}>{key}:</Text>{" "}
              {Array.isArray(val) ? val.join(", ") : String(val)}
            </Text>
          ))}
        </View>
      );
    } catch (err) {
      console.error('Error parsing JSON field:', value, err);
      return <Text style={styles.errorText}>Error parsing data</Text>;
    }
  };

    const bgColor = backgroundMap[type] || '#6b7280';

    return (
      <Text
        style={{
          backgroundColor: bgColor,
          color: '#fff',
          fontSize: 13,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          marginHorizontal: 4,
          fontWeight: '600',
          minWidth: 80,
          textAlign: 'center',
        }}
      >
        {status}
      </Text>
    );
  };

  const isRecentPayout = (date: string) => {
    const payoutDate = new Date(date);
    const today = new Date('2025-06-01T14:44:00-04:00');
    return payoutDate.toDateString() === today.toDateString();
  };

  const toggleSection = (leadId: string, section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        [section]: !prev[leadId]?.[section],
      },
    }));
  };

  const handleSave = async (leadId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Missing token');
      }

      if (!editedLead || Object.keys(editedLead).length === 0) {
        Toast.show({
          type: 'error',
          text1: 'Save Failed',
          text2: 'No changes to save.',
        });
        return;
      }

      const payload = { ...editedLead };
      Object.keys(payload).forEach((key) => {
        if (isJsonField(key) && typeof payload[key] === 'string') {
          try {
            payload[key] = JSON.parse(payload[key]);
          } catch (e) {
            console.error(`Failed to parse JSON for field ${key}:`, e);
          }
        }
      });

      await axios.put(`${API_BASE_URL}/admin/leads/${leadId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        type: 'success',
        text1: 'Lead Saved',
        text2: 'Lead updated successfully.',
      });

      const res = await axios.get(`${API_BASE_URL}/admin/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(res.data);
      setEditedLead(null);
      setExpandedLeadId(null);
      setExpandedSections((prev) => {
        const newSections = { ...prev };
        delete newSections[leadId];
        return newSections;
      });
    } catch (err) {
      console.error('Error saving lead:', err);
      let errorMessage = 'Failed to save lead.';
      if (
        err &&
        'response' in err &&
        (err as any).response &&
        'data' in (err as any).response &&
        (err as any).response.data &&
        'error' in (err as any).response.data
      ) {
        errorMessage = (err as any).response.data.error || errorMessage;
      }
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: errorMessage,
      });
    }
  };

  const handleUpdateStatus = async (leadId: string) => {
    if (!newLeadStatus) return;
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/admin/leads/${leadId}/status`,
        { lead_status: newLeadStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Toast.show({
        type: 'success',
        text1: 'Status Updated',
        text2: 'Lead status updated successfully.',
      });
      const res = await axios.get(`${API_BASE_URL}/admin/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(res.data);
      setNewLeadStatus(null);
    } catch (err) {
      console.error('Error updating status:', err);
      Toast.show({
        type: 'error',
        text1: 'Status Update Failed',
        text2: 'Failed to update lead status.',
      });
    }
  };

  const handleNotifyProviders = async (leadId: string) => {
    Toast.show({
      type: 'info',
      text1: 'Notifying Providers',
      text2: 'This feature is not yet implemented.',
    });
  };

  const handleProviderChange = (role: string, providerId: string) => {
    setEditedLead((prev: any) => {
      const currentProviders = prev.preferred_providers_by_role
        ? typeof prev.preferred_providers_by_role === 'string'
          ? JSON.parse(prev.preferred_providers_by_role)
          : prev.preferred_providers_by_role
        : lead.preferred_providers_by_role || {};

      const updatedProviders = {
        ...currentProviders,
        [role]: providerId === 'none' ? [] : [providerId],
      };

      return {
        ...prev,
        preferred_providers_by_role: updatedProviders,
      };
    });
  };

  const handleRoleEnabledChange = (role: string, enabled: string) => {
    setEditedLead((prev: any) => {
      const currentRoles = prev.role_enabled
        ? typeof prev.role_enabled === 'string'
          ? JSON.parse(prev.role_enabled)
          : prev.role_enabled
        : lead.role_enabled || {};

      const updatedRoles = {
        ...currentRoles,
        [role]: enabled === 'true',
      };

      return {
        ...prev,
        role_enabled: updatedRoles,
      };
    });
  };

  const StatusBadge = ({ status, type }: { status: string; type: string }) => {
    const backgroundMap: { [key: string]: string } = {
      sold: '#10b981',
      'closed-sale-made': '#10b981',
      paid: '#3b82f6',
      pending: '#facc15',
      unpaid: '#ef4444',
      expired: '#9ca3af',
      ineligible: '#9ca3af',
      'in-progress': '#f59e0b',
      'attempted-contact': '#a78bfa',
      error: '#dc2626',
    };

    const bgColor = backgroundMap[type] || '#6b7280';

    return (
      <Text
        style={{
          backgroundColor: bgColor,
          color: '#fff',
          fontSize: 13,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          marginHorizontal: 4,
          fontWeight: '600',
          minWidth: 80,
          textAlign: 'center',
        }}
      >
        {status}
      </Text>
    );
  };

  return (
    <>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.navigate('HomeScreen')}
        >
          <Text style={styles.homeButtonText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshLeads}>
          <Text style={styles.refreshButtonText}>Refresh Leads</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>📋 Admin Leads</Text>

        <TextInput
          placeholder="Search leads"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />

        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Lead Status:</Text>
            {LEAD_STATUSES.map(({ label, value }) => (
              <TouchableOpacity key={value} onPress={() => setStatusFilter(value)}>
                <Text style={[styles.filterText, statusFilter === value && styles.filterActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>State:</Text>
            <TouchableOpacity onPress={() => setStateFilter('all')}>
              <Text style={[styles.filterText, stateFilter === 'all' && styles.filterActive]}>All</Text>
            </TouchableOpacity>
            {uniqueStates.map((state) => (
              <TouchableOpacity key={state} onPress={() => setStateFilter(state ?? '')}>
                <Text style={[styles.filterText, stateFilter === state && styles.filterActive]}>{state}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Affiliate:</Text>
            <TouchableOpacity onPress={() => setAffiliateFilter('all')}>
              <Text style={[styles.filterText, affiliateFilter === 'all' && styles.filterActive]}>All</Text>
            </TouchableOpacity>
            {uniqueAffiliates.map((affiliate) => (
              <TouchableOpacity key={affiliate} onPress={() => setAffiliateFilter(affiliate ?? '')}>
                <Text style={[styles.filterText, affiliateFilter === affiliate && styles.filterActive]}>{affiliate}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Purchased:</Text>
            <TouchableOpacity onPress={() => setPurchaseFilter('all')}>
              <Text style={[styles.filterText, purchaseFilter === 'all' && styles.filterActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPurchaseFilter('yes')}>
              <Text style={[styles.filterText, purchaseFilter === 'yes' && styles.filterActive]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPurchaseFilter('no')}>
              <Text style={[styles.filterText, purchaseFilter === 'no' && styles.filterActive]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error && (
          <View style={{ backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <Text style={{ color: '#b91c1c', fontWeight: 'bold' }}>{error}</Text>
          </View>
        )}

        {filteredLeads.map((lead) => (
          <View key={lead.id} style={styles.card}>
            <Pressable
              onPress={() => {
                setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id);
                setEditedLead({});
                setNewLeadStatus(lead.lead_status || 'pending');
              }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.title}>
                  {lead.lead_name} — <StatusBadge status={lead.lead_status || 'pending'} type={lead.lead_status || 'pending'} />
                  {(lead.purchases?.length ?? 0) > 0 && (
                    <>
                      {' (Purchase: '}
                      <StatusBadge status={lead.purchases![0].status || '—'} type={lead.purchases![0].status || '—'} />
                      {', Payout: '}
                      <StatusBadge
                        status={lead.purchases![0].payout_status || 'unpaid'}
                        type={lead.purchases![0].payout_status || 'unpaid'}
                      />
                      {')'}
                    </>
                  )}
                </Text>
                <Ionicons
                  name={expandedLeadId === lead.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#007bff"
                />
              </View>
            </Pressable>
            {expandedLeadId === lead.id && (
              <View style={styles.expanded}>
                {/* Lead Details */}
                <View style={styles.section}>
                  <Pressable onPress={() => toggleSection(lead.id, 'leadDetails')}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Lead Details</Text>
                      <Ionicons
                        name={expandedSections[lead.id]?.leadDetails ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#007bff"
                      />
                    </View>
                  </Pressable>
                  {expandedSections[lead.id]?.leadDetails && (
                    <View style={styles.sectionContent}>
                      <View style={styles.field}>
                        <Text style={styles.label}>ID</Text>
                        <Text style={styles.value}>{lead.id}</Text>
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>LEAD NAME</Text>
                        <TextInput
                          style={styles.input}
                          value={editedLead.lead_name ?? String(lead.lead_name || '')}
                          onChangeText={(text) => setEditedLead((prev: any) => ({ ...prev, lead_name: text }))}
                        />
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>LEAD EMAIL</Text>
                        <TextInput
                          style={styles.input}
                          value={editedLead.lead_email ?? String(lead.lead_email || '')}
                          onChangeText={(text) => setEditedLead((prev: any) => ({ ...prev, lead_email: text }))}
                        />
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>LEAD PHONE</Text>
                        <TextInput
                          style={styles.input}
                          value={editedLead.lead_phone ?? String(lead.lead_phone || '')}
                          onChangeText={(text) => setEditedLead((prev: any) => ({ ...prev, lead_phone: text }))}
                        />
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>STATE</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={editedLead.state ?? lead.state ?? ''}
                            onValueChange={(itemValue) =>
                              setEditedLead((prev: any) => ({ ...prev, state: itemValue }))
                            }
                            style={styles.picker}
                          >
                            {US_STATES.map((state) => (
                              <Picker.Item key={state} label={state} value={state} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>COUNTY</Text>
                        <TextInput
                          style={styles.input}
                          value={editedLead.county ?? String(lead.county || '')}
                          onChangeText={(text) => setEditedLead((prev: any) => ({ ...prev, county: text }))}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Status & Dates */}
                <View style={styles.section}>
                  <Pressable onPress={() => toggleSection(lead.id, 'statusDates')}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Status & Dates</Text>
                      <Ionicons
                        name={expandedSections[lead.id]?.statusDates ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#007bff"
                      />
                    </View>
                  </Pressable>
                  {expandedSections[lead.id]?.statusDates && (
                    <View style={styles.sectionContent}>
                      <View style={styles.field}>
                        <Text style={styles.label}>LEAD STATUS</Text>
                        <View style={styles.statusRow}>
                          <Text style={styles.value}>
                            <StatusBadge status={lead.lead_status || 'pending'} type={lead.lead_status || 'pending'} />
                          </Text>
                          <View style={styles.statusUpdate}>
                            <View style={[styles.pickerContainer, { flex: 1 }]}>
                              <Picker
                                selectedValue={newLeadStatus || 'pending'}
                                onValueChange={(itemValue) => setNewLeadStatus(itemValue)}
                                style={styles.picker}
                              >
                                {LEAD_STATUSES.map((status) => (
                                  <Picker.Item key={status.value} label={status.label} value={status.value} />
                                ))}
                              </Picker>
                            </View>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleUpdateStatus(lead.id)}
                            >
                              <Text style={styles.actionButtonText}>Update</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                      {['created_at', 'notified_expired'].map((field) => (
                        <View key={field} style={styles.field}>
                          <Text style={styles.label}>{field.replace(/_/g, ' ').toUpperCase()}</Text>
                          <Text style={styles.value}>
                            {lead[field] ? new Date(lead[field]).toLocaleString() : '—'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Affiliate Information */}
                <View style={styles.section}>
                  <Pressable onPress={() => toggleSection(lead.id, 'affiliateInfo')}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Affiliate Information</Text>
                      <Ionicons
                        name={expandedSections[lead.id]?.affiliateInfo ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#007bff"
                      />
                    </View>
                  </Pressable>
                  {expandedSections[lead.id]?.affiliateInfo && (
                    <View style={styles.sectionContent}>
                      <View style={styles.field}>
                        <Text style={styles.label}>SUBMITTED BY</Text>
                        <Link href={`/admin/users/${lead.submitted_by}`} style={styles.link}>
                          <Text style={styles.linkText}>
                            {lead.affiliate_name
                              ? `${lead.affiliate_name} (ID: ${lead.submitted_by})`
                              : lead.submitted_by || '—'}
                          </Text>
                        </Link>
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>AFFILIATE PRICES</Text>
                        {JOB_TITLES.map((role) => (
                          <View key={role} style={styles.priceRow}>
                            <Text style={styles.priceLabel}>{role}:</Text>
                            <TextInput
                              style={styles.input}
                              value={
                                editedLead.affiliate_prices_by_role?.[role] !== undefined
                                  ? `$${Number(editedLead.affiliate_prices_by_role[role]).toFixed(2)}`
                                  : lead.affiliate_prices_by_role?.[role] !== undefined
                                  ? `$${Number(lead.affiliate_prices_by_role[role]).toFixed(2)}`
                                  : '$0.00'
                              }
                              onChangeText={(text) => {
                                const value = parseFloat(text.replace('$', '')) || 0;
                                setEditedLead((prev: any) => ({
                                  ...prev,
                                  affiliate_prices_by_role: {
                                    ...prev.affiliate_prices_by_role,
                                    [role]: value,
                                  },
                                }));
                              }}
                              keyboardType="numeric"
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Distribution Settings */}
                <View style={styles.section}>
                  <Pressable onPress={() => toggleSection(lead.id, 'distributionSettings')}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Distribution Settings</Text>
                      <Ionicons
                        name={expandedSections[lead.id]?.distributionSettings ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#007bff"
                      />
                    </View>
                  </Pressable>
                  {expandedSections[lead.id]?.distributionSettings && (
                    <View style={styles.sectionContent}>
                      <View style={styles.field}>
                        <Text style={styles.label}>DISTRIBUTION METHOD</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={editedLead.distribution_method ?? lead.distribution_method ?? 'NETWORK'}
                            onValueChange={(itemValue) =>
                              setEditedLead((prev: any) => ({ ...prev, distribution_method: itemValue }))
                            }
                            style={styles.picker}
                          >
                            {DISTRIBUTION_METHODS.map((method) => (
                              <Picker.Item key={method} label={method} value={method} />
                            ))}
                          </Picker>
                        </View>
                      </View>

                      {/* Preferred Providers by Role */}
                      <View style={styles.field}>
                        <Text style={styles.label}>PREFERRED PROVIDERS BY ROLE</Text>
                        {renderJsonField(lead.preferred_providers_by_role, 'preferred_providers_by_role')}
                        {activeProviders.length > 0 && (
                          <View style={styles.providerPickers}>
                            {[...new Set(activeProviders.map((p) => p.job_title))].map((role) => (
                              <View key={role} style={styles.providerPicker}>
                                <Text style={styles.label}>{role.toUpperCase()}</Text>
                                <View style={styles.pickerContainer}>
                                  <Picker
                                    selectedValue={
                                      editedLead.preferred_providers_by_role?.[role]?.[0] ||
                                      lead.preferred_providers_by_role?.[role]?.[0] ||
                                      'none'
                                    }
                                    onValueChange={(itemValue) => handleProviderChange(role, itemValue)}
                                    style={styles.picker}
                                  >
                                    <Picker.Item label="None" value="none" />
                                    {activeProviders
                                      .filter((p) => p.job_title === role)
                                      .map((provider) => (
                                        <Picker.Item
                                          key={provider.id}
                                          label={`${provider.name} (ID: ${provider.id})`}
                                          value={provider.id}
                                        />
                                      ))}
                                  </Picker>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Role Enabled */}
                      <View style={styles.field}>
                        <Text style={styles.label}>ROLE ENABLED</Text>
                        {renderJsonField(lead.role_enabled, 'role_enabled')}
                        {activeProviders.length > 0 && (
                          <View style={styles.providerPickers}>
                            {[...new Set(activeProviders.map((p) => p.job_title))].map((role) => (
                              <View key={role} style={styles.providerPicker}>
                                <Text style={styles.label}>{role.toUpperCase()}</Text>
                                <View style={styles.pickerContainer}>
                                  <Picker
                                    selectedValue={
                                      String(
                                        editedLead.role_enabled?.[role] ??
                                        lead.role_enabled?.[role] ??
                                        false
                                      )
                                    }
                                    onValueChange={(itemValue) => handleRoleEnabledChange(role, itemValue)}
                                    style={styles.picker}
                                  >
                                    {BOOLEAN_OPTIONS.map((option) => (
                                      <Picker.Item key={option} label={option} value={option} />
                                    ))}
                                  </Picker>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>

                      <View style={styles.field}>
                        <Text style={styles.label}>NOTES BY ROLE</Text>
                        {renderJsonField(lead.notes_by_role, 'notes_by_role')}
                        <TextInput
                          style={[styles.input, styles.jsonInput]}
                          value={editedLead.notes_by_role ?? JSON.stringify(lead.notes_by_role, null, 2)}
                          multiline
                          onChangeText={(text) =>
                            setEditedLead((prev: any) => ({ ...prev, notes_by_role: text }))
                          }
                        />
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>NOTIFIED PROVIDERS</Text>
                        <TextInput
                          style={styles.input}
                          value={editedLead.notified_providers ?? String(lead.notified_providers || '')}
                          onChangeText={(text) =>
                            setEditedLead((prev: any) => ({ ...prev, notified_providers: text }))
                          }
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleNotifyProviders(lead.id)}
                      >
                        <Text style={styles.actionButtonText}>Notify Providers</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Purchases */}
                <View style={styles.section}>
                  <Pressable onPress={() => toggleSection(lead.id, 'purchases')}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Purchases</Text>
                      <Ionicons
                        name={expandedSections[lead.id]?.purchases ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#007bff"
                      />
                    </View>
                  </Pressable>
                  {expandedSections[lead.id]?.purchases && (
                    <View style={styles.sectionContent}>
                      {lead.purchases?.map((purchase: Purchase, index: number) => (
                        <View key={index} style={styles.purchase}>
                          <Text style={styles.purchaseTitle}>Purchase {index + 1}</Text>
                          <Text style={styles.purchaseDetail}>
                            Provider: {purchase.provider_name
                              ? `${purchase.provider_name} (ID: ${purchase.provider_id})`
                              : purchase.provider_id
                              ? `ID: ${purchase.provider_id}`
                              : '—'}
                          </Text>
                          <Text style={styles.purchaseDetail}>
                            Status: <StatusBadge status={purchase.status || '—'} type={purchase.status || '—'} />
                          </Text>
                          <Text style={styles.purchaseDetail}>
                            Payout Status: <StatusBadge
                              status={purchase.payout_status || 'unpaid'}
                              type={purchase.payout_status || 'unpaid'}
                            />
                            {purchase.payout_sent_at && isRecentPayout(purchase.payout_sent_at) && (
                              <Text style={[styles.badge, { backgroundColor: '#ff9500', color: '#fff', marginLeft: 8 }]}>
                                Recent
                              </Text>
                            )}
                          </Text>
                          <Text style={[styles.purchaseDetail, !purchase.payout_amount && styles.errorText]}>
                            Payout Amount: ${purchase.payout_amount ? purchase.payout_amount.toFixed(2) : '0.00'}
                          </Text>
                          <Text style={styles.purchaseDetail}>Payout ID: {purchase.payout_id || '—'}</Text>
                          <Text style={styles.purchaseDetail}>
                            Payout Date: {purchase.payout_sent_at ? new Date(purchase.payout_sent_at).toLocaleString() : '—'}
                          </Text>
                          <Text style={styles.purchaseDetail}>
                            Provider Revenue: {typeof purchase.provider_revenue === 'number'
                              ? `$${purchase.provider_revenue.toFixed(2)}`
                              : '—'}
                          </Text>
                          <Text style={styles.purchaseDetail}>Payment ID: {purchase.payment_intent_id || '—'}</Text>
                          {purchase.status_history && (
                            <View style={styles.statusHistory}>
                              <Text style={styles.purchaseDetail}>Status History:</Text>
                              <FlatList
                                data={purchase.status_history}
                                horizontal
                                renderItem={({ item }) => (
                                  <View style={styles.historyEntry}>
                                    <Text style={styles.historyText}>
                                      {item.previous_status} → {item.new_status} on{" "}
                                      {new Date(item.changed_at).toLocaleString()}
                                    </Text>
                                  </View>
                                )}
                                keyExtractor={(item, index) => index.toString()}
                                showsHorizontalScrollIndicator={false}
                              />
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Additional Metadata */}
                <View style={styles.section}>
                  <Pressable onPress={() => toggleSection(lead.id, 'additionalMetadata')}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Additional Metadata</Text>
                      <Ionicons
                        name={expandedSections[lead.id]?.additionalMetadata ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#007bff"
                      />
                    </View>
                  </Pressable>
                  {expandedSections[lead.id]?.additionalMetadata && (
                    <View style={styles.sectionContent}>
                      <View style={styles.field}>
                        <Text style={styles.label}>JOIN NETWORK</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={editedLead.join_network ?? String(lead.join_network || 'false')}
                            onValueChange={(itemValue) =>
                              setEditedLead((prev: any) => ({ ...prev, join_network: itemValue }))
                            }
                            style={styles.picker}
                          >
                            {BOOLEAN_OPTIONS.map((option) => (
                              <Picker.Item key={option} label={option} value={option} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>AGREED TO TERMS</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={editedLead.agreed_to_terms ?? String(lead.agreed_to_terms || 'false')}
                            onValueChange={(itemValue) =>
                              setEditedLead((prev: any) => ({ ...prev, agreed_to_terms: itemValue }))
                            }
                            style={styles.picker}
                          >
                            {BOOLEAN_OPTIONS.map((option) => (
                              <Picker.Item key={option} label={option} value={option} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>SELECTED GIFT CARD</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={editedLead.selected_gift_card ?? lead.selected_gift_card ?? 'none'}
                            onValueChange={(itemValue) =>
                              setEditedLead((prev: any) => ({ ...prev, selected_gift_card: itemValue }))
                            }
                            style={styles.picker}
                          >
                            {GIFT_CARD_OPTIONS.map((option) => (
                              <Picker.Item key={option} label={option} value={option} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>GIFT CARD STATUS</Text>
                        <Text style={styles.value}>
                          {giftCardStatus ? (
                            <StatusBadge status={giftCardStatus} type={giftCardStatus} />
                          ) : (
                            '—'
                          )}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <TouchableOpacity onPress={() => handleSave(lead.id)} style={styles.saveButton}>
                  <Text style={styles.saveText}>💾 Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        <Toast />
        <View style={{ height: 100 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  searchInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
    marginBottom: 16,
  },
  filterRow: { marginBottom: 16 },
  filterGroup: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' },
  filterLabel: { fontSize: 14, fontWeight: '600', marginRight: 8 },
  filterText: { marginRight: 10, fontSize: 14, color: '#000' },
  filterActive: { color: '#007bff', fontWeight: 'bold' },
  card: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#f1f1f1',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  expanded: { marginTop: 12 },
  section: { marginBottom: 20, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  sectionContent: { padding: 10, paddingTop: 0 },
  field: { marginBottom: 10 },
  label: { fontSize: 12, color: '#555', marginBottom: 4, fontWeight: '600' },
  priceLabel: { fontSize: 12, color: '#555', marginBottom: 4, fontWeight: '600', flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  picker: {
    height: 40,
  },
  providerPickers: { marginTop: 8 },
  providerPicker: { marginBottom: 8 },
  value: { fontSize: 14, padding: 4, color: '#333' },
  jsonField: { marginBottom: 8 },
  jsonEntry: { fontSize: 14, color: '#333' },
  jsonKey: { fontWeight: '600' },
  errorText: { color: '#dc3545', fontSize: 14 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusUpdate: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  actionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  link: { padding: 4 },
  linkText: { color: '#007bff', fontSize: 14, textDecorationLine: 'underline' },
  purchase: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
  },
  purchaseTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  purchaseDetail: { fontSize: 14, color: '#333', marginTop: 4 },
  statusHistory: { marginTop: 8 },
  historyEntry: { padding: 8, backgroundColor: '#f8f9fa', borderRadius: 6, marginRight: 8 },
  historyText: { fontSize: 12, color: '#333' },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: 'bold' },
  jsonInput: { height: 120, textAlignVertical: 'top' },
  homeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  homeButtonText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 16,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%',
  },
  modalTitle: {
    fontWeight: 'bold', fontSize: 18, marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee',
  },
  modalActions: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 20,
  },
  cancelButton: {
    padding: 10,
  },
  confirmButton: {
    padding: 10, backgroundColor: '#10b981', borderRadius: 6,
  },
});