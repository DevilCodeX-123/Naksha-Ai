import React from 'react';
import { NOTIFICATIONS } from '../../data/mockData';
import { X, Bell } from 'lucide-react';

export default function NotificationsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'absolute', top: '64px', right: '24px', width: '340px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 2000, padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}><Bell size={16} /> Notifications</span>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      {NOTIFICATIONS.map(n => (
        <div key={n.id} style={{ marginBottom: '12px', fontSize: '13px' }}>
          <div style={{ fontWeight: '600', color: '#334155' }}>{n.title}</div>
          <div style={{ color: '#64748b', fontSize: '12px' }}>{n.detail}</div>
          <small style={{ color: '#94a3b8' }}>{n.date}</small>
        </div>
      ))}
    </div>
  );
}