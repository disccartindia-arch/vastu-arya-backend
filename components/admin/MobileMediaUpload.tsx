'use client';
import { useState, useRef } from 'react';
import { Camera, Video, Link2, Loader2, X, CheckCircle, Play } from 'lucide-react';
import { uploadAPI } from '../../lib/api';
import toast from 'react-hot-toast';

interface MediaItem { url: string; type: 'image' | 'video'; thumbnail?: string; }
interface Props { media: MediaItem[]; onChange: (media: MediaItem[]) => void; maxItems?: number; }

function MediaPreview({ item, onRemove }: { item: MediaItem; onRemove: () => void }) {
  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-orange-200 bg-gray-900 group">
      {item.type === 'video' ? (
        <>
          <video src={item.url} className="w-full h-full object-cover" playsInline muted preload="metadata"/>
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <Play size={20} className="text-gray-800 ml-1"/>
            </div>
          </div>
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <Video size={10}/> VIDEO
          </div>
        </>
      ) : (
        <img src={item.url} alt="Media" className="w-full h-full object-cover"/>
      )}
      <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
        <CheckCircle size={10}/> Ready
      </div>
      <button onClick={onRemove} className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        <X size={14}/>
      </button>
    </div>
  );
}

export default function MobileMediaUpload({ media, onChange, maxItems = 3 }: Props) {
  const [uploading, setUploading] = useState<'image' | 'video' | null>(null);
  const [urlTab, setUrlTab] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlType, setUrlType] = useState<'image' | 'video'>('image');
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File, type: 'image' | 'video') => {
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    const maxLabel = type === 'video' ? '50MB' : '10MB';
    if (file.size > maxSize) { toast.error(`${type === 'video' ? 'Video' : 'Image'} must be under ${maxLabel}`); return; }
    setUploading(type);
    try {
      const fd = new FormData(); fd.append('image', file);
      const { data } = await uploadAPI.single(fd);
      const newMedia: MediaItem = { url: data.data.url, type };
      onChange([...media, newMedia]);
      toast.success(`${type === 'video' ? 'Video' : 'Photo'} uploaded!`);
    } catch { toast.error('Upload failed — check Cloudinary is configured'); }
    finally { setUploading(null); }
  };

  const addUrl = () => {
    if (!urlInput.trim()) return;
    onChange([...media, { url: urlInput.trim(), type: urlType }]);
    setUrlInput(''); toast.success('Media added!');
  };

  const canAdd = media.length < maxItems;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-gray-500">Post Media ({media.length}/{maxItems})</label>
        {media.length > 0 && <span className="text-xs text-green-600 font-semibold">{media.filter(m=>m.type==='video').length} video, {media.filter(m=>m.type==='image').length} photo</span>}
      </div>

      {/* Existing media */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {media.map((item, i) => (
            <MediaPreview key={i} item={item} onRemove={() => onChange(media.filter((_, idx) => idx !== i))}/>
          ))}
        </div>
      )}

      {canAdd && (
        <>
          {/* Tab toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-3 gap-1">
            <button onClick={() => setUrlTab(false)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${!urlTab ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}><Camera size={12}/>Camera / Gallery</button>
            <button onClick={() => setUrlTab(true)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${urlTab ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}><Link2 size={12}/>Paste URL</button>
          </div>

          {!urlTab ? (
            /* Upload buttons */
            <div className="grid grid-cols-2 gap-3">
              {/* Photo upload */}
              <label className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 cursor-pointer transition-all select-none ${uploading === 'image' ? 'border-orange-200 bg-orange-50' : 'border-primary bg-primary hover:bg-primary-dark'} text-white`}>
                {uploading === 'image' ? <><Loader2 size={24} className="animate-spin"/><span className="text-xs font-semibold">Uploading…</span></> : <><Camera size={24}/><span className="text-sm font-bold">Add Photo</span><span className="text-xs opacity-80">Camera or Gallery</span></>}
                <input ref={imgRef} type="file" accept="image/*" className="hidden" disabled={!!uploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f, 'image'); e.target.value = ''; }}/>
              </label>

              {/* Video upload */}
              <label className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 cursor-pointer transition-all select-none ${uploading === 'video' ? 'border-purple-200 bg-purple-50 text-purple-400' : 'border-purple-500 bg-purple-600 hover:bg-purple-700 text-white'}`}>
                {uploading === 'video' ? <><Loader2 size={24} className="animate-spin"/><span className="text-xs font-semibold">Uploading…</span></> : <><Video size={24}/><span className="text-sm font-bold">Add Video</span><span className="text-xs opacity-80">MP4, MOV (max 50MB)</span></>}
                <input ref={vidRef} type="file" accept="video/mp4,video/mov,video/avi,video/webm,video/*" className="hidden" disabled={!!uploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f, 'video'); e.target.value = ''; }}/>
              </label>
            </div>
          ) : (
            /* URL input */
            <div className="space-y-2">
              <div className="flex gap-2">
                <button onClick={() => setUrlType('image')} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${urlType==='image'?'bg-primary text-white border-primary':'border-gray-200 text-gray-600'}`}><Camera size={12}/>Photo</button>
                <button onClick={() => setUrlType('video')} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${urlType==='video'?'bg-purple-600 text-white border-purple-600':'border-gray-200 text-gray-600'}`}><Video size={12}/>Video</button>
              </div>
              <div className="flex gap-2">
                <input value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key==='Enter'&&addUrl()} placeholder={urlType==='video'?'Paste video URL (MP4, Cloudinary…)':'Paste image URL (Cloudinary, etc…)'} className="flex-1 px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
                <button onClick={addUrl} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium">Add</button>
              </div>
            </div>
          )}
        </>
      )}

      {!canAdd && <p className="text-center text-xs text-gray-400 mt-2">Maximum {maxItems} media items. Remove one to add more.</p>}
    </div>
  );
}
