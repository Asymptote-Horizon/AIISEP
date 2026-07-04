'use client';

export default function RoleBadge({ role }) {
  const config = {
    admin: { label: 'Admin', className: 'role-badge-admin' },
    faculty: { label: 'Faculty', className: 'role-badge-faculty' },
    student: { label: 'Student', className: 'role-badge-student' },
    clubLead: { label: 'Club Lead', className: 'role-badge-club-lead' },
  };

  const { label, className } = config[role] || { label: role, className: '' };

  return (
    <span className={`role-badge ${className}`}>
      {label}
    </span>
  );
}
