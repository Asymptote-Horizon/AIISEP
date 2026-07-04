'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Megaphone, UsersRound, Star, User, Building, Settings, Trash2, Edit, ArrowLeft, Pencil, Save, Users, GraduationCap, BarChart3, FileText } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import ImageCropper from '../../components/ImageCropper';
import ImageViewer from '../../components/ImageViewer';
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

// ─── Faculty Announcements ─────────────────────────────────────────
function FacultyAnnouncements() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', target: 'all', targetDepartment: '' });
  const [postAttachments, setPostAttachments] = useState([]);
  const [postExpiry, setPostExpiry] = useState('never');
  const [showPoll, setShowPoll] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''], multiSelect: false });
  const [editingId, setEditingId] = useState(null);
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

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await fetch('/api/announcements', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ announcementId: editingId, ...form }),
        });
        if (res.ok) {
          setToast('Announcement updated');
          setEditingId(null);
        }
      } else {
        const body = { ...form };
        if (postAttachments.length > 0) body.attachments = postAttachments;
        if (postExpiry !== 'never') body.expiresAt = calculateExpiryDate(postExpiry);
        if (showPoll && pollData.question && pollData.options.filter(o => o.trim()).length >= 2) {
          body.poll = pollData;
        }
        const res = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) setToast('Announcement published');
      }
      setShowCreate(false);
      setForm({ title: '', content: '', target: 'all', targetDepartment: '' });
      setPostAttachments([]);
      setPostExpiry('never');
      setShowPoll(false);
      setPollData({ question: '', options: ['', ''], multiSelect: false });
      fetchAnnouncements();
      setTimeout(() => setToast(''), 3000);
    } catch (err) { console.error(err); }
  }

  async function handleVote(announcementId, optionId) {
    try {
      const res = await fetch(`/api/announcements/${announcementId}/vote`, {
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
      await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
      setToast('Announcement deleted');
      fetchAnnouncements();
      setTimeout(() => setToast(''), 3000);
    } catch (err) { console.error(err); }
  }

  function startEdit(ann) {
    setForm({ title: ann.title, content: ann.content, target: ann.target || 'all', targetDepartment: ann.targetDepartment || '' });
    setEditingId(ann._id);
    setShowCreate(true);
  }

  const isOwn = (ann) => ann.authorId?._id === session?.user?.id;

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><Megaphone size={24} /> Announcements</h2>
        <button className="btn btn-primary" onClick={() => { setShowCreate(!showCreate); setEditingId(null); setForm({ title: '', content: '', target: 'all', targetDepartment: '' }); }}>
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
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (optional)" />
            </div>

          {!editingId && postAttachments.length > 0 && (
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
          {!editingId && showPoll && <PollCreator poll={pollData} onChange={setPollData} />}

          <div className="message-input-row" style={{ alignItems: 'flex-end' }}>
            {!editingId && (
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
            )}
            <textarea
              className="form-input"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder={editingId ? "Edit announcement..." : "Type an announcement..."}
              rows={1}
              style={{ resize: 'none', overflow: 'hidden', minHeight: '40px', padding: '0.6rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            {!editingId && (
              <>
                <ExpirySelector value={postExpiry} onChange={setPostExpiry} compact />
                <button className={`btn btn-sm ${showPoll ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setShowPoll(!showPoll)} style={{ marginLeft: '0.5rem' }}>
                  <BarChart3 size={16} />
                </button>
              </>
            )}
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingId ? 'Save' : 'Post'}
            </button>
          </div>
          {editingId && (
            <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => { setEditingId(null); setForm({ title: '', content: '', target: 'all', targetDepartment: '' }); }}>
              Cancel Edit
            </button>
          )}
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
                </div>
              </div>
              <p className="announcement-content">{ann.content}</p>
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
                <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
              </div>
              {isOwn(ann) && (
                <div className="admin-card-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => startEdit(ann)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(ann._id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
          {announcements.length === 0 && <p className="empty-state">No announcements yet</p>}
        </div>
      )}
    </div>
  );
}

// ─── Faculty Groups ────────────────────────────────────────────────
function FacultyGroups() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [msgAttachments, setMsgAttachments] = useState([]);
  const [msgExpiry, setMsgExpiry] = useState('never');
  const [showPoll, setShowPoll] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''], multiSelect: false });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  // edit mode states
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [editAddMembers, setEditAddMembers] = useState([]);
  const [editRemoveMembers, setEditRemoveMembers] = useState([]);
  const [editMemberSearch, setEditMemberSearch] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { fetchGroups(); fetchAllUsers(); }, []);

  async function fetchGroups() {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      setGroups(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchAllUsers() {
    try {
      const res = await fetch('/api/users?status=active');
      const data = await res.json();
      setAllUsers(data.filter(u => u.role !== 'admin'));
    } catch (err) { console.error(err); }
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
          <button className="btn btn-secondary" onClick={() => { setSelectedGroup(null); setEditMode(false); fetchGroups(); }}><ArrowLeft size={16} className="inline-icon" /> Back</button>
          <h2 className="module-title">{selectedGroup.name}</h2>
          {!editMode && (
            <button className="btn btn-primary" onClick={startEdit}><Pencil size={16} className="inline-icon" /> Edit Group</button>
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
                    <span>{m.userId?.fullName || 'Unknown'} ({m.role}){m.isLead ? ' <Star size={14} className="inline-icon" /> Lead' : ''}</span>
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
                {editSaving ? 'Saving...' : <><Save size={16} className="inline-icon" /> Save Changes</>}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            {/* Normal Manage View */}
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
                  placeholder="Type a message..."
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

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><UsersRound size={24} /> My Groups</h2>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}

      {loading ? (
        <div className="dashboard-loading"><div className="spinner-large"></div></div>
      ) : (
        <div className="admin-cards-grid">
          {groups.map(group => (
            <div key={group._id} className="admin-card" onClick={() => openGroup(group)} style={{ cursor: 'pointer', position: 'relative' }}>
              {group.unreadCount > 0 && (
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--accent-primary, #e11d48)', color: 'white', borderRadius: '50%', minWidth: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', padding: '0 6px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {group.unreadCount}
                </div>
              )}
              <div className="admin-card-header">
                <h3>{group.name}</h3>
                <span className={`mode-badge mode-${group.messagingMode}`}>{group.messagingMode}</span>
              </div>
              {group.description && <p className="admin-card-desc">{group.description}</p>}
              <div className="admin-card-meta">
                <span><UsersRound size={14} className="inline-icon" /> {group.members?.length || 0} members</span>
              </div>
              <div className="admin-card-actions" onClick={(e) => e.stopPropagation()}>
                <select
                  className="form-select form-select-sm"
                  value={group.messagingMode}
                  onChange={(e) => changeMode(group, e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="restricted">Restricted</option>
                </select>
                <button className="btn btn-sm btn-secondary" onClick={() => openGroup(group)}>
                  <Settings size={14} /> Manage
                </button>
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="empty-state">You are not assigned to any groups</p>}
        </div>
      )}
    </div>
  );
}

// ─── Faculty Clubs ─────────────────────────────────────────────────
function FacultyClubs({ onViewImage }) {
  const { data: session } = useSession();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubAnnouncements, setClubAnnouncements] = useState([]);
  const [showPost, setShowPost] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [postAttachments, setPostAttachments] = useState([]);
  const [postExpiry, setPostExpiry] = useState('never');
  const [showPoll, setShowPoll] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''], multiSelect: false });
  const [toast, setToast] = useState('');

  const [students, setStudents] = useState([]);
  
  const [cropImage, setCropImage] = useState(null);

  const handleLogoSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setCropImage(reader.result));
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = null;
    }
  };

  const handleSaveLogo = async (croppedBase64) => {
    setCropImage(null);
    try {
      const res = await fetch(`/api/clubs/${selectedClub._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: croppedBase64 })
      });
      if (res.ok) {
        setToast('Logo updated successfully');
        fetchClubs();
        const updated = await res.json();
        setSelectedClub(updated);
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    fetchClubs(); 
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const res = await fetch('/api/users?role=student&status=active');
      const data = await res.json();
      setStudents(data);
    } catch (err) { console.error(err); }
  }

  async function fetchClubs() {
    try {
      const res = await fetch('/api/clubs');
      const data = await res.json();
      setClubs(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function openClub(club) {
    setSelectedClub(club);
    try {
      const res = await fetch(`/api/announcements?scope=club&clubId=${club._id}`);
      const data = await res.json();
      setClubAnnouncements(data.announcements || []);
    } catch (err) { console.error(err); }
  }

  async function handlePost(e) {
    e.preventDefault();
    try {
      const body = { ...form, scope: 'club', clubId: selectedClub._id };
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
      setShowPost(false);
      setForm({ title: '', content: '' });
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
        setClubAnnouncements(prev => prev.filter(a => a._id !== annId));
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
        setClubAnnouncements(prev => prev.map(a => a._id === updated._id ? updated : a));
      }
    } catch (err) { console.error(err); }
  }

  if (selectedClub) {
    const isCoordinator = selectedClub.isCoordinator;
    return (
      <div className="module-section">
        <div className="module-header">
          <button className="btn btn-secondary" onClick={() => { setSelectedClub(null); fetchClubs(); }}><ArrowLeft size={16} className="inline-icon" /> Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {selectedClub.logo ? (
              <img src={selectedClub.logo} alt="Club Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => onViewImage(selectedClub.logo)} />
            ) : (
              <Star size={32} style={{ color: 'var(--text-muted)' }} />
            )}
            <h2 className="module-title" style={{ marginBottom: 0 }}>{selectedClub.name}</h2>
          </div>
          {isCoordinator && (
            <button className="btn btn-primary" onClick={() => setShowPost(!showPost)}>
              {showPost ? 'Cancel' : '+ Post Announcement'}
            </button>
          )}
        </div>

        {toast && <div className="toast toast-success">{toast}</div>}

        {isCoordinator && (
          <div className="admin-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Set Student Lead</h4>
                <select
                  className="form-select"
                  value={selectedClub.studentLeadId?._id || ''}
                  onChange={async (e) => {
                    const newLeadId = e.target.value;
                    try {
                      const res = await fetch(`/api/clubs/${selectedClub._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentLeadId: newLeadId || null })
                      });
                      if (res.ok) {
                        setToast('Student Lead updated');
                        fetchClubs();
                        const updated = await res.json();
                        setSelectedClub(updated);
                        setTimeout(() => setToast(''), 3000);
                      }
                    } catch (err) { console.error(err); }
                  }}
                >
                  <option value="">None</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.fullName} ({s.prn})</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Club Logo</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                    <Pencil size={14} className="inline-icon" /> Upload Logo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoSelect} />
                  </label>
                  {selectedClub.logo && (
                    <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleSaveLogo('')}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {cropImage && (
          <ImageCropper
            imageSrc={cropImage}
            onSave={handleSaveLogo}
            onCancel={() => setCropImage(null)}
          />
        )}

        {showPost && (
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
        )}

        <div className="announcement-list">
          {clubAnnouncements.map(ann => (
            <div key={ann._id} className="announcement-card">
              <div className="announcement-card-header">
                {ann.title ? <h3>{ann.title}</h3> : <div></div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {ann.expiresAt && <span className="expiry-badge">{getExpiryLabel(ann.expiresAt)}</span>}
                  {isCoordinator && (
                    <button className="announcement-delete-btn" onClick={() => handleDeleteAnnouncement(ann._id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  )}
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
          {clubAnnouncements.length === 0 && <p className="empty-state">No announcements for this club</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><Star size={24} /> Clubs</h2>
      </div>

      {loading ? (
        <div className="dashboard-loading"><div className="spinner-large"></div></div>
      ) : (
        <div className="admin-cards-grid">
          {clubs.map(club => (
            <div key={club._id} className="admin-card" onClick={() => openClub(club)} style={{ cursor: 'pointer', position: 'relative' }}>
              {club.unreadCount > 0 && (
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--accent-primary, #e11d48)', color: 'white', borderRadius: '50%', minWidth: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', padding: '0 6px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {club.unreadCount}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                {club.logo ? (
                  <img src={club.logo} alt="Club Logo" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onViewImage(club.logo); }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{club.name}</h3>
                  {club.description && <p className="admin-card-desc" style={{ marginBottom: 0 }}>{club.description}</p>}
                </div>
              </div>
              <div className="admin-card-meta">
                <span><User size={14} className="inline-icon" /> Coordinator: {club.facultyCoordinatorId?.fullName || 'None'}</span>
                <span><GraduationCap size={14} className="inline-icon" /> Lead: {club.studentLeadId?.fullName || 'None'}</span>
                {club.isCoordinator && <span className="lead-badge">You are Coordinator</span>}
              </div>
              {club.isCoordinator && (
                <div className="admin-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-sm btn-secondary" onClick={() => openClub(club)}>
                    <Settings size={14} /> Manage
                  </button>
                </div>
              )}
            </div>
          ))}
          {clubs.length === 0 && <p className="empty-state">No clubs available</p>}
        </div>
      )}
    </div>
  );
}

// ─── Faculty Profile ───────────────────────────────────────────────
function FacultyProfile({ onViewImage }) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: '', cabinNumber: '', about: '', profilePhoto: '' });
  const [toast, setToast] = useState('');
  const [cropImage, setCropImage] = useState(null);

  useEffect(() => {
    if (session?.user?.id) fetchProfile();
  }, [session]);

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/users/${session.user.id}`);
      const data = await res.json();
      setProfile(data);
      setForm({ phone: data.phone || '', cabinNumber: data.cabinNumber || '', about: data.about || '', profilePhoto: data.profilePhoto || '' });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setToast('Profile updated');
        setEditing(false);
        fetchProfile();
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImage(reader.result);
      };
      reader.readAsDataURL(file);
      e.target.value = null;
    }
  };

  const handleSaveCropped = (croppedBase64) => {
    setForm({ ...form, profilePhoto: croppedBase64 });
    setCropImage(null);
  };

  if (loading) return <div className="dashboard-loading"><div className="spinner-large"></div></div>;

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><User size={24} /> My Profile</h2>
        <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}

      <div className="profile-card card" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="profile-photo-section" style={{ flex: '0 0 150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {form.profilePhoto || profile?.profilePhoto ? (
            <img 
              src={form.profilePhoto || profile?.profilePhoto} 
              alt="Profile" 
              style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%', border: '4px solid #eaeaea', cursor: 'pointer' }} 
              onClick={() => onViewImage(form.profilePhoto || profile?.profilePhoto)}
            />
          ) : (
            <div style={{ width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #eaeaea' }}>
              <User size={64} color="#94a3b8" />
            </div>
          )}
          {editing && (
            <div style={{ marginTop: '1rem', width: '100%' }}>
              <label className="btn btn-sm btn-secondary" style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }}>
                Upload Photo
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
              {form.profilePhoto && (
                <button className="btn btn-sm" style={{ width: '100%', marginTop: '0.5rem', color: 'red' }} onClick={() => setForm({ ...form, profilePhoto: '' })}>
                  Remove Photo
                </button>
              )}
            </div>
          )}
        </div>

        <div className="profile-info" style={{ flex: '1', minWidth: 0, maxWidth: '100%' }}>
          <div className="profile-field"><label>Full Name</label><p>{profile?.fullName}</p></div>
          <div className="profile-field"><label>Email</label><p>{profile?.email}</p></div>
          <div className="profile-field"><label>Department</label><p>{profile?.department || '—'}</p></div>
          <div className="profile-field"><label>Designation</label><p>{profile?.designation || '—'}</p></div>

          {editing ? (
            <>
              <div className="profile-field">
                <label>Phone Number</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="profile-field">
                <label>Cabin Number</label>
                <input className="form-input" value={form.cabinNumber} onChange={(e) => setForm({ ...form, cabinNumber: e.target.value })} />
              </div>
              <div className="profile-field" style={{ gridColumn: '1 / -1' }}>
                <label>About / Bio (max 500 chars)</label>
                <textarea className="form-input" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} maxLength={500} rows={4} />
                <small>{form.about.length}/500</small>
              </div>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            </>
          ) : (
            <>
              <div className="profile-field"><label>Phone</label><p>{profile?.phone || '—'}</p></div>
              <div className="profile-field"><label>Cabin</label><p>{profile?.cabinNumber || '—'}</p></div>
              <div className="profile-field" style={{ width: '100%' }}><label>About</label><div className="about-box">{profile?.about || '—'}</div></div>
            </>
          )}
        </div>
      </div>

      {cropImage && (
        <ImageCropper
          imageSrc={cropImage}
          onSave={handleSaveCropped}
          onCancel={() => setCropImage(null)}
        />
      )}
    </div>
  );
}

// ─── Main Faculty Dashboard ────────────────────────────────────────
export default function FacultyDashboard() {
  const { data: session, status } = useSession();
  const [activeSection, setActiveSection] = useState('announcements');
  const [viewingImage, setViewingImage] = useState(null);

  if (status === 'loading') {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!session || session.user.role !== 'faculty') {
    redirect('/');
    return null;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'announcements': return <FacultyAnnouncements />;
      case 'groups': return <FacultyGroups />;
      case 'clubs': return <FacultyClubs onViewImage={setViewingImage} />;
      case 'profile': return <FacultyProfile onViewImage={setViewingImage} />;
      default: return <FacultyAnnouncements />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        role="faculty"
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main className="dashboard-main">
        {renderSection()}
      </main>
      {viewingImage && (
        <ImageViewer 
          src={viewingImage} 
          alt="Preview" 
          onClose={() => setViewingImage(null)} 
        />
      )}
    </div>
  );
}
