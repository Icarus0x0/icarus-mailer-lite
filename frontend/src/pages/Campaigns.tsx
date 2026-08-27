import { useEffect, useState } from 'react';
import { campaignApi, templateApi, recipientListApi } from '../services/api';
import { Modal, Alert, ConfirmDialog } from '../components/Modal';

interface Campaign {
  id: number;
  name: string;
  subject: string;
  status: 'draft' | 'queued' | 'sending' | 'paused' | 'completed';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
}

const statusColors: Record<string, string> = {
  draft: 'bg-dark-100 text-dark-700',
  queued: 'bg-blue-100 text-blue-700',
  sending: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', subject: '', template_id: '', recipient_list_id: '' });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Campaign | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([campaignApi.list(), templateApi.list(), recipientListApi.list()])
      .then(([c, t, l]) => {
        setCampaigns(c.data);
        setTemplates(t.data);
        setLists(l.data);
      })
      .catch(() => setAlert({ type: 'error', message: 'Failed to load campaigns' }))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []);

  useEffect(() => {
    const hasActive = campaigns.some((c) => c.status === 'sending' || c.status === 'queued');
    if (!hasActive) return;
    const interval = setInterval(() => {
      Promise.all([campaignApi.list()])
        .then(([c]) => setCampaigns(c.data))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [campaigns]);

  const openForm = () => {
    setFormData({ name: '', subject: '', template_id: '', recipient_list_id: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await campaignApi.create(formData);
      setAlert({ type: 'success', message: 'Campaign created as draft' });
      setShowForm(false);
      fetchAll();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? 'Failed to create campaign' });
    }
  };

  const runAction = async (id: number, action: 'launch' | 'pause' | 'resume') => {
    setBusyId(id);
    try {
      const res =
        action === 'launch' ? await campaignApi.launch(id) : action === 'pause' ? await campaignApi.pause(id) : await campaignApi.resume(id);
      setAlert({ type: 'success', message: res.data.message });
      fetchAll();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? `Failed to ${action} campaign` });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await campaignApi.delete(confirmDelete.id);
      setAlert({ type: 'success', message: 'Campaign deleted' });
      fetchAll();
    } catch {
      setAlert({ type: 'error', message: 'Failed to delete campaign' });
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
            <i className="ri-megaphone-fill text-primary-500 mr-3"></i>
            Campaigns
          </h1>
          <p className="text-dark-600 mt-1 font-mono text-sm">Create, launch, pause, and resume email campaigns</p>
        </div>
        <button
          onClick={openForm}
          disabled={!templates.length || !lists.length}
          className="flex items-center space-x-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 hover:shadow-glow-red transition-all font-mono font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title={!templates.length || !lists.length ? 'Create a template and a recipient list first' : ''}
        >
          <i className="ri-add-circle-fill"></i>
          <span>NEW CAMPAIGN</span>
        </button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="bg-white rounded-lg border-2 border-dark-200 overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="px-6 py-16 text-center text-dark-500 font-mono">
            <i className="ri-megaphone-line text-4xl mb-2 block text-dark-300"></i>
            No campaigns yet.
          </div>
        ) : (
          <div className="divide-y divide-dark-100">
            {campaigns.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-dark-900">{c.name}</div>
                  <div className="text-xs font-mono text-dark-500 mt-0.5">
                    {c.subject} · {c.sent_count}/{c.total_recipients} sent
                    {c.failed_count > 0 && <span className="text-primary-600"> · {c.failed_count} failed</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${statusColors[c.status]}`}>{c.status}</span>

                  {c.status === 'draft' && (
                    <button
                      onClick={() => runAction(c.id, 'launch')}
                      disabled={busyId === c.id}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-mono font-bold text-xs disabled:opacity-50"
                    >
                      <i className="ri-play-fill mr-1"></i>Launch
                    </button>
                  )}
                  {(c.status === 'sending' || c.status === 'queued') && (
                    <button
                      onClick={() => runAction(c.id, 'pause')}
                      disabled={busyId === c.id}
                      className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-mono font-bold text-xs disabled:opacity-50"
                    >
                      <i className="ri-pause-fill mr-1"></i>Pause
                    </button>
                  )}
                  {c.status === 'paused' && (
                    <button
                      onClick={() => runAction(c.id, 'resume')}
                      disabled={busyId === c.id}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-mono font-bold text-xs disabled:opacity-50"
                    >
                      <i className="ri-play-fill mr-1"></i>Resume
                    </button>
                  )}

                  <button onClick={() => setConfirmDelete(c)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                    <i className="ri-delete-bin-fill text-lg"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Campaign" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Name</label>
              <input
                type="text"
                required
                autoFocus
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Template</label>
            <select
              required
              value={formData.template_id}
              onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
              className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
            >
              <option value="">Select a template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Recipient List</label>
            <select
              required
              value={formData.recipient_list_id}
              onChange={(e) => setFormData({ ...formData, recipient_list_id: e.target.value })}
              className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
            >
              <option value="">Select a list…</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.total_count} recipients)
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border-2 border-dark-300 text-dark-700 rounded-lg hover:bg-dark-100 transition-colors font-mono font-bold"
            >
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-mono font-bold">
              Create Draft
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
