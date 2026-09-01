'use client';
import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GoogleMutant from 'leaflet.gridlayer.googlemutant/src/Leaflet.GoogleMutant.mjs';
import { useRide } from '../context/RideContext';
import { reverseGeocode } from '../../lib/geocode';

// Official Google Maps requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
// Without it the app falls back to the Esri layers below.
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const USE_GOOGLE = Boolean(GOOGLE_KEY);

// Renders a real Google Maps basemap (via the official Google Maps JS API)
// inside the Leaflet map. Type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'.
function GoogleLayer({ type }) {
  const map = useMap();

  useEffect(() => {
    if (!USE_GOOGLE) return;
    let layer = null;
    let cancelled = false;

    const ensureApi = () =>
      new Promise((resolve) => {
        if (window.google && window.google.maps && window.google.maps.Map) return resolve(true);
        const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
        if (existing) {
          existing.addEventListener('load', () => resolve(true));
          existing.addEventListener('error', () => resolve(false));
          return;
        }
        const s = document.createElement('script');
        s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}`;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
      });

    ensureApi().then((ok) => {
      if (cancelled || !ok) return;
      layer = new GoogleMutant({ type });
      map.addLayer(layer);
    });

    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map, type]);

  return null;
}

const pickupIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const destinationIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const driverIcon = L.divIcon({
  className: '',
  html: '<div style="width:26px;height:26px;background:#2563eb;border:3px solid #fff;border-radius:8px 8px 8px 2px;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:13px">🚗</span></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 22],
});

const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 6px rgba(59,130,246,.25)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function RouteLayer({ from, to }) {
  const [route, setRoute] = useState(null);
  const map = useMap();

  useEffect(() => {
    let cancelled = false;
    if (!from || !to) {
      setRoute(null);
      return;
    }

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.lng},${from.lat};${to.lng},${to.lat}` +
      `?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.routes || data.routes.length === 0) return;
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRoute(coords);
        map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [from, to, map]);

  if (!route) return null;
  return (
    <Polyline positions={route} pathOptions={{ color: '#111827', weight: 4, opacity: 0.85 }} />
  );
}

function ClickHandler() {
  const { pickupCoords, setPickup, setDestination } = useRide();

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      const label = await reverseGeocode(lat, lng).catch(
        () => `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      );
      if (!pickupCoords) {
        setPickup(label, { lat, lng });
      } else {
        setDestination(label, { lat, lng });
      }
    },
  });

  return null;
}

/**
 * Interactive map. Reads pickup/destination from RideContext by default;
 * caller can override via props (used by the live trip tracker).
 */
export default function Map({
  pickupCoords: pOverride,
  destinationCoords: dOverride,
  driverLocation = null,
  showUser = true,
  interactive = true,
}) {
  const ctx = useRide();
  const pickupCoords = pOverride ?? ctx.pickupCoords;
  const destinationCoords = dOverride ?? ctx.destinationCoords;
  const { userLocation } = ctx;

  return (
    <MapContainer
      center={[-1.396, 36.7521]}
      zoom={14}
      scrollWheelZoom
      className="h-full w-full z-0"
    >
      {USE_GOOGLE ? (
        <GoogleLayer type="hybrid" />
      ) : (
        <>
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          />
        </>
      )}
      {pickupCoords && (
        <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon} />
      )}
      {destinationCoords && (
        <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destinationIcon} />
      )}
      {driverLocation && (
        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon} />
      )}
      {showUser && userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
      )}
      <RouteLayer from={pickupCoords} to={destinationCoords} />
      {interactive && <ClickHandler />}
    </MapContainer>
  );
}
