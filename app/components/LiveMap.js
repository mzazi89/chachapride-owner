'use client';
import { Fragment, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LAYERS = {
  streets: {
    name: 'Map',
    // Google roadmap — street + place names
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: 'mt0mt1mt2mt3',
    attribution: '&copy; <a href="https://maps.google.com">Google</a>',
  },
  satellite: {
    name: 'Satellite',
    // Google hybrid — satellite imagery with labels (names everywhere)
    url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
    subdomains: 'mt0mt1mt2mt3',
    attribution: '&copy; <a href="https://maps.google.com">Google</a>',
  },
  terrain: {
    name: 'Terrain',
    // Google terrain — with labels
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: 'mt0mt1mt2mt3',
    attribution: '&copy; <a href="https://maps.google.com">Google</a>',
  },
};

const pickupIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;background:#22c55e;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const destinationIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;background:#ef4444;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const driverIcon = L.divIcon({
  className: '',
  html: '<div style="width:26px;height:26px;background:#2563eb;border:3px solid #fff;border-radius:8px 8px 8px 2px;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:13px;line-height:1">🚗</span></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 22],
});

/**
 * Live owner tracking map. Rendered only client-side (lazy-loaded via
 * dynamic(..., { ssr: false }) from the dashboard page).
 * Layer switcher: Streets / Satellite / Terrain.
 */
export default function LiveMap({ rides }) {
  const first = rides && rides.length > 0 ? rides[0] : null;
  const center =
    first && first.pickup_lat != null
      ? [first.pickup_lat, first.pickup_lng]
      : [-1.396, 36.7521];
  const [layer, setLayer] = useState('satellite');
  const tile = LAYERS[layer];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer attribution={tile.attribution} url={tile.url} subdomains={tile.subdomains} />
        {rides.map((ride) => (
          <Fragment key={ride.id}>
            {ride.pickup_lat != null && ride.pickup_lng != null && (
              <Marker
                position={[ride.pickup_lat, ride.pickup_lng]}
                icon={pickupIcon}
              >
                <Tooltip direction="top" offset={[0, -14]}>
                  {ride.rider_name || 'Rider'} · pickup
                </Tooltip>
              </Marker>
            )}
            {ride.destination_lat != null && ride.destination_lng != null && (
              <Marker
                position={[ride.destination_lat, ride.destination_lng]}
                icon={destinationIcon}
              >
                <Tooltip direction="top" offset={[0, -14]}>
                  {ride.rider_name || 'Rider'} · dropoff
                </Tooltip>
              </Marker>
            )}
            {ride.driver_lat != null && ride.driver_lng != null && (
              <Marker
                position={[ride.driver_lat, ride.driver_lng]}
                icon={driverIcon}
              >
                <Tooltip direction="top" offset={[0, -18]}>
                  {ride.driver_name || 'Driver'}
                </Tooltip>
              </Marker>
            )}
          </Fragment>
        ))}
      </MapContainer>
      <div className="absolute top-3 left-3 z-[1000] flex rounded-lg overflow-hidden shadow-md bg-white text-xs border border-gray-200">
        {Object.entries(LAYERS).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setLayer(key)}
            className={
              layer === key
                ? 'px-3 py-1.5 font-semibold bg-blue-600 text-white'
                : 'px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition'
            }
          >
            {cfg.name}
          </button>
        ))}
      </div>
    </div>
  );
}
