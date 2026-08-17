'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  FaCar,
  FaCheckCircle,
  FaDollarSign,
  FaRoute,
  FaUsers,
  FaMoneyBillWave,
  FaUserCheck,
  FaCircle,
  FaSpinner,
  FaMapMarkedAlt,
  FaArrowRight,
} from 'react-icons/fa';
import { fmtKsh } from '../lib/format';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';

const LiveMap = dynamic(() => import('./components/LiveMap'), { ssr: false });

const STATUS_STYLES = {
  requested: 'bg-blue-100 text-blue-700',
  accepted: 'bg-indigo-100 text-indigo-700',
  en_route: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

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

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="uber-card p-6">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${accent}`}
        >
          <Icon />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-extrabold text-gray-900 truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [recent, setRecent] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Owner guard: redirect non-owner accounts away.
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'owner')) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'owner') return;

    let cancelled = false;

    Promise.all([
      fetch('/api/owner/stats'),
      fetch('/api/owner/tracking'),
      fetch('/api/owner/rides'),
      fetch('/api/owner/revenue?days=7'),
    ])
      .then(async ([statsRes, trackingRes, ridesRes, revenueRes]) => {
        if (!statsRes.ok || !trackingRes.ok || !ridesRes.ok || !revenueRes.ok) {
          const msg =
            (await statsRes.json().catch(() => ({}))).error ||
            'Failed to load dashboard data.';
          throw new Error(msg);
        }
        const [statsData, trackingData, ridesData, revenueData] = await Promise.all([
          statsRes.json(),
          trackingRes.json(),
          ridesRes.json(),
          revenueRes.json(),
        ]);
        if (cancelled) return;
        setStats(statsData.stats);
        setTracking(trackingData.rides || []);
        setRecent((ridesData.rides || []).slice(0, 5));
        setRevenue(revenueData);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load dashboard data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading || (loading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-blue-600 text-3xl" />
      </div>
    );
  }

  if (!user || user.role !== 'owner') return null; // redirecting

  const fmtMoney = (n) => fmtKsh(n);

  const cards = [
    { key: 'total_rides', icon: FaCar, label: 'Total rides', accent: 'bg-blue-100 text-blue-600' },
    { key: 'completed_rides', icon: FaCheckCircle, label: 'Completed rides', accent: 'bg-green-100 text-green-600' },
    { key: 'total_revenue', icon: FaDollarSign, label: 'Total revenue', accent: 'bg-emerald-100 text-emerald-600', fmt: fmtMoney },
    { key: 'active_rides', icon: FaRoute, label: 'Active rides', accent: 'bg-purple-100 text-purple-600' },
    { key: 'total_drivers', icon: FaUsers, label: 'Total drivers', accent: 'bg-blue-100 text-blue-600' },
    { key: 'pending_commission', icon: FaMoneyBillWave, label: 'Pending commission', fmt: (v) => fmtKsh(v), accent: 'bg-violet-100 text-violet-600' },
    { key: 'approved_drivers', icon: FaUserCheck, label: 'Approved drivers', accent: 'bg-indigo-100 text-indigo-600' },
    { key: 'online_drivers', icon: FaCircle, label: 'Online drivers', accent: 'bg-green-100 text-green-600' },
  ];

  const activeRides = tracking || [];

  // Revenue bar chart (pure SVG, no chart library)
  const renderRevenueChart = () => {
    if (!revenue || revenue.series.length === 0) return null;
    const max = Math.max(...revenue.series.map((s) => s.revenue), 1);
    const barW = 44;
    const gap = 14;
    const height = 180;
    return (
      <div>
        <svg
          viewBox={`0 0 ${revenue.series.length * (barW + gap)} ${height + 34}`}
          className="w-full"
          style={{ maxHeight: 240 }}
        >
          {revenue.series.map((s, i) => {
            const h = Math.max(3, (s.revenue / max) * height);
            const x = i * (barW + gap);
            const y = height - h;
            return (
              <g key={s.day}>
                <rect x={x} y={y} width={barW} height={h} rx={6} className="fill-blue-600" />
                {s.revenue > 0 && (
                  <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="11" className="fill-gray-500 font-semibold">
                    KSh {Math.round(s.revenue)}
                  </text>
                )}
                <text x={x + barW / 2} y={height + 20} textAnchor="middle" fontSize="11" className="fill-gray-400">
                  {s.label}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-sm text-gray-500">
          Last 7 days ·{' '}
          <span className="font-bold text-gray-800">{fmtMoney(revenue.total)}</span>{' '}
          total revenue
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Owner dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user.name.split(' ')[0]} — here&apos;s what&apos;s
            happening with chachapride.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {!stats && !error && (
          <div className="flex items-center justify-center py-16">
            <FaSpinner className="animate-spin text-blue-600 text-3xl" />
          </div>
        )}

        {stats && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {cards.map((c) => (
              <StatCard
                key={c.key}
                icon={c.icon}
                label={c.label}
                value={c.fmt ? c.fmt(stats[c.key]) : Number(stats[c.key] ?? 0).toLocaleString()}
                accent={c.accent}
              />
            ))}
          </section>
        )}

        {revenue && revenue.series.length > 0 && (
          <section className="uber-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaDollarSign className="text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Revenue trend</h2>
            </div>
            {renderRevenueChart()}
          </section>
        )}

        {activeRides.length > 0 && (
          <section className="uber-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FaMapMarkedAlt className="text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Live rides map
                </h2>
                <span className="ml-1 inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  {activeRides.length} active
                </span>
              </div>
              <span className="hidden sm:inline-block text-xs text-gray-400">
                Green = pickup · Red = dropoff · Blue = driver
              </span>
            </div>
            <div className="h-[420px] rounded-2xl overflow-hidden border border-gray-100">
              <LiveMap rides={activeRides} />
            </div>
          </section>
        )}

        <section className="uber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent rides</h2>
            <Link
              href="/rides"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all <FaArrowRight size={12} />
            </Link>
          </div>

          {recent === null ? (
            <div className="flex justify-center py-10">
              <FaSpinner className="animate-spin text-blue-600 text-2xl" />
            </div>
          ) : recent.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">
              No rides yet. Once riders start booking, you&apos;ll see them
              here.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map((ride) => (
                <li
                  key={ride.id}
                  className="py-3.5 flex flex-wrap items-center gap-x-4 gap-y-1"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {ride.pickup} → {ride.destination}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ride.rider_name || 'Rider'} ·{' '}
                      {new Date(ride.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {fmtMoney(ride.price)}
                  </span>
                  <StatusPill status={ride.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
