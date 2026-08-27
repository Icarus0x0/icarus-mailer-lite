import { useEffect, useState } from 'react';
import { templateApi } from '../services/api';
import { Modal, Alert, ConfirmDialog } from '../components/Modal';

interface Template {
  id: number;
  name: string;
  subject: string;
  html_body: string | null;
  text_body: string | null;
}

const emptyForm = { name: '', subject: '', html_body: '', text_body: '' };

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Template | null>(null);

  const fetchTemplates = () => {
    setLoading(true);
    templateApi
      .list()
      .then((res) => setTemplates(res.data))
      .catch(() => setAlert({ type: 'error', message: 'Failed to load templates' }))
      .finally(() => setLoading(false));
  };

  useEffect(fetchTemplates, []);

  const openForm = (template?: Template) => {
    if (template) {
      setEditingId(template.id);
      setFormData({
        name: template.name,
        subject: template.subject,
        html_body: template.html_body ?? '',
        text_body: template.text_body ?? '',
      });
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
        await templateApi.update(editingId, formData);
        setAlert({ type: 'success', message: 'Template updated' });
      } else {
        await templateApi.create(formData);
        setAlert({ type: 'success', message: 'Template created' });
      }
      setShowForm(false);
      fetchTemplates();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? 'Failed to save template' });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await templateApi.delete(confirmDelete.id);
      setAlert({ type: 'success', message: 'Template deleted' });
      fetchTemplates();
    } catch {
      setAlert({ type: 'error', message: 'Failed to delete template' });
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
            <i className="ri-file-text-fill text-primary-500 mr-3"></i>
            Templates
          </h1>
          <p className="text-dark-600 mt-1 font-mono text-sm">Reusable email content for campaigns</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center space-x-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 hover:shadow-glow-red transition-all font-mono font-bold text-sm"
        >
          <i className="ri-add-circle-fill"></i>
          <span>NEW TEMPLATE</span>
        </button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="bg-white rounded-lg border-2 border-dark-200 overflow-hidden">
        {templates.length === 0 ? (
          <div className="px-6 py-16 text-center text-dark-500 font-mono">
            <i className="ri-file-text-line text-4xl mb-2 block text-dark-300"></i>
            No templates yet.
          </div>
        ) : (
          <div className="divide-y divide-dark-100">
            {templates.map((t) => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-dark-900">{t.name}</div>
                  <div className="text-xs font-mono text-dark-500 mt-0.5">{t.subject}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => openForm(t)} className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors" title="Edit">
                    <i className="ri-edit-2-fill text-lg"></i>
                  </button>
                  <button onClick={() => setConfirmDelete(t)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                    <i className="ri-delete-bin-fill text-lg"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Template' : 'New Template'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-mono font-bold text-dark-700 mb-2">HTML Body</label>
            <textarea
              rows={8}
              value={formData.html_body}
              onChange={(e) => setFormData({ ...formData, html_body: e.target.value })}
              className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono text-sm"
              placeholder="<p>Hello!</p>"
            />
          </div>
          <div>
            <label className="block text-sm font-mono font-bold text-dark-700 mb-2">Plain Text Body</label>
            <textarea
              rows={4}
              value={formData.text_body}
              onChange={(e) => setFormData({ ...formData, text_body: e.target.value })}
              className="w-full px-4 py-2 border-2 border-dark-300 rounded-lg focus:border-primary-500 focus:outline-none font-mono text-sm"
              placeholder="Hello!"
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
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
