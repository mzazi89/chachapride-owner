'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import {
  FaSpinner,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaShieldAlt,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => `$${Number(n).toFixed(2)}`;

const STATUS_PILL = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  deposited: 'bg-blue-50 text-blue-700 border-blue-200',
  verified: 'bg-green-50 text-green-700 border-green-200',
};

const STATUS_LABEL = { pending: 'Due', deposited: 'Deposited', verified: 'Verified' };

export default function SettlementsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'owner') {
      router.replace('/login');
      return;
    }
    fetchData();
  }, [authLoading, user, router]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/owner/settlements');
      if (!res.ok) throw new Error('Failed to load settlements');
      const j = await res.json();
      setData(j);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerify = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/owner/settlements/${id}/verify`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to verify');
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center text-gray-500">
          <FaSpinner className="animate-spin mr-2" /> Loading...
        </main>
      </div>
    );
  }

  const { settlements, totals } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-2">
          <FaMoneyBillWave className="text-2xl text-emerald-600" />
          <h1 className="text-3xl font-extrabold">Commission settlements</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Cash rides: drivers deposit the commission to the account, then you verify it.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard icon={FaClock} label="Due" value={fmt(totals.total_pending)} accent="bg-amber-100 text-amber-600" />
          <SummaryCard icon={FaCheckCircle} label="Deposited" value={fmt(totals.total_deposited)} accent="bg-blue-100 text-blue-600" />
          <SummaryCard icon={FaShieldAlt} label="Verified" value={fmt(totals.total_verified)} accent="bg-green-100 text-green-600" />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {settlements.length === 0 ? (
          <div className="uber-card text-center py-12">
            <FaMoneyBillWave className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No cash settlements yet. They appear when cash rides are completed.
            </p>
          </div>
        ) : (
          <div className="uber-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-semibold">Driver</th>
                    <th className="px-4 py-3 font-semibold">Ride</th>
                    <th className="px-4 py-3 font-semibold">Fare</th>
                    <th className="px-4 py-3 font-semibold">Commission</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s) => (
                    <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-800">{s.driver_name}</p>
                        <p className="text-xs text-gray-400">
                          {s.driver_phone || s.driver_email}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-gray-600 max-w-[220px]">
                        <p className="truncate">{s.pickup} → {s.destination}</p>
                        <p className="text-xs text-gray-400">{s.ride_type}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-700">{fmt(s.price)}</td>
                      <td className="px-4 py-4 font-bold text-gray-800">{fmt(s.amount)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_PILL[s.status] || STATUS_PILL.pending}`}>
                          {STATUS_LABEL[s.status] || s.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {s.status === 'deposited' ? (
                          <button
                            onClick={() => handleVerify(s.id)}
                            disabled={busyId === s.id}
                            className="px-4 py-1.5 rounded-full bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {busyId === s.id ? <FaSpinner className="animate-spin" /> : 'Verify received'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="uber-card p-5 flex items-center gap-3">
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon />
      </span>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-extrabold">{value}</p>
      </div>
    </div>
  );
}
