import { MapContainer, Marker, TileLayer, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "lendly-pin",
  html: `<span><i></i></span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export function LocationMap({
  latitude,
  longitude,
  address,
  radiusMeters,
  zoom = 15,
  showCircle = false,
}: {
  latitude: number;
  longitude: number;
  address: string;
  radiusMeters?: number;
  zoom?: number;
  showCircle?: boolean;
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={zoom}
      scrollWheelZoom={false}
      className="location-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={pinIcon}>
        <Popup>{address}</Popup>
      </Marker>
      {showCircle && radiusMeters ? (
        <Circle
          center={[latitude, longitude]}
          radius={radiusMeters}
          pathOptions={{ color: "var(--petrol)", weight: 2, fillColor: "var(--rain)", fillOpacity: 0.08 }}
        />
      ) : null}
    </MapContainer>
  );
}
