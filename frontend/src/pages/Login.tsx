import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono text-dark-900 flex items-center justify-center">
            <i className="ri-rocket-2-fill text-primary-500 mr-3"></i>
            Icarus Mailer
          </h1>
          <p className="text-sm font-mono text-dark-500 mt-2">Lite Edition</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border-2 border-dark-200 p-8 space-y-5"
        >
          <h2 className="text-lg font-bold font-mono text-dark-900 mb-2">Sign in</h2>

          <div>
            <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-primary-50 border-l-4 border-primary-500 p-3 rounded-r">
              <p className="text-primary-900 text-sm font-mono">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 hover:shadow-glow-red transition-all font-mono font-bold disabled:opacity-50"
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="text-center text-xs font-mono text-dark-500 mt-6">
          Your login was generated during installation. See your terminal output from{' '}
          <code className="bg-dark-100 px-1.5 py-0.5 rounded">deploy/install.sh</code>.
        </p>
      </div>
    </div>
  );
}
