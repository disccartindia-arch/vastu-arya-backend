'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { authAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Enter email and password');
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      if (!data.success) throw new Error(data.message);
      if (data.user.role !== 'admin') { toast.error('Access denied. Admin only.'); setLoading(false); return; }
      setAuth(data.user, data.token);
      toast.success('Welcome back, Admin!');
      router.push('/admin');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0D0500 0%, #1A0800 100%)' }}>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4" style={{ border: '2px solid rgba(212,160,23,0.4)' }}>
            <img src="/logo.jpg" alt="Vastu Arya" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Vastu Arya</h1>
          <p className="font-accent text-xs tracking-widest mt-1" style={{ color: '#D4A017' }}>ADMIN CONTROL PANEL</p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,160,23,0.18)' }}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@vastuarya.com"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-white text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,160,23,0.15)' }} required />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} placeholder="Enter password"
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-white text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,160,23,0.15)' }} required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-[#1A0A00] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #D4A017 0%, #F0C040 100%)' }}>
              {loading ? 'Signing in...' : 'Sign In to Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
