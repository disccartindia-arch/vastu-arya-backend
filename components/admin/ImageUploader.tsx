'use client';
import { useState } from 'react';
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react';
import { uploadAPI } from '../../lib/api';
import toast from 'react-hot-toast';

interface Props { images: string[]; onChange: (images: string[]) => void; maxImages?: number; label?: string; }

export default function ImageUploader({ images, onChange, maxImages = 5, label = 'Images' }: Props) {
  const [uploading, setUploading] = useState<number | null>(null);

  const handleFileSelect = async (file: File, idx: number) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(idx);
    try {
      const fd = new FormData(); fd.append('image', file);
      const { data } = await uploadAPI.single(fd);
      const updated = [...images]; updated[idx] = data.data.url; onChange(updated);
      toast.success('Image uploaded!');
    } catch { toast.error('Upload failed.'); } finally { setUploading(null); }
  };

  const removeImage = (idx: number) => { const updated = images.filter((_,i)=>i!==idx); onChange(updated.length?updated:['']); };
  const addSlot = () => { if (images.length < maxImages) onChange([...images, '']); };
  const handleUrlChange = (idx: number, url: string) => { const updated = [...images]; updated[idx] = url; onChange(updated); };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{label} ({images.filter(u=>u.trim()).length}/{maxImages})</label>
      <div className="space-y-2">
        {images.map((url, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border-2 border-dashed border-orange-200 bg-orange-50 flex items-center justify-center">
              {uploading===idx?<Loader2 size={18} className="text-primary animate-spin"/>:url?<img src={url} alt="" className="w-full h-full object-cover"/>:<ImagePlus size={18} className="text-gray-300"/>}
            </div>
            <label className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl font-semibold cursor-pointer border transition-all flex-shrink-0 ${uploading!==null?'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200':'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-primary'}`}>
              {uploading===idx?<><Loader2 size={11} className="animate-spin"/>Uploading…</>:<><Upload size={11}/>Upload</>}
              <input type="file" accept="image/*" className="hidden" disabled={uploading!==null} onChange={e=>{const f=e.target.files?.[0];if(f)handleFileSelect(f,idx);e.target.value='';}}/>
            </label>
            <input value={url} onChange={e=>handleUrlChange(idx,e.target.value)} className="flex-1 px-3 py-2.5 border border-orange-200 rounded-xl text-xs focus:outline-none focus:border-primary" placeholder="Or paste URL…"/>
            {images.length>1&&<button type="button" onClick={()=>removeImage(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg flex-shrink-0"><X size={13}/></button>}
          </div>
        ))}
      </div>
      {images.length<maxImages&&<button type="button" onClick={addSlot} className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"><ImagePlus size={12}/> Add another image</button>}
    </div>
  );
}
