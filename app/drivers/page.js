'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCar,
  FaIdCard,
  FaEnvelope,
  FaClipboardCheck,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const STATUS_STYLES = {
  offline: 'bg-gray-100 text-gray-600',
  available: 'bg-green-100 text-green-700',
  on_trip: 'bg-blue-100 text-blue-700',
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

export default function DriversPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [drivers, setDrivers] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState({}); // { [driverId]: { type, text } }

  const loadDrivers = () =>
    fetch('/api/owner/drivers')
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((data) => setDrivers(data.drivers || []));

  // Owner guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'owner')) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'owner') return;
    let cancelled = false;

    loadDrivers()
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const toggleApproval = async (driver, approve) => {
    setBusyId(driver.id);
    setFeedback((f) => ({ ...f, [driver.id]: null }));
    try {
      const res = await fetch(`/api/owner/drivers/${driver.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: approve }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (HTTP ${res.status})`);
      }
      await loadDrivers();
      setFeedback((f) => ({
        ...f,
        [driver.id]: {
          type: 'success',
          text: approve
            ? `${driver.name} approved.`
            : `Approval revoked for ${driver.name}.`,
        },
      }));
    } catch (err) {
      setFeedback((f) => ({
        ...f,
        [driver.id]: { type: 'error', text: err.message },
      }));
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || (loading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-blue-600 text-3xl" />
      </div>
    );
  }

  if (!user || user.role !== 'owner') return null; // redirecting

  const pending = (drivers || []).filter((d) => !d.approved);
  const approvedList = (drivers || []).filter((d) => d.approved);

  const DriverRow = ({ driver }) => (
    <tr className="hover:bg-gray-50/60">
      <td className="px-4 py-4">
        <p className="font-semibold text-gray-900">{driver.name}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <FaEnvelope className="text-gray-400" /> {driver.email}
        </p>
      </td>
      <td className="px-4 py-4">
        <p className="text-gray-700 flex items-center gap-1.5">
          <FaCar className="text-gray-400" /> {driver.vehicle_model}
        </p>
        <p className="text-xs text-gray-500">{driver.plate_number}</p>
      </td>
      <td className="px-4 py-4 text-gray-600 flex items-center gap-1.5">
        <FaIdCard className="text-gray-400 hidden sm:inline" />
        {driver.license_number}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <StatusPill status={driver.status} />
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        {driver.approved ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <FaCheckCircle /> Approved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <FaExclamationTriangle /> Pending
          </span>
        )}
      </td>
      <td className="px-4 py-4 text-gray-700 whitespace-nowrap">
        {driver.ride_count} rides
      </td>
      <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
        {new Date(driver.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        {driver.approved ? (
          <button
            onClick={() => toggleApproval(driver, false)}
            disabled={busyId === driver.id}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {busyId === driver.id ? (
              <FaSpinner className="animate-spin inline" />
            ) : (
              'Revoke'
            )}
          </button>
        ) : (
          <button
            onClick={() => toggleApproval(driver, true)}
            disabled={busyId === driver.id}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {busyId === driver.id ? (
              <FaSpinner className="animate-spin inline" />
            ) : (
              'Approve'
            )}
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Driver management
          </h1>
          <p className="text-gray-500 mt-1">
            Review driver applications, approve new drivers, and revoke access
            when needed.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {drivers === null && !error ? (
          <div className="flex justify-center py-16">
            <FaSpinner className="animate-spin text-blue-600 text-3xl" />
          </div>
        ) : (
          <>
            {/* Pending drivers highlight */}
            {pending.length > 0 && (
              <section className="rounded-2xl bg-amber-50 border border-amber-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FaClipboardCheck className="text-amber-600" />
                  <h2 className="font-bold text-amber-800">
                    Pending approval ({pending.length})
                  </h2>
                </div>
                <p className="text-sm text-amber-700 mb-4">
                  {pending.length === 1
                    ? '1 driver is waiting for approval.'
                    : `${pending.length} drivers are waiting for approval.`}
                </p>
                <ul className="space-y-2">
                  {pending.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-amber-200"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{d.name}</p>
                        <p className="text-xs text-gray-500">
                          {d.vehicle_model} · {d.plate_number} ·{' '}
                          {d.license_number}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleApproval(d, true)}
                        disabled={busyId === d.id}
                        className="px-4 py-1.5 rounded-full text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {busyId === d.id ? (
                          <FaSpinner className="animate-spin inline" />
                        ) : (
                          'Approve'
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* All drivers table */}
            <section className="uber-card p-6 overflow-hidden">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                All drivers ({drivers.length})
              </h2>
              {drivers.length === 0 ? (
                <p className="text-gray-500 text-sm py-12 text-center">
                  No drivers have signed up yet.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                        <th className="px-4 py-3 font-semibold">Driver</th>
                        <th className="px-4 py-3 font-semibold">Vehicle</th>
                        <th className="px-4 py-3 font-semibold">License</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Approval</th>
                        <th className="px-4 py-3 font-semibold">Rides</th>
                        <th className="px-4 py-3 font-semibold">Joined</th>
                        <th className="px-4 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {drivers.map((d) => (
                        <DriverRow key={d.id} driver={d} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Inline feedback */}
              {Object.values(feedback).some(Boolean) && (
                <div className="mt-4 space-y-2">
                  {Object.entries(feedback)
                    .filter(([, f]) => f)
                    .map(([id, f]) => (
                      <div
                        key={id}
                        className={`text-sm px-4 py-2.5 rounded-xl ${
                          f.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-red-50 border border-red-200 text-red-600'
                        }`}
                      >
                        {f.text}
                      </div>
                    ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
