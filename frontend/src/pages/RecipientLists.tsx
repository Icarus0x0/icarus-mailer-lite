import { useEffect, useState } from 'react';
import { recipientListApi } from '../services/api';
import { Modal, Alert, ConfirmDialog } from '../components/Modal';

interface RecipientList {
  id: number;
  name: string;
  total_count: number;
  total_recipients?: number;
}

export default function RecipientLists() {
  const [lists, setLists] = useState<RecipientList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [emails, setEmails] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RecipientList | null>(null);
  const [viewList, setViewList] = useState<{ name: string; recipients: any[] } | null>(null);

  const fetchLists = () => {
    setLoading(true);
    recipientListApi
      .list()
      .then((res) => setLists(res.data))
      .catch(() => setAlert({ type: 'error', message: 'Failed to load recipient lists' }))
      .finally(() => setLoading(false));
  };

  useEffect(fetchLists, []);

  const openForm = () => {
    setName('');
    setEmails('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await recipientListApi.create({ name, emails });
      setAlert({ type: 'success', message: `List created with ${res.data.total_count} recipient(s)` });
      setShowForm(false);
      fetchLists();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? 'Failed to create list' });
    }
  };

  const handleView = async (list: RecipientList) => {
    try {
      const res = await recipientListApi.get(list.id);
      setViewList({ name: list.name, recipients: res.data.recipients ?? [] });
    } catch {
      setAlert({ type: 'error', message: 'Failed to load recipients' });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await recipientListApi.delete(confirmDelete.id);
      setAlert({ type: 'success', message: 'List deleted' });
      fetchLists();
    } catch {
      setAlert({ type: 'error', message: 'Failed to delete list' });
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
            <i className="ri-contacts-fill text-primary-500 mr-3"></i>
            Recipient Lists
          </h1>
          <p className="text-dark-600 mt-1 font-mono text-sm">Paste emails, one per line — dedupe and validation applied automatically</p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center space-x-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 hover:shadow-glow-red transition-all font-mono font-bold text-sm"
        >
          <i className="ri-add-circle-fill"></i>
          <span>NEW LIST</span>
        </button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="bg-white rounded-lg border-2 border-dark-200 overflow-hidden">
        {lists.length === 0 ? (
          <div className="px-6 py-16 text-center text-dark-500 font-mono">
            <i className="ri-contacts-line text-4xl mb-2 block text-dark-300"></i>
            No recipient lists yet.
          </div>
        ) : (
          <div className="divide-y divide-dark-100">
            {lists.map((l) => (
              <div key={l.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-dark-900">{l.name}</div>
                  <div className="text-xs font-mono text-dark-500 mt-0.5">{l.total_count} recipients</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleView(l)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="View recipients">
                    <i className="ri-eye-line text-lg"></i>
                  </button>
                  <button onClick={() => setConfirmDelete(l)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                    <i className="ri-delete-bin-fill text-lg"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Recipient List" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-mono font-bold text-dark-700 mb-2">List Name</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Emails (one per line — "email,name" also works)</label>
            <textarea
              rows={10}
              required
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono text-sm"
              placeholder={'a@example.com\nb@example.com,Bob'}
            />
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
              Create
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewList} onClose={() => setViewList(null)} title={viewList?.name ?? ''} size="lg">
        <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-sm">
          {viewList?.recipients.map((r, i) => (
            <div key={i} className="px-3 py-1.5 border-b border-dark-100">
              {r.recipient_email} {r.recipient_name && <span className="text-dark-500">({r.recipient_name})</span>}
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Recipient List"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
