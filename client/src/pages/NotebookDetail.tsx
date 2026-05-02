import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { notebookApi, entryApi, uploadApi } from '../api/routes';
import { useAuth } from '../App';

interface NotebookData {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string;
  is_public: number;
  owner_id: number;
  owner: { id: number; username: string; avatar: string };
}

interface EntryData {
  id: number;
  type: string;
  content: string;
  file_path: string;
  thumbnail_path: string;
  latitude: number | null;
  longitude: number | null;
  route_data: string;
  created_at: string;
  author_username: string;
  author_avatar: string;
  entry_date?: string;
  entry_location?: string;
}

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function NotebookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [notebook, setNotebook] = useState<NotebookData | null>(null);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<'text' | 'photo' | 'video' | 'audio' | 'route'>('text');
  const [newContent, setNewContent] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lon: number; name: string} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const isOwner = notebook?.owner_id === user?.id;

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    const searchLocation = async () => {
      if (locationSearch.length < 2) {
        setLocationResults([]);
        return;
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=5`
        );
        const data = await res.json();
        setLocationResults(data);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(searchLocation, 300);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [nbRes, entriesRes] = await Promise.all([
        notebookApi.get(Number(id)),
        entryApi.list(Number(id)),
      ]);
      setNotebook(nbRes.data.notebook);
      const entriesWithMeta = (entriesRes.data.entries || []).map((e: any) => {
        try {
          const meta = JSON.parse(e.content?.replace(/^__meta__:/, '') || '{}');
          return { ...e, entry_date: meta.date, entry_location: meta.location };
        } catch {
          return e;
        }
      });
      setEntries(entriesWithMeta);
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (result: LocationResult) => {
    setSelectedLocation({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      name: result.display_name.split(',').slice(0, 3).join(',')
    });
    setLocationSearch(result.display_name.split(',').slice(0, 3).join(','));
    setLocationResults([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setNewFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let filePath = '';
      let thumbnailPath = '';
      let entryLat = null;
      let entryLon = null;

      if (newFile) {
        const type = newType === 'photo' ? 'photo' : newType === 'video' ? 'video' : newType === 'audio' ? 'audio' : 'general';
        const res = await uploadApi.upload(newFile, type);
        filePath = res.data.file.path;
        thumbnailPath = res.data.file.thumbnail_path;
      }

      if (selectedLocation) {
        entryLat = selectedLocation.lat;
        entryLon = selectedLocation.lon;
      }

      const metaContent = newDate || newLocation ? JSON.stringify({ date: newDate, location: newLocation }) : '';
      const finalContent = metaContent ? `__meta__:${metaContent}\n${newContent}` : newContent;

      await entryApi.create(Number(id), {
        type: newType,
        content: finalContent,
        file_path: filePath,
        thumbnail_path: thumbnailPath,
        latitude: entryLat,
        longitude: entryLon,
      });

      setShowAdd(false);
      setNewContent('');
      setNewFile(null);
      setNewDate('');
      setNewLocation('');
      setLocationSearch('');
      setSelectedLocation(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('确定删除？')) return;
    try {
      await entryApi.delete(entryId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!notebook) {
    return <div className="flex items-center justify-center h-screen">记录本不存在</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-blue-500">Travel Journal</Link>
          <span className="text-gray-500">/</span>
          <span className="font-medium">{notebook.title}</span>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Link to={`/notebooks/${id}/share`} className="text-blue-500 hover:underline">分享</Link>
            <Link to={`/notebooks/${id}/edit`} className="text-blue-500 hover:underline">编辑</Link>
          </div>
        )}
      </header>

      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h1 className="text-2xl font-bold">{notebook.title}</h1>
          {notebook.description && <p className="text-gray-600 mt-2">{notebook.description}</p>}
          {notebook.location_name && <p className="text-gray-500 text-sm mt-2">📍 {notebook.location_name}</p>}
          {notebook.owner && <p className="text-gray-400 text-sm mt-2">by {notebook.owner.username}</p>}
        </div>

        {showAdd ? (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-bold mb-4">添加内容</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">类型</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="text">文字</option>
                  <option value="photo">照片</option>
                  <option value="video">视频</option>
                  <option value="audio">音频</option>
                  <option value="route">路线</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">日期</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">地点</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="搜索地点..."
                      className="w-full px-3 py-2 border rounded"
                    />
                    {locationResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-40 overflow-y-auto">
                        {locationResults.map((r) => (
                          <div
                            key={r.place_id}
                            onClick={() => handleSelectLocation(r)}
                            className="p-2 hover:bg-gray-50 cursor-pointer border-b text-sm"
                          >
                            {r.display_name.split(',').slice(0, 3).join(',')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">内容</label>
                {newType === 'text' ? (
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    rows={4}
                  />
                ) : newType === 'route' ? (
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder='格式: [{"lat": 39.9, "lng": 116.4}]'
                    className="w-full px-3 py-2 border rounded"
                    rows={4}
                  />
                ) : (
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept={
                      newType === 'photo' ? 'image/*' :
                      newType === 'video' ? 'video/*' :
                      newType === 'audio' ? 'audio/*' : '*'
                    }
                    className="w-full"
                  />
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    setNewDate('');
                    setNewLocation('');
                    setLocationSearch('');
                    setSelectedLocation(null);
                  }}
                  className="flex-1 py-2 border rounded hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full bg-white rounded-lg shadow p-4 mb-4 text-center text-gray-500 hover:bg-gray-50"
          >
            + 添加内容
          </button>
        )}

        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span>{entry.author_username}</span>
                  {entry.entry_date && <span className="text-blue-500">· {entry.entry_date}</span>}
                  {entry.entry_location && <span className="text-gray-500">📍 {entry.entry_location}</span>}
                  <span>· {new Date(entry.created_at).toLocaleString()}</span>
                </div>
                {isOwner && (
                  <button onClick={() => handleDeleteEntry(entry.id)} className="text-red-500 text-sm hover:underline">
                    删除
                  </button>
                )}
              </div>

              {entry.type === 'text' && (
                <p className="whitespace-pre-wrap">{entry.content.replace(/^__meta__:\{.*?\}\n/, '')}</p>
              )}

              {entry.type === 'photo' && entry.file_path && (
                <img src={entry.file_path} alt="" className="max-w-full rounded" />
              )}

              {entry.type === 'video' && entry.file_path && (
                <video src={entry.file_path} controls className="max-w-full rounded" />
              )}

              {entry.type === 'audio' && entry.file_path && (
                <audio src={entry.file_path} controls className="w-full" />
              )}

              {entry.type === 'route' && entry.route_data && (
                <div className="text-gray-600 text-sm">路线数据: {entry.route_data}</div>
              )}
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center text-gray-500 py-8">暂无内容，快来添加第一条吧！</div>
          )}
        </div>
      </div>
    </div>
  );
}