import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { smtpApi, templateApi, recipientListApi, campaignApi } from '../services/api';

export default function Dashboard() {
  const [counts, setCounts] = useState({ smtps: 0, templates: 0, lists: 0, campaigns: 0 });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([smtpApi.list(), templateApi.list(), recipientListApi.list(), campaignApi.list()])
      .then(([smtps, templates, lists, camps]) => {
        setCounts({
          smtps: smtps.data.length,
          templates: templates.data.length,
          lists: lists.data.length,
          campaigns: camps.data.length,
        });
        setCampaigns(camps.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'SMTP Servers', count: counts.smtps, icon: 'ri-mail-send-line', to: '/smtps' },
    { label: 'Templates', count: counts.templates, icon: 'ri-file-text-line', to: '/templates' },
    { label: 'Recipient Lists', count: counts.lists, icon: 'ri-contacts-line', to: '/recipient-lists' },
    { label: 'Campaigns', count: counts.campaigns, icon: 'ri-megaphone-line', to: '/campaigns' },
  ];

  const statusColors: Record<string, string> = {
    draft: 'bg-dark-100 text-dark-700',
    sending: 'bg-blue-100 text-blue-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900 font-mono flex items-center">
          <i className="ri-dashboard-3-fill text-primary-500 mr-3"></i>
          Dashboard
        </h1>
        <p className="text-dark-600 mt-1 font-mono text-sm">Overview of your account</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="bg-white rounded-lg border-2 border-dark-200 p-5 hover:border-primary-300 hover:shadow-glow-red transition-all"
          >
            <i className={`${c.icon} text-primary-500 text-2xl`}></i>
            <div className="mt-3 text-2xl font-bold font-mono text-dark-900">
              {loading ? '…' : c.count}
            </div>
            <div className="text-xs font-mono text-dark-500 uppercase tracking-wider mt-1">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg border-2 border-dark-200">
        <div className="px-6 py-4 border-b-2 border-dark-200 flex items-center justify-between">
          <h2 className="font-bold font-mono text-dark-900">Recent Campaigns</h2>
          <Link to="/campaigns" className="text-xs font-mono font-bold text-primary-600 hover:text-primary-700">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-dark-100">
          {campaigns.length === 0 ? (
            <div className="px-6 py-10 text-center text-dark-500 font-mono text-sm">
              <i className="ri-megaphone-line text-3xl mb-2 block text-dark-300"></i>
              No campaigns yet.
            </div>
          ) : (
            campaigns.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-dark-900 text-sm">{c.name}</div>
                  <div className="text-xs font-mono text-dark-500 mt-0.5">
                    {c.sent_count}/{c.total_recipients} sent
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${statusColors[c.status] ?? 'bg-dark-100 text-dark-700'}`}>
                  {c.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
