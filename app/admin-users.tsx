import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://myleadwell-backend.onrender.com';

const JOB_TITLES = [
  'Real Estate Agent',
  'Loan Originator',
  'Title Agent',
  'Insurance Agent',
  'Home Inspector',
];

const ROLE_OPTIONS = ['admin', 'provider', 'affiliate'];

export default function AdminUsersScreen() {
  const navigation = useNavigation(); // ✅ Add navigation hook
  const [users, setUsers] = useState<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    job_title?: string;
    roles?: string[];
    states?: string[]; // replaces state
    service_areas?: { state: string; county: string }[];
    affiliate_link?: string;
  }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | number | null>(null);
  const [editUser, setEditUser] = useState<{
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    job_title?: string;
    roles?: string[];
    states?: string[]; // replaces state
    service_areas?: { state: string; county: string }[];
    affiliate_link?: string;
  } | null>(null);
  const [newUser, setNewUser] = useState<{
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    password?: string;
    job_title?: string;
    roles: string[];
    states?: string[]; // replaces state
  } | null>(null);
  const [token, setToken] = useState('');

  const fetchUsers = async () => {
    const token = await AsyncStorage.getItem('token');
    const currentUserId = await AsyncStorage.getItem('user_id');

    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let usersList = Array.isArray(res.data) ? res.data : [];

      // Defensive normalization for each user
      usersList = usersList.map((user: any) => ({
        ...user,
        roles: Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : []),
        states: Array.isArray(user.states)
          ? user.states
          : user.states
          ? [user.states]
          : [],
        service_areas: Array.isArray(user.service_areas)
          ? user.service_areas.map((area: any) =>
              area && typeof area === 'object'
                ? {
                    state: typeof area.state === 'string' ? area.state : '',
                    county: typeof area.county === 'string' ? area.county : '',
                  }
                : { state: '', county: '' }
            )
          : [],
        affiliate_link: typeof user.affiliate_link === 'string' ? user.affiliate_link : '',
      }));

      // Add fallback for current user if not included in /admin/users
      if (
        currentUserId &&
        !usersList.find((user: { id: number }) => user.id === parseInt(currentUserId, 10))
      ) {
        const userRes = await axios.get(`${API_BASE_URL}/users/${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fallbackUser = userRes.data;
        usersList.push({
          ...fallbackUser,
          roles: Array.isArray(fallbackUser.roles)
            ? fallbackUser.roles
            : fallbackUser.roles
            ? [fallbackUser.roles]
            : [],
          states: Array.isArray(fallbackUser.states)
            ? fallbackUser.states
            : fallbackUser.states
            ? [fallbackUser.states]
            : [],
          service_areas: Array.isArray(fallbackUser.service_areas)
            ? fallbackUser.service_areas.map((area: any) =>
                area && typeof area === 'object'
                  ? {
                      state: typeof area.state === 'string' ? area.state : '',
                      county: typeof area.county === 'string' ? area.county : '',
                    }
                  : { state: '', county: '' }
              )
            : [],
          affiliate_link:
            typeof fallbackUser.affiliate_link === 'string'
              ? fallbackUser.affiliate_link
              : '',
        });
      }

      setUsers(usersList);
      console.log('👥 Users from backend:', JSON.stringify(usersList, null, 2));
    } catch (err) {
      if (err instanceof Error) {
        console.error('❌ Error loading users:', err.message);
      } else {
        console.error('❌ Error loading users:', err);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (userId: string | number) => {
    console.log('🧠 Selected user ID:', userId); // ✅ Log selected user ID
    const userIdInt = parseInt(userId as string, 10); // ✅ Cast selectedUserId to a number
    const user = users.find((u) => u.id === userIdInt); // ✅ Find user by ID
    if (!user) {
      console.warn('⚠️ No user found for selected ID:', userId); // ✅ Add fallback
      return;
    }
    console.log('🧠 User found:', user); // ✅ Log found user

    setSelectedUserId(userId);
    setEditUser({ ...user });
    setNewUser(null);
  };

  const handleSave = async () => {
    const token = await AsyncStorage.getItem('token');

    if (!token || !editUser) {
      console.error('❌ Missing token or editUser');
      return;
    }

    const payload = {
      first_name: editUser.first_name,
      last_name: editUser.last_name,
      email: editUser.email,
      phone: editUser.phone,
      roles: editUser.roles || [],
      job_title: editUser.job_title,
      states: editUser.states || [], // <-- changed from state
      service_areas: editUser.service_areas || [],
      affiliate_link: editUser.affiliate_link || '',
    };

    console.log('📤 Saving edited user:', payload);

    try {
      await axios.put(`${API_BASE_URL}/update-user/${editUser.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({ type: 'success', text1: '✅ User updated!' });
      setSelectedUserId(''); // Reset selection
      setEditUser(null); // Clear edit form
      fetchUsers(); // Re-fetch all users
    } catch (error) {
      console.error('❌ Error saving user:', error);
      Toast.show({ type: 'error', text1: 'Failed to save user.' });
    }
};

  const handleCreate = async () => {
    const token = await AsyncStorage.getItem('token');

    if (!newUser?.password || !newUser?.roles?.length) {
      Toast.show({ type: 'error', text1: 'Missing password or role' });
      return;
    }

    try {
      console.log('📤 Creating user with:', newUser);

      const payload = {
        ...newUser,
        states: newUser.states || [], // <-- changed from state
      };

      await axios.post(`${API_BASE_URL}/create-user`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({ type: 'success', text1: '✅ User created successfully' });

      await fetchUsers();      // ✅ Force refresh of the dropdown
      setNewUser(null);        // ✅ Close modal
      setSelectedUserId(null); // ✅ Reset form
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('❌ Error creating user:', err.response?.data || err.message);
      } else {
        console.error('❌ Error creating user:', err);
      }
      Toast.show({ type: 'error', text1: '❌ Failed to create user' });
    }
  };

  console.log('🔍 editUser:', editUser);

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
        onPress={() => (navigation as any).navigate('HomeScreen')}
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
      <Text style={styles.header}>Admin: Manage Users</Text>

      <Picker
        selectedValue={String(selectedUserId)} // ✅ Force selectedValue to string
        onValueChange={(value) => {
          setSelectedUserId(String(value));
          handleEdit(value); // ✅ Trigger user loading for edit form
        }}
      >
        {users.map((user) => (
          <Picker.Item
            key={user.id}
            label={`${user.first_name} ${user.last_name} (${user.email})`}
            value={String(user.id)} // ✅ Force value to string
          />
        ))}
      </Picker>
      <Text>Total Users: {users.length}</Text> {/* ✅ Display total users */}

      {editUser && (
        <View style={styles.editor}>
          <Text style={styles.subheader}>Edit User</Text>
          <View style={styles.row}>
            <Text style={styles.label}>First Name:</Text>
            <TextInput
              value={editUser.first_name}
              onChangeText={(text) => setEditUser({ ...editUser, first_name: text })}
              style={styles.input}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Last Name:</Text>
            <TextInput
              value={editUser.last_name}
              onChangeText={(text) => setEditUser({ ...editUser, last_name: text })}
              style={styles.input}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <TextInput
              value={editUser.email || ''}
              onChangeText={(text) => setEditUser({ ...editUser, email: text })}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <TextInput
              value={editUser.phone}
              onChangeText={(text) => setEditUser({ ...editUser, phone: text })}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>
          <Picker
            selectedValue={editUser.job_title}
            onValueChange={(value) => setEditUser({ ...editUser, job_title: value })}
          >
            <Picker.Item label="Select Job Title" value="" />
            {JOB_TITLES.map((title) => (
              <Picker.Item key={title} label={title} value={title} />
            ))}
          </Picker>

          <Text style={styles.sub}>Roles:</Text>
          {ROLE_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => {
                const has = editUser.roles?.includes(r);
                const updated = has
                  ? (editUser.roles || []).filter((role) => role !== r)
                  : [...(editUser.roles || []), r];
                setEditUser({ ...editUser, roles: updated });
              }}
              style={[
                styles.roleBtn,
                { backgroundColor: editUser.roles?.includes(r) ? '#28a745' : '#ccc' },
              ]}
            >
              <Text style={{ color: '#fff' }}>{r}</Text>
            </TouchableOpacity>
          ))}

          {Array.isArray(editUser?.service_areas) && editUser.service_areas.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>Service Areas:</Text>
              {editUser.service_areas.map((area, idx) =>
                area && typeof area === 'object' ? (
                  <Text key={idx} style={{ marginLeft: 8 }}>
                    {area.county || ''}, {area.state || ''}
                  </Text>
                ) : null
              )}
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>States (comma separated):</Text>
            <TextInput
              value={editUser.states?.join(', ') || ''}
              onChangeText={(text) =>
                setEditUser({ ...editUser, states: text.split(',').map(s => s.trim()).filter(Boolean) })
              }
              style={styles.input}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => {
                console.log('🔘 Save button pressed'); // ✅ Log button press
                handleSave();
              }}
              style={styles.saveBtn}
            >
              <Text style={{ color: '#fff' }}>💾 Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEditUser(null); setSelectedUserId(null); }} style={[styles.saveBtn, { backgroundColor: '#6c757d' }]}>
              <Text style={{ color: '#fff' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!newUser && (
        <TouchableOpacity
          onPress={() => { setNewUser({ roles: [] }); setEditUser(null); setSelectedUserId(null); }}
          style={[styles.saveBtn, { backgroundColor: '#17a2b8', marginTop: 20 }]}
        >
          <Text style={{ color: '#fff' }}>➕ Add New User</Text>
        </TouchableOpacity>
      )}

      {newUser && (
        <View style={styles.editor}>
          <Text style={styles.subheader}>Add New User</Text>
          <View style={styles.row}>
            <Text style={styles.label}>First Name:</Text>
            <TextInput
              value={newUser.first_name || ''}
              onChangeText={(text) => setNewUser((u) => ({ ...u, roles: u?.roles || [], first_name: text }))}
              style={styles.input}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Last Name:</Text>
            <TextInput
              value={newUser.last_name || ''}
              onChangeText={(text) => setNewUser((u) => ({ ...u, roles: u?.roles || [], last_name: text }))}
              style={styles.input}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <TextInput
              value={newUser.email || ''}
              onChangeText={(text) => setNewUser((u) => ({ ...u, roles: u?.roles || [], email: text }))}
              style={styles.input}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <TextInput
              value={newUser.phone || ''}
              onChangeText={(text) => setNewUser((u) => ({ ...u, roles: u?.roles || [], phone: text }))}
              style={styles.input}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={newUser.password || ''}
            onChangeText={(text) => setNewUser((u) => ({ ...u, roles: u?.roles || [], password: text }))}
          />
          <Picker
            selectedValue={newUser.job_title || ''}
            onValueChange={(value) => setNewUser((u) => ({ ...u, roles: u?.roles || [], job_title: value }))}
          >
            <Picker.Item label="Select Job Title" value="" />
            {JOB_TITLES.map((title) => (
              <Picker.Item key={title} label={title} value={title} />
            ))}
          </Picker>

          <Text style={styles.sub}>Roles:</Text>
          {ROLE_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => {
                const has = newUser.roles?.includes(r);
                const updated = has
                  ? newUser.roles.filter((role) => role !== r)
                  : [...(newUser.roles || []), r];
                setNewUser((u) => ({ ...u, roles: updated }));
              }}
              style={[
                styles.roleBtn,
                { backgroundColor: newUser.roles?.includes(r) ? '#28a745' : '#ccc' },
              ]}
            >
              <Text style={{ color: '#fff' }}>{r}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.row}>
            <Text style={styles.label}>States (comma separated):</Text>
            <TextInput
              value={newUser.states?.join(', ') || ''}
              onChangeText={(text) =>
                setNewUser((u) => ({
                  ...u,
                  roles: u?.roles || [],
                  states: text.split(',').map(s => s.trim()).filter(Boolean),
                }))
              }
              style={styles.input}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={handleCreate} style={styles.saveBtn}>
              <Text style={{ color: '#fff' }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNewUser(null)} style={[styles.saveBtn, { backgroundColor: '#6c757d' }]}>
              <Text style={{ color: '#fff' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subheader: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  sub: { color: '#555', marginTop: 10 },
  editor: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 6,
    marginTop: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#fff',
  },
  roleBtn: {
    padding: 6,
    marginVertical: 4,
    borderRadius: 4,
  },
  saveBtn: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
});
