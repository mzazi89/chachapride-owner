import Link from 'next/link';
import { FaChartPie } from 'react-icons/fa';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="uber-card text-center py-12">
        <FaChartPie className="text-6xl text-gray-300 mx-auto mb-4" />
        <h1 className="text-6xl font-black text-gray-200 mb-2">404</h1>
        <h2 className="text-2xl font-bold mb-2">Page not found</h2>
        <p className="text-gray-500 mb-6">That report doesn&apos;t exist.</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full text-white font-semibold transition bg-gradient-to-r from-blue-600 to-green-500 hover:brightness-110"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
