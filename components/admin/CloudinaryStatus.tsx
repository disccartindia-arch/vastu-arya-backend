'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { uploadAPI } from '../../lib/api';

export default function CloudinaryStatus() {
  const [status, setStatus] = useState<'loading'|'ok'|'error'>('loading');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    uploadAPI.status().then((r:any)=>{ if(r?.data?.configured){setStatus('ok');setMsg(r.data.message);}else{setStatus('error');setMsg(r?.data?.message||'Cloudinary not configured');} }).catch(()=>{ setStatus('error');setMsg('Could not verify Cloudinary status'); });
  }, []);
  if (status==='loading') return null;
  if (status==='ok') return <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 mb-4"><CheckCircle size={13}/><span><strong>Cloudinary connected</strong> — images upload permanently to cloud storage</span></div>;
  return <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4"><AlertTriangle size={13} className="mt-0.5"/><div><strong>Image storage not configured</strong><p className="mt-0.5">{msg}</p><p className="mt-1">Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Render env vars</p></div></div>;
}
