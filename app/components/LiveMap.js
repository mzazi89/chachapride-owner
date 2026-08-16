'use client';
import { Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
 */
export default function LiveMap({ rides }) {
  const first = rides && rides.length > 0 ? rides[0] : null;
  const center =
    first && first.pickup_lat != null
      ? [first.pickup_lat, first.pickup_lng]
      : [1.3521, 103.8198];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
  );
}
