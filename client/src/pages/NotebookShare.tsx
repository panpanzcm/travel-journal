import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { notebookApi, authApi } from '../api/routes';
import { useAuth } from '../App';

interface User {
  id: number;
  username: string;
  avatar: string;
}

interface Collaborator {
  id: number;
  user_id: number;
  username: string;
  avatar: string;
  role: string;
}

export default function NotebookShare() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [notebook, setNotebook] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 1) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await authApi.search(searchQuery);
        setSearchResults(res.data.users || []);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [nbRes, colRes] = await Promise.all([
        notebookApi.get(Number(id)),
        notebookApi.getCollaborators(Number(id)),
      ]);
      setNotebook(nbRes.data.notebook);
      setCollaborators(colRes.data.collaborators || []);
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId: number) => {
    // setSubmitting(true);
    try {
      await notebookApi.addCollaborator(Number(id), userId);
      setSearchQuery('');
      setSearchResults([]);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      // setSubmitting(false);
    }
  };

  const handleRemove = async (userId: number) => {
    if (!confirm('确定移除？')) return;
    try {
      await notebookApi.removeCollaborator(Number(id), userId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!notebook || notebook.owner_id !== user?.id) {
    return <div className="flex items-center justify-center h-screen">无权访问</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center">
        <Link to="/" className="text-xl font-bold text-blue-500">Travel Journal</Link>
        <span className="text-gray-500 mx-2">/</span>
        <Link to={`/notebooks/${id}`} className="font-medium hover:text-blue-500">{notebook.title}</Link>
        <span className="text-gray-500 mx-2">/</span>
        <span className="font-medium">分享</span>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">分享 "{notebook.title}"</h1>

          <div className="mb-6">
            <h2 className="text-lg font-medium mb-3">邀请协作者</h2>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索用户..."
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-60 overflow-y-auto">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleInvite(u.id)}
                      className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-gray-500">{u.username[0]}</span>
                        )}
                      </div>
                      <span>{u.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-3">协作者列表</h2>
            {collaborators.length === 0 ? (
              <p className="text-gray-500">暂无协作者</p>
            ) : (
              <div className="space-y-2">
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {c.avatar ? (
                          <img src={c.avatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-gray-500">{c.username[0]}</span>
                        )}
                      </div>
                      <span>{c.username}</span>
                    </div>
                    <button
                      onClick={() => handleRemove(c.user_id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <h2 className="text-lg font-medium mb-3">公开设置</h2>
            <p className="text-gray-600 mb-2">
              当前状态: {notebook.is_public ? '公开' : '私有'}
            </p>
            <Link
              to={`/notebooks/${id}`}
              className="text-blue-500 hover:underline"
            >
              返回记录本
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}