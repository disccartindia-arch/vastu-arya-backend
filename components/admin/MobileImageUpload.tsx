'use client';
import { useState, useRef } from 'react';
import { Camera, Link2, Loader2, X, CheckCircle } from 'lucide-react';
import { uploadAPI } from '../../lib/api';
import toast from 'react-hot-toast';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  height?: string;
}

export default function MobileImageUpload({ value, onChange, label = 'Photo', height = 'h-44' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'upload'|'url'>('upload');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const { data } = await uploadAPI.single(fd);
      onChange(data.data.url);
      toast.success('Photo uploaded!');
    } catch { toast.error('Upload failed — check Cloudinary settings'); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-2">{label}</label>

      {/* Preview */}
      {value ? (
        <div className={`relative w-full ${height} rounded-2xl overflow-hidden border-2 border-orange-200 mb-3 group`}>
          <img src={value} alt="Preview" className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button onClick={() => onChange('')} className="p-2 bg-red-500 rounded-full text-white shadow-lg"><X size={16}/></button>
          </div>
          <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-semibold"><CheckCircle size={11}/>Uploaded</div>
        </div>
      ) : (
        <div className={`w-full ${height} rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 flex items-center justify-center mb-3`}>
          <div className="text-center text-gray-400"><Camera size={28} className="mx-auto mb-1 opacity-50"/><p className="text-xs">No photo added yet</p></div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
        <button onClick={() => setTab('upload')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab==='upload'?'bg-white text-primary shadow-sm':'text-gray-500'}`}><Camera size={13}/>Camera / Gallery</button>
        <button onClick={() => setTab('url')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab==='url'?'bg-white text-primary shadow-sm':'text-gray-500'}`}><Link2 size={13}/>Paste URL</button>
      </div>

      {tab === 'upload' ? (
        <label className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 font-semibold text-sm cursor-pointer transition-all select-none ${uploading ? 'border-orange-200 bg-orange-50 text-orange-400' : 'border-primary bg-primary text-white hover:bg-primary-dark active:scale-95'}`}>
          {uploading ? <><Loader2 size={18} className="animate-spin"/>Uploading to Cloud…</> : <><Camera size={18}/>{value ? 'Change Photo' : '📸 Take Photo or Choose from Gallery'}</>}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}/>
        </label>
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://res.cloudinary.com/… or any image URL" className="w-full px-4 py-3 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
      )}

      {value && <p className="mt-2 text-xs text-gray-400 truncate">📎 {value.length > 60 ? value.slice(0, 57) + '…' : value}</p>}
    </div>
  );
}
