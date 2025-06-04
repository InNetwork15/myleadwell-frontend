import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Ensure axios is imported
import './LeadsDashboard.css';

function LeadsDashboard({ token }) {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        const fetchLeads = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log('Fetching leads with token:', token); // Debugging log
                const response = await axios.get('${apiBaseUrl}/admin/leads', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log('API response:', response.data); // Debugging log
                setLeads(response.data);
            } catch (error) {
                console.error('Error fetching leads:', error); // Log error for debugging
                setError(error.response?.data?.message || 'Failed to fetch leads.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchLeads();
        } else {
            console.warn('Token is missing. Leads cannot be fetched.'); // Warn if token is missing
        }
    }, [token]);

    const filteredLeads = leads.filter((lead) => {
        const matchText = `${lead.name} ${lead.email} ${lead.services}`.toLowerCase();
        const matchesSearch = matchText.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter ? lead.status === statusFilter : true;
        console.log('Filtering lead:', lead, 'Matches search:', matchesSearch, 'Matches status:', matchesStatus); // Debugging log
        return matchesSearch && matchesStatus;
    });

    const downloadCSV = () => {
        if (!filteredLeads.length) return;
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Services', 'Status', 'Submitted'];
        const rows = filteredLeads.map((lead) => [
            lead.id,
            lead.name,
            lead.email,
            lead.phone,
            lead.services,
            lead.status,
            new Date(lead.created_at).toLocaleString()
        ]);

        const csvContent = [headers, ...rows].map(row => row.map(String).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'leads.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="dashboard-container">
            <h2>
                <span role="img" aria-label="All Submitted Leads">📋</span> All Submitted Leads
            </h2>

            <div className="filters">
                <input
                    type="text"
                    placeholder="Search by name, email, or service"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                </select>
                <button onClick={downloadCSV} className="csv-button">
                    <span role="img" aria-label="Download CSV">📥</span> Download CSV
                </button>
            </div>

            {loading && <p className="loading">Loading leads...</p>}
            {error && <p className="error"><span role="img" aria-label="Error">❌</span> {error}</p>}
            {!loading && !leads.length && !error && (
                <p className="no-leads">No leads available to display.</p> // Fallback message
            )}
            {!loading && leads.length > 0 && (
                <p className="summary">Total Leads: {filteredLeads.length}</p>
            )}

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Lead Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Services</th>
                        <th>Status</th>
                        <th>Submitted</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredLeads.map((lead) => (
                        <tr key={lead.id}>
                            <td>{lead.id}</td>
                            <td>{lead.name}</td>
                            <td>{lead.email}</td>
                            <td>{lead.phone}</td>
                            <td>{lead.services}</td>
                            <td>{lead.status}</td>
                            <td>{new Date(lead.created_at).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default LeadsDashboard;
