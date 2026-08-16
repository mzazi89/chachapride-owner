'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import {
  FaSpinner,
  FaEnvelopeOpenText,
  FaTrash,
  FaEnvelope,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'owner') {
      router.replace('/login');
      return;
    }
    fetchMessages();
  }, [authLoading, user, router]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/owner/messages');
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/owner/messages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || messages === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center text-gray-500">
          <FaSpinner className="animate-spin mr-2" /> Loading...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <FaEnvelopeOpenText className="text-2xl text-gray-500" />
          <h1 className="text-3xl font-extrabold">Contact messages</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="uber-card text-center py-12">
            <FaEnvelope className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet. The contact form on the rider site lands here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="uber-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800">{m.name}</p>
                    <a
                      href={`mailto:${m.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {m.email}
                    </a>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(m.created_at).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    className="shrink-0 p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    aria-label="Delete message"
                  >
                    {deletingId === m.id ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaTrash />
                    )}
                  </button>
                </div>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {m.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
