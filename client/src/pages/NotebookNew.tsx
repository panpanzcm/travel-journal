import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function LocationMarker({ 
  position, 
  setPosition 
}: { 
  position: [number, number] | null; 
  setPosition: (pos: [number, number]) => void;
}) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    if (position) {
      map.setView(position, 12);
    }
  }, [position, map]);

  return position ? <Marker position={position} icon={airplaneIcon} /> : null;
}

export default function NotebookNew() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const searchLocation = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(searchLocation, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (result: SearchResult) => {
    setPosition([parseFloat(result.lat), parseFloat(result.lon)]);
    setLocationName(result.display_name.split(',').slice(0, 3).join(','));
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await notebookApi.create({
        title,
        description,
        location_name: locationName,
        latitude: position?.[0],
        longitude: position?.[1],
        is_public: isPublic,
      });
      navigate(`/notebooks/${data.notebook.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center">
        <Link to="/" className="text-xl font-bold text-blue-500">Travel Journal</Link>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">新建记录本</h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">标题 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">地点搜索</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索地点..."
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-60 overflow-y-auto">
                    {searchResults.map((r) => (
                      <div
                        key={r.place_id}
                        onClick={() => handleSelectLocation(r)}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b"
                      >
                        {r.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {position && (
              <div className="mb-4">
                <div className="h-64 rounded overflow-hidden">
                  <MapContainer center={position} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
                <p className="text-gray-500 text-sm mt-1">{locationName}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">公开（所有人可见）</span>
              </label>
            </div>

            <div className="flex gap-4">
              <Link
                to="/"
                className="flex-1 text-center py-2 border rounded hover:bg-gray-50"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}