'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import RoleBadge from './RoleBadge';
import NotificationBell from './NotificationBell';
import MITLogo from './MITLogo';

export default function Navbar() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session) return null;

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <div className="navbar-actions">
          <NotificationBell />

          <div className="navbar-user-container" ref={dropdownRef}>
            <div
              className="navbar-user"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >

              <div className="navbar-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                {session.user.profilePhoto ? (
                  <img src={session.user.profilePhoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  session.user.name?.charAt(0)?.toUpperCase()
                )}
              </div>
            </div>

            {dropdownOpen && (
              <div className="navbar-dropdown">
                <div className="dropdown-profile-header">
                  <div className="dropdown-avatar">
                    {session.user.profilePhoto ? (
                      <img src={session.user.profilePhoto} alt="Avatar" />
                    ) : (
                      session.user.name?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                  <div className="dropdown-user-details">
                    <span className="dropdown-user-name">{session.user.name}</span>
                    <span className="dropdown-user-email">{session.user.email}</span>
                    <RoleBadge role={session.user.role} size="xs" />
                  </div>
                </div>

                <div className="dropdown-divider"></div>


                <button className="dropdown-logout-btn" onClick={() => signOut({ callbackUrl: '/' })}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>


        </div>
      </div>
    </nav>
  );
}
