import React from 'react';
import { X } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  if (!isOpen) return null;

  const handleLoginSubmit = () => {
    onClose();
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', width: '380px', padding: '32px', borderRadius: '12px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#0f172a' }}>Platform Login</h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Enter credentials for administrative access.</p>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>Email / User ID</label>
          <input type="text" placeholder="user@naksha.gov.in" style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>Password</label>
          <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
        </div>

        <button onClick={handleLoginSubmit} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Login to Dashboard</button>
        <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '12px' }}>Demo State — Authentication Bypass Enabled</div>
      </div>
    </div>
  );
}