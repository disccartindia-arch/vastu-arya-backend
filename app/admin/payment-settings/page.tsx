'use client';
import { useEffect, useState } from 'react';
import { Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';

interface Settings {
  primaryUPI:       string;
  fallbackUPI:      string;
  payeeName:        string;
  upiEnabled:       boolean;
  fallbackEnabled:  boolean;
  razorpayEnabled:  boolean;
  codEnabled:       boolean;
}

const DEFAULT: Settings = {
  primaryUPI:      'VASTUARYA@ybl',
  fallbackUPI:     'ARYAVAR@ybl',
  payeeName:       'Vastu Arya',
  upiEnabled:      true,
  fallbackEnabled: true,
  razorpayEnabled: true,
  codEnabled:      false,
};

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.get('/payment/admin/upi-config')
      .then(r => setSettings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/payment/admin/upi-config', settings);
      showToast('Settings saved successfully!', true);
    } catch {
      showToast('Failed to save settings. Please try again.', false);
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, field, placeholder }: { label: string; field: keyof Settings; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        value={settings[field] as string}
        onChange={e => setSettings(s => ({ ...s, [field]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400"
      />
    </div>
  );

  const Toggle = ({ label, desc, field }: { label: string; desc: string; field: keyof Settings }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div>
        <p className="font-medium text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <button
        onClick={() => setSettings(s => ({ ...s, [field]: !s[field] }))}
        className={`relative w-12 h-6 rounded-full transition-colors ${settings[field] ? 'bg-orange-500' : 'bg-gray-300'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings[field] ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={24} className="animate-spin text-orange-500" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Configure UPI IDs and payment methods for VastuArya.</p>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium ${toast.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {toast.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        {/* UPI IDs */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">UPI Configuration</h2>
          <div className="space-y-4">
            <Field label="Primary UPI ID"  field="primaryUPI"  placeholder="VASTUARYA@ybl" />
            <Field label="Fallback UPI ID" field="fallbackUPI" placeholder="ARYAVAR@ybl" />
            <Field label="Payee Name"      field="payeeName"   placeholder="Vastu Arya" />
          </div>
        </div>

        {/* Payment method toggles */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Payment Methods</h2>
          <div className="space-y-3">
            <Toggle field="razorpayEnabled" label="Razorpay (Cards / NetBanking / UPI)" desc="Online card and netbanking payments" />
            <Toggle field="upiEnabled"      label="Direct UPI QR"                        desc="Customers scan QR and pay via UPI app" />
            <Toggle field="fallbackEnabled" label="Show Fallback UPI"                    desc="Show ARYAVAR@ybl if primary fails" />
            <Toggle field="codEnabled"      label="Cash on Delivery"                     desc="For product orders only" />
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
