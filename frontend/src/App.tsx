import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SmtpList from './pages/SmtpList';
import Templates from './pages/Templates';
import RecipientLists from './pages/RecipientLists';
import Campaigns from './pages/Campaigns';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="smtps" element={<SmtpList />} />
        <Route path="templates" element={<Templates />} />
        <Route path="recipient-lists" element={<RecipientLists />} />
        <Route path="campaigns" element={<Campaigns />} />
      </Route>
    </Routes>
  );
}
