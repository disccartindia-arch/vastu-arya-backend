'use client';
import { useEffect, useState } from 'react';
import { aiSettingsAPI, aiStatusAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Save, RotateCcw, Zap, CheckCircle, XCircle, Plus, X } from 'lucide-react';

const DEFAULT = {
  quickSuggestions: ['Financial problems','Relationship issues','Health problems','Career obstacles','Sleep disturbances','Family conflicts','Business losses','Child education'],
  ctaText: 'Book a Personal Consultation with Dr. PPS Tomar',
  maxRemedies: 5,
  language: 'both',
  responseStyle: 'detailed',
  systemPromptAddition: '',
};

export default function AISettingsPage() {
  const [settings, setSettings] = useState<any>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [newChip, setNewChip] = useState('');

  useEffect(() => {
    Promise.all([
      aiSettingsAPI.get().catch(() => ({ data: { data: DEFAULT } })),
      aiStatusAPI.check().catch(() => ({ data: { available: false } })),
    ]).then(([s, st]) => {
      setSettings(s?.data?.data || DEFAULT);
      setAiStatus(st?.data);
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await aiSettingsAPI.update(settings);
      toast.success('AI settings saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm('Reset AI settings to defaults?')) return;
    try { await aiSettingsAPI.reset(); setSettings(DEFAULT); toast.success('Reset done'); } catch { toast.error('Reset failed'); }
  };

  const addChip = () => {
    if (!newChip.trim()) return;
    setSettings((p: any) => ({ ...p, quickSuggestions: [...(p.quickSuggestions || []), newChip.trim()] }));
    setNewChip('');
  };
  const removeChip = (i: number) => setSettings((p: any) => ({ ...p, quickSuggestions: p.quickSuggestions.filter((_: any, idx: number) => idx !== i) }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-spin">🕉️</div></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-gray-800">AI Vastu Settings</h1><p className="text-gray-500 text-sm mt-1">Configure the AI Vastu guidance system</p></div>
        <div className="flex gap-2">
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"><RotateCcw size={14}/>Reset</button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark disabled:opacity-60"><Save size={14}/>{saving?'Saving…':'Save Changes'}</button>
        </div>
      </div>

      {/* AI Status */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${aiStatus?.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        {aiStatus?.available ? <CheckCircle size={20} className="text-green-600"/> : <XCircle size={20} className="text-red-500"/>}
        <div><p className="font-semibold text-sm">{aiStatus?.available ? 'AI System Online' : 'AI System Offline'}</p><p className="text-xs text-gray-500">{aiStatus?.message || (aiStatus?.available ? 'All AI features are working.' : 'Check ANTHROPIC_API_KEY in Render env vars.')}</p></div>
        {aiStatus?.model && <span className="ml-auto text-xs bg-white px-2 py-1 rounded-lg border font-mono">{aiStatus.model}</span>}
      </div>

      {/* Quick Suggestions */}
      <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-1">Quick Suggestion Chips</h2>
        <p className="text-xs text-gray-400 mb-4">Shown as clickable chips on the Vastu AI page</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(settings.quickSuggestions || []).map((c: string, i: number) => (
            <span key={i} className="flex items-center gap-1.5 bg-orange-50 text-orange-800 text-sm px-3 py-1.5 rounded-full border border-orange-200">
              {c}<button onClick={() => removeChip(i)} className="text-orange-400 hover:text-red-500"><X size={12}/></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newChip} onChange={e => setNewChip(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChip()} placeholder="Add suggestion…" className="flex-1 px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
          <button onClick={addChip} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium flex items-center gap-1"><Plus size={14}/>Add</button>
        </div>
      </div>

      {/* CTA Text */}
      <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-1">Consultation CTA Text</h2>
        <p className="text-xs text-gray-400 mb-3">Text shown in the AI results popup to encourage booking</p>
        <input value={settings.ctaText || ''} onChange={e => setSettings((p: any) => ({ ...p, ctaText: e.target.value }))} className="w-full px-4 py-3 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
      </div>

      {/* Response Settings */}
      <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">Response Configuration</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Max Remedies Shown</label>
            <select value={settings.maxRemedies || 5} onChange={e => setSettings((p: any) => ({ ...p, maxRemedies: +e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
              {[3,4,5,6,7].map(n => <option key={n} value={n}>{n} remedies</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Response Language</label>
            <select value={settings.language || 'both'} onChange={e => setSettings((p: any) => ({ ...p, language: e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
              <option value="en">English only</option><option value="hi">Hindi only</option><option value="both">Both (detect)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Response Style</label>
            <select value={settings.responseStyle || 'detailed'} onChange={e => setSettings((p: any) => ({ ...p, responseStyle: e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
              <option value="concise">Concise</option><option value="detailed">Detailed</option><option value="comprehensive">Comprehensive</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Additional System Prompt (optional)</label>
          <textarea value={settings.systemPromptAddition || ''} onChange={e => setSettings((p: any) => ({ ...p, systemPromptAddition: e.target.value }))} rows={3} placeholder="Extra instructions for the AI (added to base prompt)…" className="w-full px-4 py-3 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"/>
        </div>
      </div>
    </div>
  );
}
