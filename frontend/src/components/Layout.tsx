import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'ri-dashboard-3-line', end: true },
  { to: '/smtps', label: 'SMTP Servers', icon: 'ri-mail-send-line' },
  { to: '/templates', label: 'Templates', icon: 'ri-file-text-line' },
  { to: '/recipient-lists', label: 'Recipient Lists', icon: 'ri-contacts-line' },
  { to: '/campaigns', label: 'Campaigns', icon: 'ri-megaphone-line' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r-2 border-dark-200 flex flex-col fixed h-screen">
        <div className="p-6 border-b-2 border-dark-200">
          <h1 className="text-lg font-bold font-mono text-dark-900 flex items-center">
            <i className="ri-rocket-2-fill text-primary-500 mr-2"></i>
            Icarus Mailer
          </h1>
          <p className="text-xs font-mono text-dark-500 mt-1">Lite Edition</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-lg font-mono text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-glow-red'
                    : 'text-dark-700 hover:bg-dark-100'
                }`
              }
            >
              <i className={`${item.icon} mr-3 text-lg`}></i>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t-2 border-dark-200">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs font-mono text-dark-500">Signed in as</p>
            <p className="text-sm font-mono font-bold text-dark-900 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2.5 rounded-lg font-mono text-sm font-bold text-dark-700 hover:bg-red-50 hover:text-primary-600 transition-colors"
          >
            <i className="ri-logout-box-line mr-3 text-lg"></i>
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
