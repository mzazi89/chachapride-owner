'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { fmtKsh } from '../../lib/format';
import Header from '../components/Header';

const STATUS_STYLES = {
  requested: 'bg-blue-100 text-blue-700',
  accepted: 'bg-indigo-100 text-indigo-700',
  en_route: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

const FILTERS = ['All', 'requested', 'accepted', 'en_route', 'completed', 'cancelled'];

function StatusPill({ status }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

export default function RidesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [rides, setRides] = useState(null);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Owner guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'owner')) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'owner') return;
    let cancelled = false;

    const query = filter === 'All' ? '' : `?status=${encodeURIComponent(filter)}`;
    fetch(`/api/owner/rides${query}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setRides(data.rides || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, filter]);

  if (authLoading || (loading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-blue-600 text-3xl" />
      </div>
    );
  }

  if (!user || user.role !== 'owner') return null; // redirecting

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">All rides</h1>
          <p className="text-gray-500 mt-1">
            Every booking across the platform, newest first.
          </p>
        </div>

        {/* Status filter row */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'All' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="uber-card p-6 overflow-hidden">
          {rides === null && !error ? (
            <div className="flex justify-center py-16">
              <FaSpinner className="animate-spin text-blue-600 text-3xl" />
            </div>
          ) : rides.length === 0 ? (
            <p className="text-gray-500 text-sm py-12 text-center">
              No rides{filter !== 'All' ? ` with status "${filter.replace('_', ' ')}"` : ''} yet.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Rider</th>
                    <th className="px-3 py-3 font-semibold">Pickup</th>
                    <th className="px-3 py-3 font-semibold">Destination</th>
                    <th className="px-3 py-3 font-semibold">Type</th>
                    <th className="px-3 py-3 font-semibold">Price</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Driver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rides.map((ride) => (
                    <tr key={ride.id} className="hover:bg-gray-50/60">
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500">
                        {new Date(ride.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        {ride.rider_name || '—'}
                      </td>
                      <td className="px-3 py-3 text-gray-600 max-w-[180px] truncate">
                        {ride.pickup}
                      </td>
                      <td className="px-3 py-3 text-gray-600 max-w-[180px] truncate">
                        {ride.destination}
                      </td>
                      <td className="px-3 py-3 text-gray-600 capitalize whitespace-nowrap">
                        {ride.ride_type}
                      </td>
                      <td className="px-3 py-3 font-bold text-gray-900 whitespace-nowrap">
                        {fmtKsh(ride.price)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <StatusPill status={ride.status} />
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                        {ride.driver_name || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
