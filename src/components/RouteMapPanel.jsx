import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";

const DEFAULT_CENTER = { lat: 43.8014, lng: -70.5053 };
const TEST_MODE = import.meta.env.MODE === "test";

export default function RouteMapPanel({ stops = [], path = [], imageUrl = "", selectedStopId, onSelectStop }) {
  const pathLatLng = useMemo(() => normalizePath(path), [path]);
  const markers = useMemo(() => buildStopMarkers(stops, pathLatLng), [pathLatLng, stops]);
  const center = markers[0]?.position || pathLatLng[0] || DEFAULT_CENTER;

  if (TEST_MODE) {
    return (
      <div className="route-map-shell route-map-test-shell">
        <p className="muted">Route map test placeholder</p>
      </div>
    );
  }

  if (!pathLatLng.length && !markers.length && imageUrl) {
    return (
      <div className="route-map-shell">
        <img className="route-image" src={imageUrl} alt="Route map preview" />
      </div>
    );
  }

  if (!pathLatLng.length && !markers.length) {
    return (
      <div className="route-map-empty">
        <p className="muted">No map geometry is available for this route yet.</p>
      </div>
    );
  }

  return (
    <div className="route-map-shell">
      <MapContainer center={center} zoom={10} scrollWheelZoom className="route-leaflet-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRouteBounds markers={markers} path={pathLatLng} />
        {pathLatLng.length > 1 && <Polyline positions={pathLatLng} pathOptions={{ color: "#1f8a78", weight: 5, opacity: 0.82 }} />}
        {markers.map((marker, index) => {
          const isSelected = String(marker.srId || "") === String(selectedStopId || "");
          return (
            <Marker
              key={`${marker.srId || marker.label}-${index}`}
              position={marker.position}
              icon={buildMarkerIcon(index + 1, isSelected)}
              eventHandlers={{
                click: () => marker.srId && onSelectStop?.(marker.srId),
              }}
            >
              <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
                <strong>{marker.label}</strong>
                <br />
                {marker.subject || marker.address || "Service Request"}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

function FitRouteBounds({ markers, path }) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...path.map((point) => [point.lat, point.lng]),
      ...markers.map((marker) => [marker.position.lat, marker.position.lng]),
    ];
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }
    map.fitBounds(points, { padding: [28, 28] });
  }, [map, markers, path]);

  return null;
}

function normalizePath(path) {
  return (Array.isArray(path) ? path : [])
    .map((point) => normalizeCoordinatePoint(point))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
    .map((point) => ({ lat: point.lat, lng: point.lng }));
}

function buildStopMarkers(stops, pathLatLng) {
  const rawStops = Array.isArray(stops) ? stops : [];
  const explicit = rawStops
    .map((stop, index) => {
      const point = normalizeCoordinatePoint(stop);
      if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;
      return {
        srId: stop?.srId || stop?.id || `${index + 1}`,
        label: stop?.label || `Stop ${index + 1}`,
        subject: stop?.subject || "",
        address: stop?.address || "",
        position: { lat: point.lat, lng: point.lng },
      };
    })
    .filter(Boolean);

  if (explicit.length) return explicit;
  if (!pathLatLng.length || !rawStops.length) return [];

  return rawStops.map((stop, index) => {
    const sampleIndex = Math.min(
      pathLatLng.length - 1,
      Math.round((index / Math.max(rawStops.length - 1, 1)) * (pathLatLng.length - 1))
    );
    return {
      srId: stop?.srId || stop?.id || `${index + 1}`,
      label: stop?.label || `Stop ${index + 1}`,
      subject: stop?.subject || "",
      address: stop?.address || "",
      position: pathLatLng[sampleIndex],
    };
  });
}

function normalizeCoordinatePoint(point) {
  if (Array.isArray(point) && point.length === 2) {
    return {
      lat: Number(point[0]),
      lng: Number(point[1]),
    };
  }

  return {
    lat: Number(point?.lat ?? point?.latitude ?? point?.coords?.[0]),
    lng: Number(point?.lng ?? point?.lon ?? point?.longitude ?? point?.coords?.[1]),
  };
}

function buildMarkerIcon(label, selected) {
  const background = selected ? "#c78b2c" : "#164e46";
  const color = selected ? "#081311" : "#f8faf7";
  return L.divIcon({
    className: "route-stop-div-icon",
    html: `<div class="route-stop-icon${selected ? " selected" : ""}" style="background:${background};color:${color};">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}
