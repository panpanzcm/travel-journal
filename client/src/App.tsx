import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { User } from './api/routes';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import NotebookNew from './pages/NotebookNew';
import NotebookDetail from './pages/NotebookDetail';
import NotebookShare from './pages/NotebookShare';
import Explore from './pages/Explore';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/notebooks/new" element={<ProtectedRoute><NotebookNew /></ProtectedRoute>} />
        <Route path="/notebooks/:id" element={<ProtectedRoute><NotebookDetail /></ProtectedRoute>} />
        <Route path="/notebooks/:id/share" element={<ProtectedRoute><NotebookShare /></ProtectedRoute>} />
        <Route path="/explore" element={<Explore />} />
      </Routes>
    </AuthContext.Provider>
  );
}

export default App;