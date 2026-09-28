import React from 'react';
import { FAQS } from '../../data/mockData';
import { X, HelpCircle } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'absolute', top: '64px', right: '24px', width: '360px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 2000, padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}><HelpCircle size={16} /> Help & Documentation</span>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      {FAQS.map((faq, i) => (
        <div key={i} style={{ marginBottom: '12px', fontSize: '13px' }}>
          <div style={{ fontWeight: '600', color: '#0f172a' }}>{faq.q}</div>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{faq.a}</div>
        </div>
      ))}
    </div>
  );
}