'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FaDownload, FaCheckCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

export default function InstallPage() {
  const deferredRef = useRef(null);
  const stepsRef = useRef(null);
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      deferredRef.current = e;
      setDeferred(e);
    };
    const onInstalled = () => setInstalled(true);
    const checkInstalled = () => setInstalled(isStandalone());

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Only prompt inside a real user tap — browsers ignore/consume prompts fired
  // without one. If no prompt event is available, guide the user manually.
  const installNow = async () => {
    const ev = deferredRef.current;
    setBusy(true);
    try {
      if (ev) {
        await Promise.race([
          ev.prompt(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
        ]);
        deferredRef.current = null;
        setDeferred(null);
      } else {
        throw new Error('no-prompt');
      }
    } catch {
      setManual(true);
      setTimeout(() => {
        stepsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="uber-card text-center p-8">
          <div className="mx-auto mb-4 h-20 w-20 rounded-3xl bg-gradient-to-br from-slate-600 to-blue-500 flex items-center justify-center text-4xl shadow-lg">
            📊
          </div>
          <h1 className="text-2xl font-extrabold mb-1">Install the Owner app</h1>
          <p className="text-gray-500 text-sm mb-6">
            Manage your fleet straight from your home screen — like a real app.
          </p>

          {installed ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-700 flex items-center justify-center gap-2">
              <FaCheckCircle /> The app is installed — open it from your home screen.
            </div>
          ) : (
            <button
              onClick={installNow}
              disabled={busy}
              className="uber-button flex items-center justify-center gap-2 mb-4"
            >
              <FaDownload /> {busy ? 'Please wait...' : 'Install now'}
            </button>
          )}

          {manual && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2 text-left">
              <FaExclamationTriangle className="mt-0.5 shrink-0" />
              <span>
                Your browser didn&apos;t show a one-tap prompt — that&apos;s normal on some
                devices. Follow the steps below to add the app to your home screen.
              </span>
            </div>
          )}

          <div
            ref={stepsRef}
            className={`text-left bg-gray-50 rounded-2xl p-5 transition ${
              manual ? 'ring-2 ring-amber-300' : ''
            }`}
          >
            <h2 className="text-sm font-bold mb-3 text-gray-700">
              {isIOS() ? 'Install on iPhone / iPad' : 'Install on your device'}
            </h2>

            {isIOS() ? (
              <ol className="space-y-2.5 text-sm text-gray-600 list-decimal list-inside">
                <li>
                  Tap the <b>Share</b> button (square with an arrow) in the Safari toolbar.
                </li>
                <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                <li>
                  Tap <b>Add</b> (top right) — the app appears on your home screen.
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-sm text-gray-600 list-decimal list-inside">
                <li>
                  <b>Android</b>: open the browser menu (⋮) → <b>Install app</b> or{' '}
                  <b>Add to Home screen</b>.
                </li>
                <li>
                  <b>Chrome / Edge on computer</b>: click the install icon (monitor with a down
                  arrow) in the address bar.
                </li>
                <li>
                  <b>Other browsers</b>: use the <b>Add to Home screen</b> option from the browser
                  menu.
                </li>
              </ol>
            )}
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600"
          >
            <FaTimes /> Not now — back to the site
          </Link>
        </div>
      </div>
    </div>
  );
}
