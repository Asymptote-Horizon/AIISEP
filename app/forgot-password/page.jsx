'use client';
import { ArrowLeft } from 'lucide-react';

import { useState } from 'react';
import Link from 'next/link';
import MITLogo from '../components/MITLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send reset link');
      } else {
        setMessage(data.message || 'Reset link sent to your email.');
        if (data.previewUrl) {
          setPreviewUrl(data.previewUrl);
        }
        setEmail('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-pattern"></div>
      
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <MITLogo className="mb-6" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '1rem', marginBottom: '0.5rem' }}>
              Reset Password
            </h2>
            <p className="auth-subtitle" style={{ textAlign: 'center' }}>
              Enter your institutional email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="auth-error" style={{ marginBottom: '1.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {message && (
            <div className="auth-success" style={{ padding: '1rem', backgroundColor: 'var(--success-light, #ecfdf5)', color: 'var(--success-main, #059669)', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {message}
              </div>
              {previewUrl && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                  <strong>Developer Note (Test Mode):</strong>
                  <br />
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline', marginTop: '0.5rem', display: 'inline-block' }}>
                    Click here to view the test email
                  </a>
                </div>
              )}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '1rem' }}
            >
              {loading ? (
                <span className="btn-loading">
                  <div className="spinner-sm"></div>
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link
                href="/"
                style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}
              >
                <ArrowLeft size={16} className="inline-icon" /> Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
