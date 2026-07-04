'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UsersRound, Star, Megaphone, Calendar, Upload, Settings, User, GraduationCap, Edit, Trash2, ArrowLeft, Save, Pencil, Building, FileText, Image, BarChart3 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import ImageCropper from '../../components/ImageCropper';
import AttachmentUploader from '../../components/AttachmentUploader';
import AttachmentViewer from '../../components/AttachmentViewer';
import ExpirySelector, { getExpiryLabel, calculateExpiryDate } from '../../components/ExpirySelector';
import PollCreator from '../../components/PollCreator';
import PollDisplay from '../../components/PollDisplay';

const DEPARTMENTS = [
  'Computer Engineering',
  'Software Engineering',
  'Information Technology',
  'Artificial Intelligence & Machine Learning',
  'Data Science',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering'
];

// ─── Admin Dashboard Overview ──────────────────────────────────────
function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [usersRes, groupsRes, clubsRes] = await Promise.all([
        fetch('/api/users?status=active'),
        fetch('/api/groups'),
        fetch('/api/clubs'),
      ]);
      const users = await usersRes.json();
      const groups = await groupsRes.json();
      const clubs = await clubsRes.json();

      setStats({
        totalStudents: users.filter(u => u.role === 'student').length,
        totalFaculty: users.filter(u => u.role === 'faculty').length,
        activeGroups: groups.length,
        activeClubs: clubs.length,
        blockedUsers: 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="module-section">
        <div className="dashboard-loading"><div className="spinner-large"></div><p>Loading dashboard...</p></div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: <GraduationCap size={28} />, color: '#3b82f6' },
    { label: 'Total Faculty', value: stats?.totalFaculty || 0, icon: <User size={28} />, color: '#8b5cf6' },
    { label: 'Active Groups', value: stats?.activeGroups || 0, icon: <UsersRound size={28} />, color: '#10b981' },
    { label: 'Active Clubs', value: stats?.activeClubs || 0, icon: <Star size={28} />, color: '#f59e0b' },
  ];

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title">
          MIT Academy of Engineering
        </h2>
      </div>

      <div className="admin-stats-grid">
        {cards.map((card) => (
          <div key={card.label} className="admin-stat-card" style={{ borderLeftColor: card.color }}>
            <div className="admin-stat-icon">{card.icon}</div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{card.value}</span>
              <span className="admin-stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hero-banner" style={{ backgroundImage: "url('/assets/hero_banner.png')" }}>
        <div className="hero-banner-content">
          <h1 className="hero-banner-title">Engineering the Future<br />of Technology</h1>
          <p className="hero-banner-desc">
            Centralized administrative control panel for the MIT Academy of Engineering division. 
            Manage students, faculty, and academic entities with institutional precision.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── User Management ───────────────────────────────────────────────
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [editingUser, setEditingUser] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, deptFilter, statusFilter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (deptFilter) params.set('department', deptFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBlock(userId, action) {
    try {
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        setToast(`User ${action}ed successfully`);
        fetchUsers();
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(userId) {
    if (!confirm('Are you sure you want to delete this user? This action can be reversed by admin.')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setToast('User deleted successfully');
        fetchUsers();
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editingUser.fullName,
          email: editingUser.email,
          department: editingUser.department,
          prn: editingUser.prn,
          designation: editingUser.designation
        }),
      });
      if (res.ok) {
        setToast('User updated successfully');
        setEditingUser(null);
        fetchUsers();
        setTimeout(() => setToast(''), 3000);
      } else {
        const data = await res.json();
        setToast(`Error: ${data.error}`);
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setToast('Failed to update user');
      setTimeout(() => setToast(''), 3000);
    }
  }

  const handleSearch = () => {
    fetchUsers();
  };

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><UsersRound size={24} /> User Management</h2>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}

      {editingUser ? (
        <form className="admin-form card" onSubmit={handleUpdateUser} style={{ marginBottom: '2rem' }}>
          <div className="module-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <h3>Edit User: {editingUser.fullName}</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={editingUser.fullName || ''} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={editingUser.department || ''}
                onChange={e => setEditingUser({...editingUser, department: e.target.value})}
                required
              >
                <option value="" disabled>Select Department</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            {editingUser.role === 'student' && (
              <div className="form-group">
                <label className="form-label">PRN</label>
                <input className="form-input" value={editingUser.prn || ''} onChange={e => setEditingUser({...editingUser, prn: e.target.value})} required />
              </div>
            )}
            {editingUser.role === 'faculty' && (
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-input" value={editingUser.designation || ''} onChange={e => setEditingUser({...editingUser, designation: e.target.value})} />
              </div>
            )}
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" type="submit">Save Changes</button>
          </div>
        </form>
      ) : (
        <>
          <div className="admin-filters">
            <div className="search-bar">
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, email, or PRN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
            </div>
            <div className="filter-row">
              <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
              </select>
              <select className="form-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="deleted">Deleted</option>
                <option value="">All Statuses</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading"><div className="spinner-large"></div></div>
          ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} color="#94a3b8" />
                        </div>
                      )}
                      {user.fullName}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-badge-${user.role}`}>{user.role}</span>
                  </td>
                  <td>{user.department || '—'}</td>
                  <td>
                    <span className={`status-badge status-${user.status}`}>{user.status}</span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-sm btn-primary" onClick={() => setEditingUser(user)}>
                        Edit
                      </button>
                      {user.status === 'active' && (
                        <button className="btn btn-sm btn-warning" onClick={() => handleBlock(user._id, 'block')}>
                          Block
                        </button>
                      )}
                      {user.status === 'blocked' && (
                        <button className="btn btn-sm btn-success" onClick={() => handleBlock(user._id, 'unblock')}>
                          Unblock
                        </button>
                      )}
                      {user.status !== 'deleted' && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user._id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}
    </div>
  );
}

// ─── Load Data / Provisioning ──────────────────────────────────────
function LoadData() {
  const [mode, setMode] = useState('manual');
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ fullName: '', email: '', prn: '', department: '', semester: '', designation: '' });
  const [bulkData, setBulkData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState('');

  async function handleManualSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();

      if (res.ok) {
        setToast(`${role === 'student' ? 'Student' : 'Faculty'} account created successfully`);
        setForm({ fullName: '', email: '', prn: '', department: '', semester: '', designation: '' });
        setTimeout(() => setToast(''), 3000);
      } else {
        setToast(`Error: ${data.error}`);
        setTimeout(() => setToast(''), 5000);
      }
    } catch (err) {
      setToast('Failed to create account');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkUpload() {
    if (bulkData.length === 0) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/load-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: bulkData, role }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ message: 'Upload failed', created: 0, skipped: 0, errors: [{ error: err.message }] });
    } finally {
      setLoading(false);
    }
  }

  const [parseError, setParseError] = useState('');

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) {
      setBulkData([]);
      setParseError('');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setParseError('Please upload a valid .csv file (Excel files must be saved as CSV).');
      setBulkData([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      
      if (lines.length < 2) {
        setParseError('The CSV file appears to be empty or missing data rows.');
        setBulkData([]);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => {
          if (h.includes('name')) row.fullName = values[idx];
          else if (h === 'prn' || h.includes('registration') || h.includes('roll')) row.prn = values[idx];
          else if (h.includes('email')) row.email = values[idx];
          else if (h.includes('department') || h === 'dept' || h.includes('branch')) row.department = values[idx];
          else if (h.includes('semester') || h === 'sem') row.semester = values[idx];
          else if (h.includes('designation') || h === 'role') row.designation = values[idx];
        });
        
        // At least name and email are required for any user
        if (row.fullName && row.email) {
          parsed.push(row);
        }
      }
      
      if (parsed.length === 0) {
        setParseError('No valid records found. Please ensure your CSV has clear "Name" and "Email" columns.');
      } else {
        setParseError('');
      }
      
      setBulkData(parsed);
    };
    reader.readAsText(file);
  }

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><Upload size={24} /> Load Data — Account Provisioning</h2>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}

      <div className="admin-tabs-row">
        <button className={`admin-tab ${mode === 'manual' ? 'admin-tab-active' : ''}`} onClick={() => setMode('manual')}>
          Manual Entry
        </button>
        <button className={`admin-tab ${mode === 'bulk' ? 'admin-tab-active' : ''}`} onClick={() => setMode('bulk')}>
          Bulk Upload
        </button>
      </div>

      <div className="admin-role-selector">
        <label>Account Type:</label>
        <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>
      </div>

      {mode === 'manual' ? (
        <form className="admin-form" onSubmit={handleManualSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
              >
                <option value="" disabled>Select Department</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            {role === 'student' && (
              <>
                <div className="form-group">
                  <label className="form-label">PRN *</label>
                  <input className="form-input" value={form.prn} onChange={(e) => setForm({ ...form, prn: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-select" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}
            {role === 'faculty' && (
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </div>
            )}
          </div>
          <p className="form-help-text">
            Default password: {role === 'student' ? 'PRN number' : 'Email address'}
          </p>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      ) : (
        <div className="admin-bulk-upload">
          <div className="upload-instructions">
            <h4>Upload a CSV file with the following columns:</h4>
            {role === 'student' ? (
              <p><strong>Name, PRN, Email, Department, Semester</strong></p>
            ) : (
              <p><strong>Name, Email, Department, Designation</strong></p>
            )}
          </div>
          <input
            type="file"
            accept=".csv"
            className="form-input"
            onChange={handleFileChange}
          />
          {parseError && (
            <div className="auth-error" style={{ marginTop: '1rem', color: 'red' }}>
              <strong>Error:</strong> {parseError}
            </div>
          )}
          {bulkData.length > 0 && (
            <div className="bulk-preview">
              <p>{bulkData.length} records parsed. Ready to upload.</p>
              <button className="btn btn-primary" onClick={handleBulkUpload} disabled={loading}>
                {loading ? 'Uploading...' : `Upload ${bulkData.length} Records`}
              </button>
            </div>
          )}
          {result && (
            <div className="bulk-result">
              <h4>Upload Summary</h4>
              <p><span style={{ color: 'var(--success)' }}>✔</span> Created: {result.created}</p>
              <p><span style={{ color: 'var(--warning)' }}>⏭</span> Skipped: {result.skipped}</p>
              {result.errors?.length > 0 && (
                <div className="bulk-errors">
                  <h5>Errors:</h5>
                  {result.errors.map((e, i) => (
                    <p key={i}>Row {e.row}: {e.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Group Management ──────────────────────────────────────────────
function GroupManagement() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', messagingMode: 'open' });
  const [allUsers, setAllUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [toast, setToast] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [prnStart, setPrnStart] = useState('');
  const [prnEnd, setPrnEnd] = useState('');

  // detail view states
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [msgAttachments, setMsgAttachments] = useState([]);
  const [msgExpiry, setMsgExpiry] = useState('never');
  const [showPoll, setShowPoll] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''], multiSelect: false });

  // edit mode states
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [editAddMembers, setEditAddMembers] = useState([]);
  const [editRemoveMembers, setEditRemoveMembers] = useState([]);
  const [editMemberSearch, setEditMemberSearch] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchAllUsers();
  }, []);

  async function fetchGroups() {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllUsers() {
    try {
      const res = await fetch('/api/users?status=active');
      const data = await res.json();
      setAllUsers(data.filter(u => u.role !== 'admin'));
    } catch (err) {
      console.error(err);
    }
  }

  async function openGroup(group) {
    setSelectedGroup(group);
    setEditMode(false);
    setEditAddMembers([]);
    setEditRemoveMembers([]);
    setEditMemberSearch('');
    try {
      const res = await fetch(`/api/groups/${group._id}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (err) { console.error(err); }
  }

  async function sendMessage() {
    if (!newMessage.trim() && msgAttachments.length === 0 && (!showPoll || !pollData.question)) return;
    if (!selectedGroup) return;
    try {
      const body = { content: newMessage };
      if (msgAttachments.length > 0) body.attachments = msgAttachments;
      if (msgExpiry !== 'never') {
        const { calculateExpiryDate } = await import('../../components/ExpirySelector');
        body.expiresAt = calculateExpiryDate(msgExpiry);
      }
      if (showPoll && pollData.question && pollData.options.filter(o => o.trim()).length >= 2) {
        body.poll = pollData;
      }
      const res = await fetch(`/api/groups/${selectedGroup._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data]);
        setNewMessage('');
        setMsgAttachments([]);
        setMsgExpiry('never');
        setShowPoll(false);
        setPollData({ question: '', options: ['', ''], multiSelect: false });
      }
    } catch (err) { console.error(err); }
  }

  async function deleteMessage(msgId) {
    if (!confirm('Delete this message?')) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroup._id}/messages?messageId=${msgId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(messages.filter(m => m._id !== msgId));
        setToast('Message deleted');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
  }

  async function handleGroupVote(msgId, optionId) {
    try {
      const res = await fetch(`/api/groups/${selectedGroup._id}/messages/${msgId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages(prev => prev.map(m => m._id === updated._id ? updated : m));
      }
    } catch (err) { console.error(err); }
  }

  async function toggleLead(group, memberId, isLead) {
    try {
      const body = isLead ? { groupId: group._id, revokeLeadUserId: memberId } : { groupId: group._id, leadUserId: memberId };
      await fetch('/api/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setToast(isLead ? 'Lead revoked' : 'Lead nominated');
      fetchGroups();
      
      const updatedGroup = { ...group };
      const member = updatedGroup.members.find(m => m.userId?._id === memberId);
      if (member) member.isLead = !isLead;
      setSelectedGroup(updatedGroup);

      setTimeout(() => setToast(''), 3000);
    } catch (err) { console.error(err); }
  }

  async function changeMode(group, mode) {
    try {
      await fetch('/api/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: group._id, messagingMode: mode }),
      });
      setToast(`Messaging mode changed to ${mode}`);
      fetchGroups();
      setTimeout(() => setToast(''), 3000);
    } catch (err) { console.error(err); }
  }

  // ─── Create Group ───
  async function handleCreate(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, memberIds: selectedMembers }),
      });
      if (res.ok) {
        setToast('Group created successfully');
        setShowCreate(false);
        setForm({ name: '', description: '', messagingMode: 'open' });
        setSelectedMembers([]);
        setMemberSearch('');
        setPrnStart('');
        setPrnEnd('');
        fetchGroups();
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Select All / Deselect All for create form
  function handleSelectAll(filteredUsers) {
    const allFilteredIds = filteredUsers.map(u => u._id);
    const allSelected = allFilteredIds.every(id => selectedMembers.includes(id));
    if (allSelected) {
      setSelectedMembers(selectedMembers.filter(id => !allFilteredIds.includes(id)));
    } else {
      const newSelection = [...new Set([...selectedMembers, ...allFilteredIds])];
      setSelectedMembers(newSelection);
    }
  }

  // PRN Range selection
  function handlePrnRange() {
    if (!prnStart && !prnEnd) return;
    const matchingIds = allUsers
      .filter(u => {
        if (u.role !== 'student' || !u.prn) return false;
        const prn = u.prn.toLowerCase();
        const start = prnStart.toLowerCase();
        const end = prnEnd.toLowerCase();
        if (start && end) return prn >= start && prn <= end;
        if (start) return prn >= start;
        if (end) return prn <= end;
        return false;
      })
      .map(u => u._id);
    const newSelection = [...new Set([...selectedMembers, ...matchingIds])];
    setSelectedMembers(newSelection);
    setToast(`${matchingIds.length} student(s) selected by PRN range`);
    setTimeout(() => setToast(''), 3000);
  }

  // ─── Edit Group ───
  function startEdit() {
    setEditMode(true);
    setEditForm({
      name: selectedGroup.name || '',
      description: selectedGroup.description || '',
    });
    setEditAddMembers([]);
    setEditRemoveMembers([]);
    setEditMemberSearch('');
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditSaving(true);
    try {
      const body = {
        groupId: selectedGroup._id,
        name: editForm.name,
        description: editForm.description,
      };
      if (editAddMembers.length > 0) body.addMemberIds = editAddMembers;
      if (editRemoveMembers.length > 0) body.removeMemberIds = editRemoveMembers;

      const res = await fetch('/api/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedGroup(updated);
        setEditMode(false);
        setEditAddMembers([]);
        setEditRemoveMembers([]);
        setToast('Group updated successfully');
        fetchGroups();
        setTimeout(() => setToast(''), 3000);
      } else {
        const err = await res.json();
        setToast(`Error: ${err.error}`);
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setToast('Failed to update group');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(groupId) {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      const res = await fetch(`/api/groups?id=${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        setToast('Group deleted');
        fetchGroups();
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ─── Detail / Manage View ───
  if (selectedGroup) {
    const currentMemberIds = (selectedGroup.members || []).map(m => m.userId?._id || m.userId).filter(Boolean);
    const nonMembers = allUsers.filter(u => !currentMemberIds.includes(u._id));
    const filteredNonMembers = nonMembers.filter(u => {
      if (!editMemberSearch) return true;
      const q = editMemberSearch.toLowerCase();
      return (u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.prn?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q));
    });

    return (
      <div className="module-section">
        <div className="module-header">
          <button className="btn btn-secondary" onClick={() => { setSelectedGroup(null); setEditMode(false); }}>← Back</button>
          <h2 className="module-title">{selectedGroup.name}</h2>
          {!editMode && (
            <button className="btn btn-primary" onClick={startEdit}>✏️ Edit Group</button>
          )}
        </div>

        {toast && <div className="toast toast-success">{toast}</div>}

        {/* ── Edit Mode ── */}
        {editMode ? (
          <form className="admin-form card edit-group-form" onSubmit={handleSaveEdit}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)' }}>Edit Group Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Group Name *</label>
                <input className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
            </div>

            {/* Current Members with Remove */}
            <div className="form-group">
              <label className="form-label">Current Members ({selectedGroup.members?.length || 0})</label>
              <div className="member-checklist">
                {selectedGroup.members?.map(m => (
                  <label key={m.userId?._id || m._id} className={`member-check-item ${editRemoveMembers.includes(m.userId?._id) ? 'member-removing' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!editRemoveMembers.includes(m.userId?._id)}
                      onChange={(e) => {
                        const id = m.userId?._id;
                        if (!e.target.checked) setEditRemoveMembers([...editRemoveMembers, id]);
                        else setEditRemoveMembers(editRemoveMembers.filter(rid => rid !== id));
                      }}
                    />
                    <span>{m.userId?.fullName || 'Unknown'} ({m.role}){m.isLead ? ' ⭐ Lead' : ''}</span>
                    {editRemoveMembers.includes(m.userId?._id) && <span className="remove-tag">Will be removed</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* Add New Members */}
            <div className="form-group">
              <label className="form-label">Add New Members</label>
              <input
                className="form-input"
                placeholder="Search by name, email, PRN, or role..."
                value={editMemberSearch}
                onChange={(e) => setEditMemberSearch(e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <div className="member-checklist">
                {filteredNonMembers.length === 0 && <p className="empty-state">No users available to add</p>}
                {filteredNonMembers.map(u => (
                  <label key={u._id} className="member-check-item">
                    <input
                      type="checkbox"
                      checked={editAddMembers.includes(u._id)}
                      onChange={(e) => {
                        if (e.target.checked) setEditAddMembers([...editAddMembers, u._id]);
                        else setEditAddMembers(editAddMembers.filter(id => id !== u._id));
                      }}
                    />
                    <span>{u.fullName} ({u.role}){u.prn ? ` — PRN: ${u.prn}` : ''} — {u.department || 'N/A'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="edit-group-actions">
              <button className="btn btn-primary" type="submit" disabled={editSaving}>
                {editSaving ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            {/* Normal Manage View — Messages */}
            <div className="group-messages">
              {messages.map(msg => (
                <div key={msg._id} className={`message-bubble ${msg.senderId?._id === session?.user?.id ? 'message-own' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="message-sender">{msg.senderId?.fullName || 'Unknown'}</span>
                    <button className="announcement-delete-btn" onClick={() => deleteMessage(msg._id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {msg.content && <p>{msg.content}</p>}
                  <AttachmentViewer attachments={msg.attachments} />
                  {msg.poll && (
                    <PollDisplay
                      poll={msg.poll}
                      userId={session?.user?.id}
                      onVote={(optionId) => handleGroupVote(msg._id, optionId)}
                    />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="message-time">{new Date(msg.sentAt || msg.createdAt).toLocaleString()}</span>
                    {msg.expiresAt && <span className="expiry-badge">{getExpiryLabel(msg.expiresAt)}</span>}
                  </div>
                </div>
              ))}
              {messages.length === 0 && <p className="empty-state">No messages yet</p>}
            </div>

            <div className="admin-form card">
              {msgAttachments.length > 0 && (
                <div className="attachment-preview-grid" style={{ marginBottom: '0.5rem' }}>
                  {msgAttachments.map((att, idx) => (
                    <div key={idx} className="attachment-preview-item">
                      {att.type === 'image' ? (
                        <img src={att.data} alt={att.name} className="attachment-preview-img" />
                      ) : (
                        <div className="attachment-preview-icon"><FileText size={20} /></div>
                      )}
                      <span className="attachment-preview-name">{att.name.length > 15 ? att.name.slice(0, 12) + '...' : att.name}</span>
                      <button type="button" className="attachment-remove-btn" onClick={() => setMsgAttachments(prev => prev.filter((_, i) => i !== idx))}>
                        <span style={{ fontSize: '12px', lineHeight: 1 }}>×</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showPoll && <PollCreator poll={pollData} onChange={setPollData} />}
              <div className="message-input-row" style={{ alignItems: 'flex-end' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', color: 'var(--text-muted)' }}>
                  <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.zip" style={{ display: 'none' }} onChange={(e) => {
                    Array.from(e.target.files).forEach(file => {
                      if (file.size > 5 * 1024 * 1024) return;
                      const reader = new FileReader();
                      reader.onload = () => setMsgAttachments(prev => [...prev, { name: file.name, type: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file', mimeType: file.type, data: reader.result }]);
                      reader.readAsDataURL(file);
                    });
                    e.target.value = null;
                  }} />
                  <FileText size={20} />
                </label>
                <textarea
                  className="form-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  placeholder="Type a message as Admin..."
                  rows={1}
                  style={{ resize: 'none', overflow: 'hidden', minHeight: '40px', padding: '0.6rem' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <ExpirySelector value={msgExpiry} onChange={setMsgExpiry} compact />
                <button className={`btn btn-sm ${showPoll ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setShowPoll(!showPoll)} style={{ marginLeft: '0.5rem' }}>
                  <BarChart3 size={16} />
                </button>
                <button className="btn btn-primary" onClick={sendMessage}>Send</button>
              </div>
            </div>

            <div className="group-members-section">
              <h4>Members ({selectedGroup.members?.length || 0})</h4>
              <div className="member-list">
                {selectedGroup.members?.map(m => (
                  <div key={m.userId?._id || m._id} className="member-item">
                    <span>{m.userId?.fullName || 'Unknown'} ({m.role})</span>
                    {m.isLead && <span className="lead-badge">CR / Lead</span>}
                    {m.role === 'student' && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => toggleLead(selectedGroup, m.userId?._id, m.isLead)}
                      >
                        {m.isLead ? 'Revoke Lead' : 'Make Lead'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── Create Form Filtered Users ───
  const filteredCreateUsers = allUsers.filter(u => {
    if (!memberSearch) return true;
    const q = memberSearch.toLowerCase();
    return (u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.prn?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q));
  });
  const allFilteredSelected = filteredCreateUsers.length > 0 && filteredCreateUsers.every(u => selectedMembers.includes(u._id));

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><UsersRound size={24} /> Group Management</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Create Group'}
        </button>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}

      {showCreate && (
        <form className="admin-form card" onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Group Name *</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Messaging Mode</label>
              <select className="form-select" value={form.messagingMode} onChange={(e) => setForm({ ...form, messagingMode: e.target.value })}>
                <option value="open">Open (All members)</option>
                <option value="restricted">Restricted (Faculty + Leads only)</option>
              </select>
            </div>
          </div>

          {/* PRN Range Selection */}
          <div className="prn-range-section">
            <label className="form-label">📋 PRN Range — Auto-select students by PRN</label>
            <div className="prn-range-row">
              <input className="form-input" placeholder="PRN Start (e.g. 2023001)" value={prnStart} onChange={(e) => setPrnStart(e.target.value)} />
              <span className="prn-range-separator">to</span>
              <input className="form-input" placeholder="PRN End (e.g. 2023060)" value={prnEnd} onChange={(e) => setPrnEnd(e.target.value)} />
              <button type="button" className="btn btn-secondary" onClick={handlePrnRange}>Apply Range</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Add Members</label>
            <input
              className="form-input"
              placeholder="Search by name, email, PRN, or role..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              style={{ marginBottom: '8px' }}
            />
            <div className="select-all-row">
              <label className="member-check-item select-all-item">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={() => handleSelectAll(filteredCreateUsers)}
                />
                <span><strong>Select All</strong> ({filteredCreateUsers.length} users{memberSearch ? ' matching filter' : ''})</span>
              </label>
              <span className="selected-count">{selectedMembers.length} selected</span>
            </div>
            <div className="member-checklist">
              {filteredCreateUsers.map(u => (
                <label key={u._id} className="member-check-item">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(u._id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedMembers([...selectedMembers, u._id]);
                      else setSelectedMembers(selectedMembers.filter(id => id !== u._id));
                    }}
                  />
                  <span>{u.fullName} ({u.role}){u.prn ? ` — PRN: ${u.prn}` : ''} — {u.department || 'N/A'}</span>
                </label>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" type="submit">Create Group</button>
        </form>
      )}

      {loading ? (
        <div className="dashboard-loading"><div className="spinner-large"></div></div>
      ) : (
        <div className="admin-cards-grid">
          {groups.map(group => (
            <div key={group._id} className="admin-card">
              <div className="admin-card-header">
                <h3>{group.name}</h3>
                <span className={`mode-badge mode-${group.messagingMode}`}>{group.messagingMode}</span>
              </div>
              {group.description && <p className="admin-card-desc">{group.description}</p>}
              <div className="admin-card-meta">
                <span><UsersRound size={14} className="inline-icon" /> {group.members?.length || 0} members</span>
                <span>📅 {new Date(group.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="admin-card-actions">
                <select
                  className="form-select form-select-sm"
                  style={{ marginRight: '8px' }}
                  value={group.messagingMode}
                  onChange={(e) => changeMode(group, e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="restricted">Restricted</option>
                </select>
                <button className="btn btn-sm btn-secondary" onClick={() => openGroup(group)}>
                  <Settings size={14} /> Manage
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(group._id)}>Delete</button>
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="empty-state">No groups created yet</p>}
        </div>
      )}
    </div>
  );
}

// ─── Club Management ───────────────────────────────────────────────
function ClubManagement() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState('');
  const [selectedLead, setSelectedLead] = useState('');
  const [toast, setToast] = useState('');

  // detail view states
  const [selectedClub, setSelectedClub] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postAttachments, setPostAttachments] = useState([]);
  const [postExpiry, setPostExpiry] = useState('never');
  const [showPoll, setShowPoll] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''], multiSelect: false });

  useEffect(() => {
    fetchClubs();
    fetchUsers();
  }, []);

  async function fetchClubs() {
    try {
      const res = await fetch('/api/clubs');
      const data = await res.json();
      setClubs(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users?status=active');
      const data = await res.json();
      setFaculty(data.filter(u => u.role === 'faculty'));
      setStudents(data.filter(u => u.role === 'student'));
    } catch (err) { console.error(err); }
  }

  async function openClub(club) {
    setSelectedClub(club);
    try {
      const res = await fetch(`/api/announcements?scope=club&clubId=${club._id}`);
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) { console.error(err); }
  }

  async function handlePost(e) {
    e.preventDefault();
    try {
      const body = { title: postTitle, content: postContent, scope: 'club', clubId: selectedClub._id };
      if (postAttachments.length > 0) body.attachments = postAttachments;
      if (postExpiry !== 'never') {
        const { calculateExpiryDate } = await import('../../components/ExpirySelector');
        body.expiresAt = calculateExpiryDate(postExpiry);
      }
      if (showPoll && pollData.question && pollData.options.filter(o => o.trim()).length >= 2) {
        body.poll = pollData;
      }
      await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setToast('Announcement posted');
      setPostTitle('');
      setPostContent('');
      setPostAttachments([]);
      setPostExpiry('never');
      setShowPoll(false);
      setPollData({ question: '', options: ['', ''], multiSelect: false });
      openClub(selectedClub);
      setTimeout(() => setToast(''), 3000);
    } catch (err) { console.error(err); }
  }

  async function handleDeleteAnnouncement(annId) {
    if (!confirm('Delete this announcement?')) return;
    try {
      const res = await fetch(`/api/announcements?id=${annId}`, { method: 'DELETE' });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a._id !== annId));
        setToast('Announcement deleted');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
  }

  async function handleClubVote(annId, optionId) {
    try {
      const res = await fetch(`/api/announcements/${annId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAnnouncements(prev => prev.map(a => a._id === updated._id ? updated : a));
      }
    } catch (err) { console.error(err); }
  }

  async function updateClubLeader(club, type, userId) {
    try {
      const body = type === 'faculty' ? { facultyCoordinatorId: userId || null } : { studentLeadId: userId || null };
      const res = await fetch(`/api/clubs/${club._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setToast('Club leader updated');
        fetchClubs();
        const updated = await res.json();
        setSelectedClub(updated);
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          facultyCoordinatorId: selectedCoordinator || undefined,
          studentLeadId: selectedLead || undefined,
        }),
      });
      if (res.ok) {
        setToast('Club created successfully');
        setShowCreate(false);
        setForm({ name: '', description: '' });
        setSelectedCoordinator('');
        setSelectedLead('');
        fetchClubs();
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
  }

  async function handleDelete(clubId) {
    if (!confirm('Delete this club and all its announcements?')) return;
    try {
      const res = await fetch(`/api/clubs/${clubId}`, { method: 'DELETE' });
      if (res.ok) {
        setToast('Club deleted');
        fetchClubs();
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
  }

  if (selectedClub) {
    return (
      <div className="module-section">
        <div className="module-header">
          <button className="btn btn-secondary" onClick={() => setSelectedClub(null)}>← Back</button>
          <h2 className="module-title">{selectedClub.name}</h2>
        </div>

        {toast && <div className="toast toast-success">{toast}</div>}

        <div className="admin-cards-grid" style={{ marginBottom: '2rem' }}>
          <div className="admin-card" style={{ padding: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Update Faculty Coordinator</h4>
            <select
              className="form-select"
              value={selectedClub.facultyCoordinatorId?._id || ''}
              onChange={(e) => updateClubLeader(selectedClub, 'faculty', e.target.value)}
            >
              <option value="">None</option>
              {faculty.map(f => <option key={f._id} value={f._id}>{f.fullName}</option>)}
            </select>
          </div>
          <div className="admin-card" style={{ padding: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Update Student Lead</h4>
            <select
              className="form-select"
              value={selectedClub.studentLeadId?._id || ''}
              onChange={(e) => updateClubLeader(selectedClub, 'student', e.target.value)}
            >
              <option value="">None</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
            </select>
          </div>
        </div>

        <div className="admin-form card">
          <h4 style={{ marginBottom: '1rem' }}>Post Club Announcement</h4>
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <input className="form-input" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Title (optional)" />
          </div>

          {postAttachments.length > 0 && (
            <div className="attachment-preview-grid" style={{ marginBottom: '0.5rem' }}>
              {postAttachments.map((att, idx) => (
                <div key={idx} className="attachment-preview-item">
                  {att.type === 'image' ? (
                    <img src={att.data} alt={att.name} className="attachment-preview-img" />
                  ) : (
                    <div className="attachment-preview-icon"><FileText size={20} /></div>
                  )}
                  <span className="attachment-preview-name">{att.name.length > 15 ? att.name.slice(0, 12) + '...' : att.name}</span>
                  <button type="button" className="attachment-remove-btn" onClick={() => setPostAttachments(prev => prev.filter((_, i) => i !== idx))}>
                    <span style={{ fontSize: '12px', lineHeight: 1 }}>×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          {showPoll && <PollCreator poll={pollData} onChange={setPollData} />}

          <div className="message-input-row" style={{ alignItems: 'flex-end' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', color: 'var(--text-muted)' }}>
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.zip" style={{ display: 'none' }} onChange={(e) => {
                Array.from(e.target.files).forEach(file => {
                  if (file.size > 5 * 1024 * 1024) return;
                  const reader = new FileReader();
                  reader.onload = () => setPostAttachments(prev => [...prev, { name: file.name, type: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file', mimeType: file.type, data: reader.result }]);
                  reader.readAsDataURL(file);
                });
                e.target.value = null;
              }} />
              <FileText size={20} />
            </label>
            <textarea
              className="form-input"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="Type an announcement..."
              rows={1}
              style={{ resize: 'none', overflow: 'hidden', minHeight: '40px', padding: '0.6rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePost(e);
                }
              }}
            />
            <ExpirySelector value={postExpiry} onChange={setPostExpiry} compact />
            <button className={`btn btn-sm ${showPoll ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setShowPoll(!showPoll)} style={{ marginLeft: '0.5rem' }}>
              <BarChart3 size={16} />
            </button>
            <button className="btn btn-primary" onClick={handlePost}>Post</button>
          </div>
        </div>

        <div className="announcement-list" style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Club Announcements</h4>
          {announcements.map(ann => (
            <div key={ann._id} className="announcement-card">
              <div className="announcement-card-header">
                {ann.title ? <h3>{ann.title}</h3> : <div></div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {ann.expiresAt && <span className="expiry-badge">{getExpiryLabel(ann.expiresAt)}</span>}
                  <button className="announcement-delete-btn" onClick={() => handleDeleteAnnouncement(ann._id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {ann.content && <p className="announcement-content">{ann.content}</p>}
              <AttachmentViewer attachments={ann.attachments} />
              {ann.poll && (
                <PollDisplay
                  poll={ann.poll}
                  userId={session?.user?.id}
                  onVote={(optionId) => handleClubVote(ann._id, optionId)}
                />
              )}
              <span className="announcement-meta">{new Date(ann.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {announcements.length === 0 && <p className="empty-state">No announcements for this club</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><Star size={24} /> Club Management</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Create Club'}
        </button>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}

      {showCreate && (
        <form className="admin-form card" onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Club Name *</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Faculty Coordinator</label>
              <select className="form-select" value={selectedCoordinator} onChange={(e) => setSelectedCoordinator(e.target.value)}>
                <option value="">Select faculty...</option>
                {faculty.map(f => <option key={f._id} value={f._id}>{f.fullName} — {f.department}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Student Lead</label>
              <select className="form-select" value={selectedLead} onChange={(e) => setSelectedLead(e.target.value)}>
                <option value="">Select student...</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" type="submit">Create Club</button>
        </form>
      )}

      {loading ? (
        <div className="dashboard-loading"><div className="spinner-large"></div></div>
      ) : (
        <div className="admin-cards-grid">
          {clubs.map(club => (
            <div key={club._id} className="admin-card">
              <h3>{club.name}</h3>
              {club.description && <p className="admin-card-desc">{club.description}</p>}
              <div className="admin-card-meta">
                <span><User size={14} className="inline-icon" /> Coordinator: {club.facultyCoordinatorId?.fullName || 'None'}</span>
                <span><GraduationCap size={14} className="inline-icon" /> Lead: {club.studentLeadId?.fullName || 'None'}</span>
              </div>
              <div className="admin-card-actions">
                <button className="btn btn-sm btn-secondary" onClick={() => openClub(club)}>
                  <Settings size={14} /> Manage
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(club._id)}>Delete</button>
              </div>
            </div>
          ))}
          {clubs.length === 0 && <p className="empty-state">No clubs created yet</p>}
        </div>
      )}
    </div>
  );
}

// ─── Announcement Management ───────────────────────────────────────
function AnnouncementManagement() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', target: 'all', targetDepartment: '' });
  const [postAttachments, setPostAttachments] = useState([]);
  const [postExpiry, setPostExpiry] = useState('never');
  const [showPoll, setShowPoll] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''], multiSelect: false });
  const [toast, setToast] = useState('');

  useEffect(() => { fetchAnnouncements(); }, []);

  async function fetchAnnouncements() {
    try {
      const res = await fetch('/api/announcements?limit=50');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const body = { ...form };
      if (postAttachments.length > 0) body.attachments = postAttachments;
      if (postExpiry !== 'never') {
        const { calculateExpiryDate } = await import('../../components/ExpirySelector');
        body.expiresAt = calculateExpiryDate(postExpiry);
      }
      if (showPoll && pollData.question && pollData.options.filter(o => o.trim()).length >= 2) {
        body.poll = pollData;
      }
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setToast('Announcement published');
        setShowCreate(false);
        setForm({ title: '', content: '', target: 'all', targetDepartment: '' });
        setPostAttachments([]);
        setPostExpiry('never');
        setShowPoll(false);
        setPollData({ question: '', options: ['', ''], multiSelect: false });
        fetchAnnouncements();
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
  }

  async function handleVote(annId, optionId) {
    try {
      const res = await fetch(`/api/announcements/${annId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAnnouncements(prev => prev.map(a => a._id === updated._id ? updated : a));
      }
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this announcement?')) return;
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast('Announcement deleted');
        fetchAnnouncements();
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
  }

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><Megaphone size={24} /> Announcement Management</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Announcement'}
        </button>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}

      {showCreate && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="admin-form card" style={{ marginBottom: '1rem', paddingBottom: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Target Audience</h4>
            <div className="form-grid">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select className="form-select" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="faculty">Faculty Only</option>
                  <option value="department">Specific Department</option>
                </select>
              </div>
              {form.target === 'department' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select
                    className="form-select"
                    value={form.targetDepartment}
                    onChange={(e) => setForm({ ...form, targetDepartment: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select Department</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          <div className="admin-form card">
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (optional)" />
            </div>

          {postAttachments.length > 0 && (
            <div className="attachment-preview-grid" style={{ marginBottom: '0.5rem' }}>
              {postAttachments.map((att, idx) => (
                <div key={idx} className="attachment-preview-item">
                  {att.type === 'image' ? (
                    <img src={att.data} alt={att.name} className="attachment-preview-img" />
                  ) : (
                    <div className="attachment-preview-icon"><FileText size={20} /></div>
                  )}
                  <span className="attachment-preview-name">{att.name.length > 15 ? att.name.slice(0, 12) + '...' : att.name}</span>
                  <button type="button" className="attachment-remove-btn" onClick={() => setPostAttachments(prev => prev.filter((_, i) => i !== idx))}>
                    <span style={{ fontSize: '12px', lineHeight: 1 }}>×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          {showPoll && <PollCreator poll={pollData} onChange={setPollData} />}

          <div className="message-input-row" style={{ alignItems: 'flex-end' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', color: 'var(--text-muted)' }}>
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.zip" style={{ display: 'none' }} onChange={(e) => {
                Array.from(e.target.files).forEach(file => {
                  if (file.size > 5 * 1024 * 1024) return;
                  const reader = new FileReader();
                  reader.onload = () => setPostAttachments(prev => [...prev, { name: file.name, type: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file', mimeType: file.type, data: reader.result }]);
                  reader.readAsDataURL(file);
                });
                e.target.value = null;
              }} />
              <FileText size={20} />
            </label>
            <textarea
              className="form-input"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="Type an announcement..."
              rows={1}
              style={{ resize: 'none', overflow: 'hidden', minHeight: '40px', padding: '0.6rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreate(e);
                }
              }}
            />
            <ExpirySelector value={postExpiry} onChange={setPostExpiry} compact />
            <button className={`btn btn-sm ${showPoll ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setShowPoll(!showPoll)} style={{ marginLeft: '0.5rem' }}>
              <BarChart3 size={16} />
            </button>
            <button className="btn btn-primary" onClick={handleCreate}>Post</button>
          </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading"><div className="spinner-large"></div></div>
      ) : (
        <div className="announcement-list">
          {announcements.map(ann => (
            <div key={ann._id} className="announcement-card">
              <div className="announcement-card-header">
                {ann.title ? <h3>{ann.title}</h3> : <div></div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {ann.expiresAt && <span className="expiry-badge">{getExpiryLabel(ann.expiresAt)}</span>}
                  <button className="announcement-delete-btn" onClick={() => handleDelete(ann._id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {ann.content && <p className="announcement-content">{ann.content}</p>}
              <AttachmentViewer attachments={ann.attachments} />
              {ann.poll && (
                <PollDisplay
                  poll={ann.poll}
                  userId={session?.user?.id}
                  onVote={(optionId) => handleVote(ann._id, optionId)}
                />
              )}
              <div className="announcement-meta">
                <span>By {ann.authorId?.fullName || 'Unknown'}</span>
                <span>Target: {ann.target}</span>
                <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {announcements.length === 0 && <p className="empty-state">No announcements yet</p>}
        </div>
      )}
    </div>
  );
}

// ─── Calendar Management ───────────────────────────────────────────
function CalendarManagement() {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchCalendar(); }, []);

  async function fetchCalendar() {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      setCalendar(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const method = calendar ? 'PUT' : 'POST';
      const res = await fetch('/api/calendar', { method, body: formData });
      if (res.ok) {
        setToast('Calendar uploaded successfully');
        fetchCalendar();
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  }

  async function handleDelete() {
    if (!confirm('Delete the current academic calendar?')) return;
    try {
      const res = await fetch('/api/calendar', { method: 'DELETE' });
      if (res.ok) {
        setToast('Calendar deleted');
        setCalendar(null);
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
  }

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><Calendar size={24} /> Calendar Management</h2>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}

      {loading ? (
        <div className="dashboard-loading"><div className="spinner-large"></div></div>
      ) : calendar ? (
        <div className="calendar-preview card">
          <div className="calendar-info">
            <p><strong>File:</strong> {calendar.fileName}</p>
            <p><strong>Uploaded:</strong> {new Date(calendar.uploadedAt || calendar.createdAt).toLocaleDateString()}</p>
          </div>
          {calendar.fileUrl && (
            <div className="calendar-embed">
              {calendar.fileName?.endsWith('.pdf') ? (
                <iframe src={calendar.fileUrl} width="100%" height="500" title="Academic Calendar" />
              ) : (
                <img src={calendar.fileUrl} alt="Academic Calendar" style={{ maxWidth: '100%' }} />
              )}
            </div>
          )}
          <div className="admin-card-actions" style={{ marginTop: '1rem' }}>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              {uploading ? 'Uploading...' : 'Replace Calendar'}
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-danger" onClick={handleDelete}>Delete Calendar</button>
          </div>
        </div>
      ) : (
        <div className="empty-state card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No academic calendar has been uploaded yet.</p>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            {uploading ? 'Uploading...' : 'Upload Calendar'}
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}
    </div>
  );
}

// ─── Admin Profile ─────────────────────────────────────────────────
function AdminProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`)
        .then(r => r.json())
        .then(setProfile)
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (loading) return <div className="dashboard-loading"><div className="spinner-large"></div></div>;

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title">👤 Admin Profile</h2>
      </div>
      <div className="profile-card card">
        <div className="profile-info">
          <div className="profile-field"><label>Name</label><p>{profile?.fullName}</p></div>
          <div className="profile-field"><label>Email</label><p>{profile?.email}</p></div>
          <div className="profile-field"><label>Role</label><p><span className="role-badge role-badge-admin">Admin</span></p></div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ──────────────────────────────────────────
export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (status === 'loading') {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    redirect('/');
    return null;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <AdminOverview />;
      case 'users': return <UserManagement />;
      case 'load-data': return <LoadData />;
      case 'groups': return <GroupManagement />;
      case 'clubs': return <ClubManagement />;
      case 'announcements': return <AnnouncementManagement />;
      case 'calendar': return <CalendarManagement />;
      case 'profile': return <AdminProfile />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        role="admin"
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main className="dashboard-main">
        {renderSection()}
      </main>
    </div>
  );
}
