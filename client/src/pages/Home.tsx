import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { notebookApi } from '../api/routes';
import { useAuth } from '../App';
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
  owner_id: number;
  owner_username?: string;
}

function MapMarkers({ notebooks, onSelect }: { notebooks: Notebook[]; onSelect: (id: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (notebooks.length > 0) {
      const validNotebooks = notebooks.filter(n => n.latitude && n.longitude);
      if (validNotebooks.length > 0) {
        const bounds = L.latLngBounds(validNotebooks.map(n => [n.latitude!, n.longitude!]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [notebooks, map]);

  return (
    <>
      {notebooks
        .filter(n => n.latitude && n.longitude)
        .map((n) => (
          <Marker
            key={n.id}
            position={[n.latitude!, n.longitude!]}
            icon={airplaneIcon}
            eventHandlers={{
              click: () => onSelect(n.id),
            }}
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
    </>
  );
}

export default function Home() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState<'mine' | 'shared' | 'public'>('mine');
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotebooks();
  }, [tab]);

  const loadNotebooks = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'mine') {
        res = await notebookApi.list();
      } else if (tab === 'shared') {
        res = await notebookApi.listShared();
      } else {
        res = await notebookApi.listPublic();
      }
      setNotebooks(res.data.notebooks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const handleSelectNotebook = (id: number) => {
    navigate(`/notebooks/${id}`);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-blue-500">Travel Journal</Link>
          <Link to="/explore" className="text-gray-600 hover:text-blue-500">公开广场</Link>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-gray-600">{user.username}</span>
          )}
          <button onClick={handleLogout} className="text-gray-600 hover:text-red-500">退出</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <Link
              to="/notebooks/new"
              className="block w-full bg-blue-500 text-white text-center py-2 rounded hover:bg-blue-600"
            >
              新建记录本
            </Link>
          </div>

          <div className="flex border-b">
            <button
              className={`flex-1 py-2 ${tab === 'mine' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600'}`}
              onClick={() => setTab('mine')}
            >
              我的
            </button>
            <button
              className={`flex-1 py-2 ${tab === 'shared' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600'}`}
              onClick={() => setTab('shared')}
            >
              参与的
            </button>
            <button
              className={`flex-1 py-2 ${tab === 'public' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600'}`}
              onClick={() => setTab('public')}
            >
              公开
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">加载中...</div>
            ) : notebooks.length === 0 ? (
              <div className="p-4 text-center text-gray-500">暂无记录本</div>
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
                    <p className="text-gray-400 text-xs mt-1">{n.location_name}</p>
                  )}
                  {tab === 'public' && n.owner_username && (
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
            <MapMarkers notebooks={notebooks} onSelect={handleSelectNotebook} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}