'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Calendar, Download, Megaphone, UsersRound, GraduationCap, Building, Mail, Phone, FileText, Star, User, ArrowLeft, Pencil, Save, Users, BarChart3, Trash2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import ImageCropper from '../../components/ImageCropper';
import ImageViewer from '../../components/ImageViewer';
import AttachmentUploader from '../../components/AttachmentUploader';
import AttachmentViewer from '../../components/AttachmentViewer';
import ExpirySelector, { getExpiryLabel, calculateExpiryDate } from '../../components/ExpirySelector';
import PollCreator from '../../components/PollCreator';
import PollDisplay from '../../components/PollDisplay';

// ─── Student Calendar View ─────────────────────────────────────────
function StudentCalendar() {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.json())
      .then(setCalendar)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dashboard-loading"><div className="spinner-large"></div></div>;

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><Calendar size={24} /> Academic Calendar</h2>
        {calendar?.fileUrl && (
          <a href={calendar.fileUrl} download={calendar.fileName} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: 'fit-content' }}>
            <Download size={14} className="inline-icon" /> Download
          </a>
        )}
      </div>

      {calendar ? (
        <div className="calendar-preview card">
          {calendar.fileName?.endsWith('.pdf') ? (
            <iframe src={calendar.fileUrl} width="100%" height="600" title="Academic Calendar" />
          ) : (
            <img src={calendar.fileUrl} alt="Academic Calendar" style={{ maxWidth: '100%', borderRadius: '8px' }} />
          )}
          <p className="calendar-info" style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
            Last updated: {new Date(calendar.uploadedAt || calendar.createdAt).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <div className="empty-state card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p>No academic calendar has been uploaded yet.</p>
          <p style={{ color: 'var(--text-muted)' }}>Check back later!</p>
        </div>
      )}
    </div>
  );
}

// ─── Student Announcements ─────────────────────────────────────────
function StudentAnnouncements() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      const res = await fetch('/api/announcements?limit=50');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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

  if (loading) return <div className="dashboard-loading"><div className="spinner-large"></div></div>;

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><Megaphone size={24} /> Announcements</h2>
      </div>

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
          </div>
        ))}
        {announcements.length === 0 && <p className="empty-state">No announcements yet</p>}
      </div>
    </div>
  );
}

// ─── Student Groups ────────────────────────────────────────────────
function StudentGroups() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [msgAttachments, setMsgAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canSend, setCanSend] = useState(false);
  const [isLead, setIsLead] = useState(false);
  const [toast, setToast] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [msgExpiry, setMsgExpiry] = useState('never');
  const [showPoll, setShowPoll] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''], multiSelect: false });


  useEffect(() => { fetchGroups(); }, []);

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
    // Check if student is a lead or group is open
    const myMembership = group.members?.find(m => m.userId?._id === session?.user?.id);
    const studentIsLead = myMembership?.isLead || false;
    setIsLead(studentIsLead);
    setCanSend(
      group.messagingMode === 'open' || studentIsLead
    );

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

  if (selectedGroup) {
    return (
      <div className="module-section">
        <div className="module-header">
          <button className="btn btn-secondary" onClick={() => { setSelectedGroup(null); fetchGroups(); }}><ArrowLeft size={16} className="inline-icon" /> Back</button>
          <h2 className="module-title">{selectedGroup.name}</h2>
          <span className={`mode-badge mode-${selectedGroup.messagingMode}`}>{selectedGroup.messagingMode}</span>
        </div>

        {toast && <div className="toast toast-success">{toast}</div>}

        <div className="group-messages">
          {messages.map(msg => (
            <div key={msg._id} className={`message-bubble ${msg.senderId?._id === session?.user?.id ? 'message-own' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="message-sender">{msg.senderId?.fullName || 'Unknown'}</span>
                {(msg.senderId?._id === session?.user?.id || isLead) && (
                  <button className="announcement-delete-btn" onClick={() => deleteMessage(msg._id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                )}
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

        {canSend ? (
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
        ) : (
          <div className="message-restricted">
            <p>This group is in restricted mode. Only faculty and leads can send messages.</p>
          </div>
        )}

        <div className="group-members-section">
          <h4><Users size={20} className="inline-icon" /> Members ({selectedGroup.members?.length || 0})</h4>
          <div className="member-list">
            {selectedGroup.members?.map(m => (
              <div key={m.userId?._id || m._id} className="member-item">
                <span>{m.userId?.fullName || 'Unknown'} ({m.role})</span>
                {m.isLead && <span className="lead-badge">CR / Lead</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><UsersRound size={24} /> My Groups</h2>
      </div>

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
            </div>
          ))}
          {groups.length === 0 && <p className="empty-state">You haven&apos;t been added to any groups yet</p>}
        </div>
      )}
    </div>
  );
}


// ─── Faculty Directory ─────────────────────────────────────────────
function FacultyDirectory() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  useEffect(() => { fetchFaculty(); }, []);

  async function fetchFaculty() {
    try {
      const params = new URLSearchParams({ role: 'faculty', status: 'active' });
      if (search) params.set('search', search);
      if (deptFilter) params.set('department', deptFilter);

      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      setFaculty(data);

      // Extract unique departments
      const depts = [...new Set(data.map(f => f.department).filter(Boolean))];
      if (departments.length === 0) setDepartments(depts);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchFaculty(), 300);
    return () => clearTimeout(timer);
  }, [search, deptFilter]);

  if (selectedFaculty) {
    return (
      <div className="module-section">
        <div className="module-header">
          <button className="btn btn-secondary" onClick={() => setSelectedFaculty(null)}><ArrowLeft size={16} className="inline-icon" /> Back</button>
          <h2 className="module-title">Faculty Details</h2>
        </div>
        <div className="faculty-detail-card card">
          <div className="faculty-detail-header">
            <div className="faculty-avatar-large">
              {selectedFaculty.profilePhoto ? (
                <img src={selectedFaculty.profilePhoto} alt={selectedFaculty.fullName} />
              ) : (
                <span>{selectedFaculty.fullName?.charAt(0)}</span>
              )}
            </div>
            <div>
              <h2>{selectedFaculty.fullName}</h2>
              <p className="faculty-designation">{selectedFaculty.designation || 'Faculty'}</p>
              <p className="faculty-dept">{selectedFaculty.department}</p>
            </div>
          </div>
          <div className="faculty-detail-info">
            <div className="info-row"><label><Mail size={16} className="inline-icon" /> Email</label><p>{selectedFaculty.email}</p></div>
            <div className="info-row"><label><Phone size={16} className="inline-icon" /> Phone</label><p>{selectedFaculty.phone || 'Not shared'}</p></div>
            <div className="info-row"><label><Building size={16} className="inline-icon" /> Cabin</label><p>{selectedFaculty.cabinNumber || 'Not specified'}</p></div>
            {selectedFaculty.about && <div className="info-row" style={{ width: '100%' }}><label><FileText size={16} className="inline-icon" /> About</label><div className="about-box">{selectedFaculty.about}</div></div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-section">
      <div className="module-header">
        <h2 className="module-title"><GraduationCap size={24} /> Faculty Directory</h2>
      </div>

      <div className="admin-filters">
        <div className="search-bar">
          <input
            type="text"
            className="form-input"
            placeholder="Search faculty by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-row">
          <select className="form-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading"><div className="spinner-large"></div></div>
      ) : (
        <div className="faculty-grid">
          {faculty.map(f => (
            <div key={f._id} className="faculty-card" onClick={() => setSelectedFaculty(f)} style={{ cursor: 'pointer' }}>
              <div className="faculty-avatar">
                {f.profilePhoto ? (
                  <img src={f.profilePhoto} alt={f.fullName} />
                ) : (
                  <span>{f.fullName?.charAt(0)}</span>
                )}
              </div>
              <h3>{f.fullName}</h3>
              <p className="faculty-dept-tag">{f.department}</p>
              <p className="faculty-designation-tag">{f.designation || 'Faculty'}</p>
              {f.cabinNumber && <p className="faculty-cabin"><Building size={14} className="inline-icon" /> {f.cabinNumber}</p>}
            </div>
          ))}
          {faculty.length === 0 && <p className="empty-state">No faculty found</p>}
        </div>
      )}
    </div>
  );
}

// ─── Student Clubs ─────────────────────────────────────────────────
function StudentClubs({ onViewImage }) {
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
  const [cropImage, setCropImage] = useState(null);

  useEffect(() => {
    fetch('/api/clubs').then(r => r.json()).then(setClubs).finally(() => setLoading(false));
  }, []);

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
        const updated = await res.json();
        setSelectedClub(updated);
        fetch('/api/clubs').then(r => r.json()).then(setClubs);
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) { console.error(err); }
  };

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
    return (
      <div className="module-section">
        <div className="module-header">
          <button className="btn btn-secondary" onClick={() => { setSelectedClub(null); fetch('/api/clubs').then(r => r.json()).then(setClubs); }}><ArrowLeft size={16} className="inline-icon" /> Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {selectedClub.logo ? (
              <img src={selectedClub.logo} alt="Club Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => onViewImage(selectedClub.logo)} />
            ) : (
              <Star size={32} style={{ color: 'var(--text-muted)' }} />
            )}
            <h2 className="module-title" style={{ marginBottom: 0 }}>{selectedClub.name}</h2>
          </div>
          {selectedClub.isLead && (
            <button className="btn btn-primary" onClick={() => setShowPost(!showPost)}>
              {showPost ? 'Cancel' : '+ Post'}
            </button>
          )}
        </div>

        {toast && <div className="toast toast-success">{toast}</div>}

        {selectedClub.description && <p className="admin-card-desc">{selectedClub.description}</p>}

        <div className="admin-card-meta" style={{ marginBottom: '1rem' }}>
          <span><User size={14} className="inline-icon" /> Coordinator: {selectedClub.facultyCoordinatorId?.fullName || 'None'}</span>
          <span><GraduationCap size={14} className="inline-icon" /> Lead: {selectedClub.studentLeadId?.fullName || 'None'}</span>
        </div>

        {selectedClub.isLead && (
          <div className="admin-card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ marginBottom: 0 }}>Club Logo</h4>
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
                  {selectedClub.isLead && (
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
              </div>
            </div>
          ))}
          {clubs.length === 0 && <p className="empty-state">No clubs available</p>}
        </div>
      )}
    </div>
  );
}

// ─── Student Profile ───────────────────────────────────────────────
function StudentProfile({ onViewImage }) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ profilePhoto: '', about: '', phone: '' });
  const [cropImage, setCropImage] = useState(null);
  const [toast, setToast] = useState('');

  const fetchProfile = () => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`)
        .then(r => r.json())
        .then(data => {
          setProfile(data);
          setForm({ profilePhoto: data.profilePhoto || '', about: data.about || '', phone: data.phone || '' });
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session]);

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
          <div className="profile-field"><label>PRN</label><p>{profile?.prn || '—'}</p></div>
          <div className="profile-field"><label>Email</label><p>{profile?.email}</p></div>
          <div className="profile-field"><label>Department</label><p>{profile?.department || '—'}</p></div>
          <div className="profile-field"><label>Semester</label><p>{profile?.semester || '—'}</p></div>
          <div className="profile-field"><label>Role</label><p><span className="role-badge role-badge-student">Student</span></p></div>

          {editing ? (
            <>
              <div className="profile-field">
                <label>Phone Number</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
              <div className="profile-field" style={{ width: '100%' }}><label>About</label><div className="about-box">{profile?.about || '—'}</div></div>
            </>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem', width: '100%' }}>
          Core details (Name, Email, PRN, Dept) are managed by the administrator. Contact admin for changes.
        </p>
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

  // ─── Main Student Dashboard ────────────────────────────────────────
export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const [activeSection, setActiveSection] = useState('calendar');
  const [viewingImage, setViewingImage] = useState(null);

  if (status === 'loading') {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!session || session.user.role !== 'student') {
    redirect('/');
    return null;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'calendar': return <StudentCalendar />;
      case 'announcements': return <StudentAnnouncements />;
      case 'groups': return <StudentGroups />;
      case 'faculty': return <FacultyDirectory />;
      case 'clubs': return <StudentClubs onViewImage={setViewingImage} />;
      case 'profile': return <StudentProfile onViewImage={setViewingImage} />;
      default: return <StudentCalendar />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        role="student"
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
