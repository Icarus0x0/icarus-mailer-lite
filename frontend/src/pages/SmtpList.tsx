import { useEffect, useState } from 'react';
import { smtpApi } from '../services/api';
import { Modal, Alert, ConfirmDialog } from '../components/Modal';

interface Smtp {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  encryption: string;
  from_email: string;
  from_name: string | null;
  active: boolean;
}

const emptyForm = {
  name: '',
  host: '',
  port: 587,
  username: '',
  password: '',
  encryption: 'tls',
  from_email: '',
  from_name: '',
};

export default function SmtpList() {
  const [smtps, setSmtps] = useState<Smtp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Smtp | null>(null);
  const [testModal, setTestModal] = useState<Smtp | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  const fetchSmtps = () => {
    setLoading(true);
    smtpApi
      .list()
      .then((res) => setSmtps(res.data))
      .catch(() => setAlert({ type: 'error', message: 'Failed to load SMTP servers' }))
      .finally(() => setLoading(false));
  };

  useEffect(fetchSmtps, []);

  const openForm = (smtp?: Smtp) => {
    if (smtp) {
      setEditingId(smtp.id);
      setFormData({ ...smtp, password: '' } as any);
    } else {
      setEditingId(null);
      setFormData(emptyForm);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await smtpApi.update(editingId, formData);
        setAlert({ type: 'success', message: 'SMTP server updated' });
      } else {
        await smtpApi.create(formData);
        setAlert({ type: 'success', message: 'SMTP server created' });
      }
      setShowForm(false);
      fetchSmtps();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? 'Failed to save SMTP server' });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await smtpApi.delete(confirmDelete.id);
      setAlert({ type: 'success', message: 'SMTP server deleted' });
      fetchSmtps();
    } catch {
      setAlert({ type: 'error', message: 'Failed to delete SMTP server' });
    }
  };

  const handleToggleActive = async (smtp: Smtp) => {
    try {
      await smtpApi.update(smtp.id, { active: !smtp.active });
      fetchSmtps();
    } catch {
      setAlert({ type: 'error', message: 'Failed to update status' });
    }
  };

  const handleTest = async () => {
    if (!testModal || !testEmail) return;
    setTesting(true);
    try {
      const res = await smtpApi.test(testModal.id, testEmail);
      setAlert({ type: res.data.success ? 'success' : 'error', message: res.data.message });
      if (res.data.success) setTestModal(null);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 font-mono flex items-center">
            <i className="ri-mail-send-fill text-primary-500 mr-3"></i>
            SMTP Servers
          </h1>
          <p className="text-dark-600 mt-1 font-mono text-sm">SMTP accounts used to send campaigns, rotated round-robin</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center space-x-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 hover:shadow-glow-red transition-all font-mono font-bold text-sm"
        >
          <i className="ri-add-circle-fill"></i>
          <span>ADD SMTP SERVER</span>
        </button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="bg-white rounded-lg border-2 border-dark-200 overflow-hidden">
        {smtps.length === 0 ? (
          <div className="px-6 py-16 text-center text-dark-500 font-mono">
            <i className="ri-mail-send-line text-4xl mb-2 block text-dark-300"></i>
            No SMTP servers yet.
          </div>
        ) : (
          <div className="divide-y divide-dark-100">
            {smtps.map((smtp) => (
              <div key={smtp.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-dark-900">{smtp.name}</div>
                  <div className="text-xs font-mono text-dark-500 mt-0.5">
                    {smtp.host}:{smtp.port} ({smtp.encryption}) · {smtp.from_email}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      smtp.active ? 'bg-green-100 text-green-700' : 'bg-dark-100 text-dark-500'
                    }`}
                  >
                    {smtp.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <button
                    onClick={() => {
                      setTestModal(smtp);
                      setTestEmail('');
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Send test email"
                  >
                    <i className="ri-send-plane-line text-lg"></i>
                  </button>
                  <button
                    onClick={() => handleToggleActive(smtp)}
                    className={`p-2 rounded-lg transition-colors ${smtp.active ? 'text-yellow-600 hover:bg-yellow-100' : 'text-green-600 hover:bg-green-100'}`}
                    title={smtp.active ? 'Deactivate' : 'Activate'}
                  >
                    <i className={smtp.active ? 'ri-toggle-fill text-lg' : 'ri-toggle-line text-lg'}></i>
                  </button>
                  <button
                    onClick={() => openForm(smtp)}
                    className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <i className="ri-edit-2-fill text-lg"></i>
                  </button>
                  <button
                    onClick={() => setConfirmDelete(smtp)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <i className="ri-delete-bin-fill text-lg"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit SMTP Server' : 'Add SMTP Server'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Host</label>
              <input
                type="text"
                required
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Port</label>
              <input
                type="number"
                required
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-mono font-bold text-dark-700 mb-2">
                Password {editingId && '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                required={!editingId}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Encryption</label>
            <select
              value={formData.encryption}
              onChange={(e) => setFormData({ ...formData, encryption: e.target.value })}
              className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
            >
              <option value="tls">STARTTLS (587)</option>
              <option value="ssl">SSL/TLS (465)</option>
              <option value="none">None (25)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-mono font-bold text-dark-700 mb-2">From Email</label>
              <input
                type="email"
                required
                value={formData.from_email}
                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-mono font-bold text-dark-700 mb-2">From Name</label>
              <input
                type="text"
                value={formData.from_name ?? ''}
                onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border-2 border-dark-300 text-dark-700 rounded-lg hover:bg-dark-100 transition-colors font-mono font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-mono font-bold"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!testModal} onClose={() => setTestModal(null)} title="Send Test Email" size="sm">
        <div className="space-y-4">
          <p className="text-sm font-mono text-dark-600">
            Send a real test email via <span className="font-bold text-dark-900">{testModal?.name}</span>.
          </p>
          <input
            type="email"
            autoFocus
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
          />
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setTestModal(null)}
              className="px-6 py-2 border-2 border-dark-300 text-dark-700 rounded-lg hover:bg-dark-100 transition-colors font-mono font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleTest}
              disabled={!testEmail || testing}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-mono font-bold disabled:opacity-50"
            >
              {testing ? 'Sending…' : 'Send Test'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete SMTP Server"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
