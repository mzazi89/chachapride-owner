'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import {
  FaSpinner,
  FaPlus,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function RideTypesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [rideTypes, setRideTypes] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // ride type being edited (or {new:true})
  const [form, setForm] = useState({ id: '', name: '', icon: '🚗', basePrice: '', perKm: '', capacity: 4, description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'owner') {
      router.replace('/login');
      return;
    }
    fetchTypes();
  }, [authLoading, user, router]);

  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/owner/ride-types');
      if (!res.ok) throw new Error('Failed to load ride types');
      const data = await res.json();
      setRideTypes(data.rideTypes);
    } catch (err) {
      setError(err.message);
    }
  };

  const startNew = () => {
    setForm({ id: '', name: '', icon: '🚗', basePrice: '', perKm: '', capacity: 4, description: '' });
    setEditing({ new: true });
    setFormError('');
  };

  const startEdit = (rt) => {
    setForm({
      id: rt.id,
      name: rt.name,
      icon: rt.icon,
      basePrice: Number(rt.base_price),
      perKm: Number(rt.per_km),
      capacity: rt.capacity,
      description: rt.description || '',
    });
    setEditing(rt);
    setFormError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch('/api/owner/ride-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          icon: form.icon,
          basePrice: Number(form.basePrice),
          perKm: Number(form.perKm),
          capacity: Number(form.capacity),
          description: form.description,
          active: editing?.new ? true : editing.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save ride type');
      setEditing(null);
      await fetchTypes();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rt) => {
    setBusyId(rt.id);
    try {
      const res = await fetch(`/api/owner/ride-types/${rt.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !rt.active }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      await fetchTypes();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || rideTypes === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-8 flex items-center justify-center text-gray-500 py-16">
          <FaSpinner className="animate-spin mr-2" /> Loading...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold">Ride types</h1>
            <p className="text-gray-500 text-sm mt-1">
              Fares are computed as base + per-km × distance. Inactive types are hidden from riders.
            </p>
          </div>
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            <FaPlus /> New ride type
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {editing && (
          <div className="uber-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {editing.new ? 'Add ride type' : `Edit ${editing.name}`}
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">ID (slug)</span>
                <input
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  placeholder="e.g. premium"
                  disabled={!editing.new}
                  className="uber-input mt-1 disabled:opacity-50"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Premium"
                  className="uber-input mt-1"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Icon (emoji)</span>
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="uber-input mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Base price ($)</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                  className="uber-input mt-1"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Per km ($)</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.perKm}
                  onChange={(e) => setForm({ ...form, perKm: e.target.value })}
                  className="uber-input mt-1"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Capacity (seats)</span>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="uber-input mt-1"
                  required
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-gray-500">Description</span>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="uber-input mt-1"
                />
              </label>
              {formError && (
                <p className="sm:col-span-2 text-sm text-red-600">{formError}</p>
              )}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  Save ride type
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="uber-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Base</th>
                  <th className="px-4 py-3 font-semibold">Per km</th>
                  <th className="px-4 py-3 font-semibold">Seats</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rideTypes.map((rt) => (
                  <tr key={rt.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-800">
                        {rt.icon} {rt.name}
                      </p>
                      <p className="text-xs text-gray-400">{rt.description || rt.id}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-700">${Number(rt.base_price).toFixed(2)}</td>
                    <td className="px-4 py-4 text-gray-700">${Number(rt.per_km).toFixed(2)}</td>
                    <td className="px-4 py-4 text-gray-700">{rt.capacity}</td>
                    <td className="px-4 py-4">
                      {rt.active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                          <FaCheckCircle /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                          <FaExclamationTriangle /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => startEdit(rt)}
                        className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(rt)}
                        disabled={busyId === rt.id}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                          rt.active
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {busyId === rt.id ? <FaSpinner className="animate-spin" /> : rt.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
