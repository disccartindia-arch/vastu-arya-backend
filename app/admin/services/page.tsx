'use client';
// Admin services page - full implementation in your original codebase
// This stub ensures the route compiles. Replace with your full page component.
import Link from 'next/link';
export default function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-gray-800 mb-4 capitalize">services</h1>
      <p className="text-gray-500 mb-4">This admin section is operational. Your full implementation from the original codebase should be placed here.</p>
      <Link href="/admin" className="text-primary hover:underline">← Back to Dashboard</Link>
    </div>
  );
}
