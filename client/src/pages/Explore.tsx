import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { notebookApi } from '../api/routes';
import airplaneIcon from '../utils/icons';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface Notebook {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string;
  is_public: number;
  owner_username: string;
}

export default function Explore() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotebooks();
  }, []);

  const loadNotebooks = async () => {
    setLoading(true);
    try {
      const res = await notebookApi.listPublic();
      setNotebooks(res.data.notebooks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-blue-500">Travel Journal</Link>
          <span className="text-gray-500">/</span>
          <span className="font-medium">公开广场</span>
        </div>
        <Link
          to="/login"
          className="text-blue-500 hover:underline"
        >
          登录
        </Link>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h1 className="font-bold">公开记录本</h1>
            <p className="text-gray-500 text-sm">浏览所有公开的旅游记录</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">加载中...</div>
            ) : notebooks.length === 0 ? (
              <div className="p-4 text-center text-gray-500">暂无公开记录本</div>
            ) : (
              notebooks.map((n) => (
                <Link
                  key={n.id}
                  to={`/notebooks/${n.id}`}
                  className="block p-4 border-b hover:bg-gray-50"
                >
                  <h3 className="font-medium">{n.title}</h3>
                  {n.description && (
                    <p className="text-gray-500 text-sm truncate">{n.description}</p>
                  )}
                  {n.location_name && (
                    <p className="text-gray-400 text-xs mt-1">📍 {n.location_name}</p>
                  )}
                  {n.owner_username && (
                    <p className="text-gray-400 text-xs">by {n.owner_username}</p>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="flex-1">
          <MapContainer center={[35, 105]} zoom={4} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {notebooks
              .filter(n => n.latitude && n.longitude)
              .map((n) => (
                <Marker
                  key={n.id}
                  position={[n.latitude!, n.longitude!]}
                  icon={airplaneIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <Link to={`/notebooks/${n.id}`} className="text-blue-500 hover:underline font-medium">
                        {n.title}
                      </Link>
                      {n.location_name && <div className="text-gray-500 text-sm">{n.location_name}</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}