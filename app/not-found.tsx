import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D0500] flex items-center justify-center text-center px-4">
      <div>
        <div className="text-8xl mb-4">🕉️</div>
        <h1 style={{fontFamily:'Playfair Display,serif'}} className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-gray-300 text-xl mb-2">Page not found / पृष्ठ नहीं मिला</p>
        <p className="text-gray-500 text-sm mb-8">The page you are looking for does not exist.</p>
        <Link href="/" className="bg-[#FF6B00] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#E55A00] transition-all">Go Home / होम पर जाएं</Link>
      </div>
    </div>
  );
}
