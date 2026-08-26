# Icarus Mailer Lite

A minimal, open-source cold email / campaign sending API — SMTP account management, templates, recipient lists, and campaign sending with basic round-robin SMTP rotation.

This is the free, stripped-down sibling of **Icarus Mailer Pro Enterprise**, which adds:

- Adaptive SMTP selection (health scoring, reputation gating, hourly rate-limit-aware rotation)
- Proxy-based sending-location masking
- Automatic DKIM signing per sending domain
- Deliverability testing: seed-account inbox placement checks, auto-pause/resume on spam-folder detection
- Bulk email validation and catch-all/MX-based domain intelligence
- Multi-provider sender-domain automation (Mailgun, SendGrid, Brevo, Mailjet, and more)
- A full email sorter/segmentation pipeline and mailbox automation
- A Telegram bot for remote campaign control

**→ [Pro Enterprise site — link coming soon]**

## What's included

- SMTP account CRUD + live test-send
- Email templates
- Recipient lists (paste emails or JSON)
- Campaigns: create, launch, pause, resume
- Simple round-robin rotation across your active SMTP accounts
- Token-based API auth (Laravel Sanctum)

## What's intentionally left out

Everything listed above under Pro Enterprise. This is a deliberately "lite" build — see Icarus Mailer Pro Enterprise for production-scale sending infrastructure.

## Requirements

- PHP 8.2+
- Composer

No external database server is required — this ships configured for SQLite out of the box.

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan serve
```

In a separate terminal, run a queue worker (campaigns send asynchronously):

```bash
php artisan queue:work
```

## Deploying to a fresh Ubuntu VPS

`deploy/install.sh` sets up a complete production instance on a fresh Ubuntu 22.04/24.04 server: PHP, MariaDB (with a freshly generated database password), Nginx, a Supervisor-managed queue worker, a free Let's Encrypt SSL certificate, and your login (with a randomly generated password, printed once at the end).

```bash
git clone <this-repo-url> icarus-mailer-lite
cd icarus-mailer-lite
sudo bash deploy/install.sh mail.yourdomain.com you@yourdomain.com owner@yourdomain.com
```

- Arg 1: the domain this instance will be served on
- Arg 2: your email, for Let's Encrypt renewal notices
- Arg 3: the email you'll log in with

**What it can't do:** point your domain's DNS at the server. No script can do that without your DNS provider's API credentials. The installer detects the server's public IP, tells you the exact A record to add, and waits for it to propagate before requesting the SSL certificate — so just add that one record when prompted.

This script is meant to be run once, against a fresh server. To add a second login afterward, run `php artisan app:create-admin you@example.com` directly on the server instead of re-running the installer.

## API quick start

```bash
# Register
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"You","email":"you@example.com","password":"password123","password_confirmation":"password123"}'

# Use the returned token for everything below
TOKEN="..."

# Add an SMTP account
curl -X POST http://localhost:8000/api/smtps \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"My SMTP","host":"smtp.example.com","port":587,"username":"user","password":"pass","encryption":"tls","from_email":"me@example.com","from_name":"Me"}'

# Create a template
curl -X POST http://localhost:8000/api/templates \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Welcome","subject":"Hi there","html_body":"<p>Hello!</p>","text_body":"Hello!"}'

# Create a recipient list (paste emails, one per line — "email,name" also works)
curl -X POST http://localhost:8000/api/recipient-lists \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"My list","emails":"a@example.com\nb@example.com,Bob"}'

# Create and launch a campaign
curl -X POST http://localhost:8000/api/campaigns \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","subject":"Hello","template_id":1,"recipient_list_id":1}'

curl -X POST http://localhost:8000/api/campaigns/1/launch -H "Authorization: Bearer $TOKEN"
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/register` | Create an account |
| POST | `/api/login` | Get an API token |
| POST | `/api/logout` | Revoke the current token |
| GET | `/api/me` | Current user |
| GET/POST | `/api/smtps` | List / create SMTP accounts |
| PUT/DELETE | `/api/smtps/{id}` | Update / delete an SMTP account |
| POST | `/api/smtps/{id}/test` | Send a live test email |
| GET/POST | `/api/templates` | List / create templates |
| PUT/DELETE | `/api/templates/{id}` | Update / delete a template |
| GET/POST | `/api/recipient-lists` | List / create recipient lists |
| GET/DELETE | `/api/recipient-lists/{id}` | View / delete a list |
| GET/POST | `/api/campaigns` | List / create campaigns |
| GET/DELETE | `/api/campaigns/{id}` | View / delete a campaign |
| POST | `/api/campaigns/{id}/launch` | Launch a draft campaign |
| POST | `/api/campaigns/{id}/pause` | Pause a sending campaign |
| POST | `/api/campaigns/{id}/resume` | Resume a paused campaign |

## License

MIT — see [LICENSE](LICENSE).
