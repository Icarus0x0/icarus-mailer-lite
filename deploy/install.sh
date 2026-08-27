#!/usr/bin/env bash
#
# Icarus Mailer Lite — one-shot Ubuntu VPS installer.
#
# Installs PHP, MariaDB, Nginx, Supervisor, and Certbot; creates a
# dedicated database with a randomly generated password; deploys this
# application; requests a free Let's Encrypt SSL certificate; sets up a
# Supervisor-managed queue worker; and creates your login with a randomly
# generated password.
#
# What this script CANNOT do: point your domain's DNS at this server.
# No script can do that without your DNS provider's API credentials — you
# have to add the record yourself. This script tells you exactly what to
# add and waits for it to propagate before requesting the SSL certificate.
#
# Usage (run from the root of a cloned copy of this repo, as root):
#   sudo bash deploy/install.sh mail.yourdomain.com you@yourdomain.com owner@yourdomain.com
#
#   Arg 1: the domain this instance will be served on
#   Arg 2: email address for Let's Encrypt renewal notices
#   Arg 3: the email address for your login (a random password is generated)

set -euo pipefail

# ── Args ─────────────────────────────────────────────────────────────────
DOMAIN="${1:-}"
LETSENCRYPT_EMAIL="${2:-}"
ADMIN_EMAIL="${3:-}"

if [[ -z "$DOMAIN" || -z "$LETSENCRYPT_EMAIL" || -z "$ADMIN_EMAIL" ]]; then
    echo "Usage: sudo bash deploy/install.sh <domain> <letsencrypt-email> <admin-email>"
    echo "Example: sudo bash deploy/install.sh mail.example.com me@example.com owner@example.com"
    exit 1
fi

if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root (try: sudo bash deploy/install.sh ...)"
    exit 1
fi

APP_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_USER="www-data"
DB_NAME="icarus_lite"
DB_USER="icarus_lite"
DB_PASSWORD="$(openssl rand -hex 20)"

echo "==> Installing Icarus Mailer Lite"
echo "    App path: $APP_PATH"
echo "    Domain:   $DOMAIN"
echo

# ── Detect PHP version to install (Ubuntu's ondrej/php PPA for a current release) ──
PHP_VERSION="8.3"

set_env_var() {
    local key="$1" value="$2" file="${3:-$APP_PATH/.env}"

    # Always double-quote the value — Laravel's dotenv parser treats
    # unquoted whitespace as a syntax error (APP_NAME=Icarus Mailer Lite
    # fails to parse; APP_NAME="Icarus Mailer Lite" is required). Escape
    # backslashes and double quotes so the value round-trips correctly.
    local dotenv_value="${value//\\/\\\\}"
    dotenv_value="${dotenv_value//\"/\\\"}"
    local line="${key}=\"${dotenv_value}\""

    # Escape for use as a sed replacement with | as the delimiter.
    local sed_escaped
    sed_escaped=$(printf '%s' "$line" | sed -e 's/[\/&|]/\\&/g')

    if grep -q "^${key}=" "$file" 2>/dev/null; then
        sed -i "s|^${key}=.*|${sed_escaped}|" "$file"
    else
        printf '%s\n' "$line" >>"$file"
    fi
}

# ── 1. System packages ──────────────────────────────────────────────────
echo "==> Installing system packages (this takes a few minutes)"
apt-get update -qq
apt-get install -y -qq software-properties-common ca-certificates lsb-release apt-transport-https curl gnupg2 dnsutils >/dev/null
add-apt-repository -y ppa:ondrej/php >/dev/null 2>&1 || true
apt-get update -qq

apt-get install -y -qq \
    "php${PHP_VERSION}-fpm" "php${PHP_VERSION}-cli" "php${PHP_VERSION}-mysql" \
    "php${PHP_VERSION}-mbstring" "php${PHP_VERSION}-xml" "php${PHP_VERSION}-curl" \
    "php${PHP_VERSION}-bcmath" "php${PHP_VERSION}-zip" "php${PHP_VERSION}-gd" \
    "php${PHP_VERSION}-sqlite3" \
    nginx mariadb-server supervisor certbot python3-certbot-nginx \
    git unzip >/dev/null

if ! command -v composer >/dev/null 2>&1; then
    echo "==> Installing Composer"
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer >/dev/null
fi

if ! command -v node >/dev/null 2>&1; then
    echo "==> Installing Node.js"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs >/dev/null
fi

# ── 2. Database ──────────────────────────────────────────────────────────
echo "==> Creating database and user"
systemctl enable --now mariadb >/dev/null 2>&1 || service mariadb start
mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
# CREATE USER IF NOT EXISTS is a full no-op — including the password —
# when the user already exists (e.g. re-running this script after an
# earlier attempt failed partway through). A fresh random DB_PASSWORD is
# generated every run, so without this the .env written below would end
# up with a password MySQL never actually set, and every DB query fails
# with "Access denied". Force-sync the password unconditionally instead.
mysql -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# ── 3. Application ───────────────────────────────────────────────────────
# Run as root throughout (this script already requires root) — ownership
# is fixed with a single chown -R at the end, after every artisan command
# that writes cache/log files has run.
echo "==> Installing PHP dependencies"
cd "$APP_PATH"
composer install --no-dev --optimize-autoloader --no-interaction -q

echo "==> Building the frontend (login page + dashboard)"
(cd "$APP_PATH/frontend" && npm ci --silent && npm run build --silent)

if [[ ! -f "$APP_PATH/.env" ]]; then
    cp "$APP_PATH/.env.example" "$APP_PATH/.env"
fi

set_env_var APP_NAME "Icarus Mailer Lite"
set_env_var APP_ENV production
set_env_var APP_DEBUG false
set_env_var APP_URL "https://${DOMAIN}"
set_env_var DB_CONNECTION mysql
set_env_var DB_HOST 127.0.0.1
set_env_var DB_PORT 3306
set_env_var DB_DATABASE "$DB_NAME"
set_env_var DB_USERNAME "$DB_USER"
set_env_var DB_PASSWORD "$DB_PASSWORD"
set_env_var QUEUE_CONNECTION database
set_env_var SESSION_DRIVER database
set_env_var CACHE_STORE database
set_env_var LOG_LEVEL error

echo "==> Generating application key"
php artisan key:generate --force -q

echo "==> Running migrations"
php artisan migrate --force -q

echo "==> Creating your login"
ADMIN_LINE="$(php artisan "app:create-admin" "$ADMIN_EMAIL" | grep '^ADMIN_CREDENTIALS|' || true)"
if [[ -z "$ADMIN_LINE" ]]; then
    echo "    (a user with this email may already exist — skipping; use your existing password, or delete the user row and re-run this script)"
fi

php artisan config:cache -q
php artisan route:cache -q

echo "==> Setting file permissions"
chown -R "${APP_USER}:${APP_USER}" "$APP_PATH"
chmod -R 775 "$APP_PATH/storage" "$APP_PATH/bootstrap/cache"

# PHP-FPM's opcache normally auto-invalidates a changed bootstrap/cache/
# config.php within a couple of seconds (validate_timestamps is on by
# default), but that's not guaranteed on every environment/config — an
# explicit reload after any config-cache rebuild is cheap insurance
# against serving a stale cached config (e.g. a blank APP_KEY, which
# breaks any route touching the session/cookie encryption middleware
# with "No application encryption key has been specified").
systemctl reload "php${PHP_VERSION}-fpm" 2>/dev/null || true

# ── 4. Nginx (HTTP first — certbot upgrades it to HTTPS) ────────────────
echo "==> Configuring Nginx"
sed \
    -e "s|__DOMAIN__|${DOMAIN}|g" \
    -e "s|__APP_PATH__|${APP_PATH}|g" \
    -e "s|__PHP_VERSION__|${PHP_VERSION}|g" \
    "$APP_PATH/deploy/nginx.conf.template" >"/etc/nginx/sites-available/${DOMAIN}"
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ── 5. Supervisor (queue worker) ─────────────────────────────────────────
echo "==> Configuring the queue worker"
sed \
    -e "s|__APP_PATH__|${APP_PATH}|g" \
    -e "s|__APP_USER__|${APP_USER}|g" \
    "$APP_PATH/deploy/supervisor-worker.conf.template" >/etc/supervisor/conf.d/icarus-lite-worker.conf
supervisorctl reread >/dev/null
supervisorctl update >/dev/null
supervisorctl start icarus-lite-worker:* >/dev/null 2>&1 || true

# ── 6. DNS check, then SSL ────────────────────────────────────────────────
# -4 forces IPv4 — on a dual-stack VPS, curl can otherwise return an IPv6
# address here, which will never match the IPv4 A record this script asks
# for, causing SSL setup to be skipped even when DNS is actually correct.
PUBLIC_IP="$(curl -4 -s https://ifconfig.me || curl -4 -s https://api.ipify.org || echo "UNKNOWN")"

echo
echo "==> DNS setup required"
echo "    Add this A record with your DNS provider, then press Enter to continue:"
echo
echo "        Type: A"
echo "        Name: ${DOMAIN}"
echo "        Value: ${PUBLIC_IP}"
echo
read -r -p "    Press Enter once the DNS record is added (or Ctrl+C to stop and do it later)... " _

echo "==> Waiting for DNS to propagate (checking every 10s, up to 5 minutes)"
RESOLVED=""
for i in $(seq 1 30); do
    RESOLVED="$(dig +short "$DOMAIN" A | tail -n1 || true)"
    if [[ "$RESOLVED" == "$PUBLIC_IP" ]]; then
        echo "    DNS resolved correctly."
        break
    fi
    sleep 10
done

if [[ "$RESOLVED" != "$PUBLIC_IP" ]]; then
    echo "    WARNING: ${DOMAIN} does not yet resolve to ${PUBLIC_IP} (got: '${RESOLVED:-nothing}')."
    echo "    Skipping automatic SSL setup. Once DNS has propagated, run:"
    echo "        certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m ${LETSENCRYPT_EMAIL} --redirect"
else
    echo "==> Requesting SSL certificate"
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$LETSENCRYPT_EMAIL" --redirect
fi

# ── Summary ───────────────────────────────────────────────────────────────
echo
echo "================================================================"
echo " Icarus Mailer Lite is deployed."
echo "================================================================"
echo " URL:      https://${DOMAIN}"
if [[ -n "$ADMIN_LINE" ]]; then
    IFS='|' read -r _ CRED_EMAIL CRED_PASSWORD <<<"$ADMIN_LINE"
    echo " Login:    ${CRED_EMAIL}"
    echo " Password: ${CRED_PASSWORD}"
    echo
    echo " Save this password now — it is not stored anywhere and will not be shown again."
fi
echo
echo " Database: ${DB_NAME} (user: ${DB_USER})"
echo " Queue worker: managed by Supervisor as 'icarus-lite-worker' (2 processes)"
echo "   Check status: supervisorctl status icarus-lite-worker:*"
echo "   View logs:    tail -f ${APP_PATH}/storage/logs/worker.log"
echo "================================================================"
