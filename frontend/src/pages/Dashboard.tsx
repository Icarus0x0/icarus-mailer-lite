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

  const proFeatureGroups: { category: string; icon: string; items: string[] }[] = [
    {
      category: 'Deliverability',
      icon: 'ri-shield-check-fill',
      items: [
        'Adaptive SMTP rotation — live health scoring, reputation gating, and rate-limit-aware selection instead of blind round-robin',
        'Automatic DKIM signing per sending domain',
        'Seed-account inbox placement testing with auto-pause on spam-folder detection',
        'Bounce processing, suppression lists, and DMARC alignment checks',
        'One-click DNS automation — SPF/DKIM/DMARC records pushed and verified across your ESPs',
        'Malicious/blacklisted link scanning and vetted redirect domains to protect sender reputation',
        'Bulk email validation with catch-all and MX-based domain intelligence',
      ],
    },
    {
      category: 'AI & Automation',
      icon: 'ri-magic-fill',
      items: [
        'AI deliverability classifier that scores templates before you send',
        'AI template rewriting to fix content that scores poorly',
        'Self-running deliverability feedback loop that tests and adjusts sending behavior automatically',
        'Rule-based mailbox automation and a full email sorter/segmentation pipeline',
        'Scheduled campaign launching with automatic stuck-job recovery',
      ],
    },
    {
      category: 'Analytics & Reporting',
      icon: 'ri-bar-chart-box-fill',
      items: [
        'Open/click tracking with a real deliverability dashboard',
        'Recipient engagement and lead scoring',
        'Live queue-health monitoring',
      ],
    },
    {
      category: 'Infrastructure & Integrations',
      icon: 'ri-plug-fill',
      items: [
        'Proxy-based sending-location masking',
        'Multi-provider sender automation (Mailgun, SendGrid, Brevo, Mailjet, and more)',
        'IMAP mailbox monitoring and OAuth for Gmail/Microsoft inboxes',
        'Dropbox, Google Drive, OneDrive & SharePoint import/export',
        'OpenAI-powered content generation baked into the workflow',
        'A Telegram bot for remote campaign control from your phone',
      ],
    },
    {
      category: 'Team & Scale',
      icon: 'ri-team-fill',
      items: [
        'Multi-user accounts with an admin approval workflow',
        'Per-user throttle controls and dedicated sending-domain pools',
      ],
    },
  ];

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

      <div className="bg-white rounded-lg border-2 border-primary-300 overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-dark-200 bg-primary-50/40">
          <h2 className="font-bold font-mono text-dark-900 text-lg flex items-center">
            <i className="ri-rocket-2-fill text-primary-500 mr-2"></i>
            Lite gets your emails out the door. Advanced gets them into the inbox.
          </h2>
          <p className="text-dark-600 text-xs font-mono mt-1.5 max-w-3xl">
            Round-robin SMTP rotation is a coin flip on deliverability at scale. Icarus Mailer Advanced replaces it
            with live reputation scoring, AI-driven content and DNS automation, and full analytics — the same
            infrastructure serious senders rely on to actually land in the inbox, not the spam folder.
          </p>
        </div>
        <div className="px-6 py-5 grid md:grid-cols-2 gap-x-8 gap-y-6">
          {proFeatureGroups.map((group) => (
            <div key={group.category}>
              <div className="flex items-center text-primary-600 font-mono font-bold text-xs uppercase tracking-wider mb-2.5">
                <i className={`${group.icon} mr-1.5`}></i>
                {group.category}
              </div>
              <ul className="space-y-1.5">
                {group.items.map((f) => (
                  <li key={f} className="flex items-start text-sm font-mono text-dark-700">
                    <i className="ri-lock-2-fill text-dark-400 mr-2 mt-0.5 shrink-0 text-xs"></i>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 pt-2">
          <a
            href="https://icarus0x0.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 hover:shadow-glow-red transition-all font-mono font-bold text-sm"
          >
            <span>UPGRADE TO ICARUS MAILER ADVANCED</span>
            <i className="ri-external-link-line"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
