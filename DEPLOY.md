# Deploying Karjat Farms on an Ubuntu Server

Target: Ubuntu 22.04 or 24.04. App runs on `localhost:3000`, Nginx serves it on port 80 to the public internet. Database is local SQLite (no managed DB needed). Total time: ~30 minutes.

Substitute your server's public IP wherever you see `YOUR_SERVER_IP` below.

---

## 0. Before you start

You should have:
- SSH access to your Ubuntu server with `sudo` privileges
- Ports 22 (SSH) and 80 (HTTP) reachable from the internet
- This codebase pushed to a GitHub repo (private is fine) — OR be ready to `scp` the files up

> **Tip:** SSH into the server in one terminal and keep this file open in another. Run commands in order.

---

## 1. Install system dependencies (5 min)

```bash
sudo apt update && sudo apt upgrade -y

# Build tools (better-sqlite3 compiles native code at install — needs make, gcc, python3)
sudo apt install -y build-essential python3 git curl ufw nginx

# Verify build tools actually installed
make --version   # should print GNU Make 4.x — if it says "command not found", build-essential failed
gcc --version    # should print gcc 11.x or 13.x

# Node.js 22 LTS from NodeSource (Prisma 7 requires Node 22+)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # should show v22.x
npm --version
```

Install PM2 globally — it keeps the app running and restarts it if it crashes or the server reboots:

```bash
sudo npm install -g pm2
```

---

## 2. Create a dedicated user + directories (2 min)

Running as `root` is risky. Make a user just for this app:

```bash
sudo adduser --disabled-password --gecos "" karjat
sudo mkdir -p /var/www/karjat-farms /var/log/karjat-farms
sudo chown -R karjat:karjat /var/www/karjat-farms /var/log/karjat-farms
```

Switch to the new user:
```bash
sudo -iu karjat
```

(Every command from here until step 7 runs as the `karjat` user. The shell prompt should show `karjat@...`.)

---

## 3. Get the code on the server (3 min)

**Option A — clone from GitHub** (recommended; makes updates a one-liner):
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/karjat-farms.git karjat-farms
cd karjat-farms
```

> If the repo is private, set up an SSH deploy key first: `ssh-keygen -t ed25519 -C "karjat-deploy"`, then paste `~/.ssh/id_ed25519.pub` into **GitHub → Settings → Deploy keys** for that repo.

**Option B — copy from your laptop** (one-time, no git):
From your laptop, in the project folder:
```bash
rsync -av --exclude node_modules --exclude .next --exclude dev.db --exclude .env \
  ./ karjat@YOUR_SERVER_IP:/var/www/karjat-farms/
```

---

## 4. Configure environment (3 min)

Create `/var/www/karjat-farms/.env` on the server:

```bash
nano .env
```

Paste:
```env
DATABASE_URL="file:./prisma/karjat.db"

# NextAuth — generate a fresh secret, don't reuse the dev one!
AUTH_SECRET="PASTE_FRESH_SECRET_HERE"
AUTH_TRUST_HOST="true"

# Razorpay — leave placeholders if you don't have keys yet
# (bookings will auto-confirm without payment)
RAZORPAY_KEY_ID="rzp_test_placeholder"
RAZORPAY_KEY_SECRET="placeholder_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_placeholder"
```

Generate a fresh `AUTH_SECRET` and paste the output back into the file:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Save with **Ctrl+O, Enter, Ctrl+X**.

---

## 5. Install, migrate, seed, build (5 min)

Still as the `karjat` user, in `/var/www/karjat-farms`:

```bash
npm ci                                 # installs deps + compiles better-sqlite3 + runs prisma generate
npx prisma migrate deploy              # applies migrations to ./prisma/karjat.db
npm run db:seed                        # inserts 7 sample farmhouses + 2 demo accounts
npm run build                          # builds the production bundle
```

If `npm run db:seed` complains about an existing DB, that's fine — it uses `upsert` so it's safe to re-run.

Quick sanity check before exposing to the world:
```bash
npm start                              # listens on http://localhost:3000
```
In another terminal on the server: `curl -I http://localhost:3000` — should return `HTTP/1.1 200 OK`. Press **Ctrl+C** to stop.

---

## 6. Run with PM2 (2 min)

PM2 will keep the app running, restart it on crashes, and survive server reboots.

```bash
pm2 start ecosystem.config.js
pm2 save                               # persist current process list
pm2 logs karjat-farms --lines 20       # watch startup logs, Ctrl+C to exit
```

You should see "Ready in ... ms".

Now exit back to your sudo user so we can hook PM2 into systemd:
```bash
exit                                   # leaves the `karjat` shell
```

```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u karjat --hp /home/karjat
```
(That command auto-generates a systemd unit — run whatever it prints back at you if it asks.)

Test it survives reboot: `sudo reboot` → wait a minute → SSH back in → `pm2 list` (after `sudo -iu karjat`) should show the app running.

---

## 7. Set up Nginx reverse proxy (5 min)

Back as a sudo user (not `karjat`):

```bash
sudo cp /var/www/karjat-farms/deploy/nginx.conf.example /etc/nginx/sites-available/karjat-farms
sudo sed -i "s/YOUR_SERVER_IP/$(curl -s ifconfig.me)/" /etc/nginx/sites-available/karjat-farms

# Disable the default site, enable ours
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/karjat-farms /etc/nginx/sites-enabled/

# Sanity check + reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. Firewall (1 min)

Lock down everything except SSH and HTTP:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx HTTP'
sudo ufw --force enable
sudo ufw status
```

---

## 9. Visit the app

Open `http://YOUR_SERVER_IP` in your browser. You should see the Karjat Farms landing page.

Log in:
- **User:** `user@example.com` / `user123`
- **Owner:** `owner@karjatfarms.in` / `owner123`

> ⚠️ **Change those passwords (or delete those accounts) before showing the site to real users.** They're seeded with public credentials.

---

## Deploying updates

Whenever you push changes to GitHub, pull and rebuild on the server:

```bash
sudo -iu karjat
cd /var/www/karjat-farms
git pull
npm ci                                 # if package-lock.json changed
npx prisma migrate deploy              # if you added DB migrations
npm run build
pm2 restart karjat-farms
exit
```

A 4-line script `deploy.sh` you can drop in the home dir to run this in one shot — write it once, use it forever.

---

## Useful PM2 commands

```bash
pm2 status                             # what's running
pm2 logs karjat-farms                  # tail logs
pm2 logs karjat-farms --err            # only errors
pm2 restart karjat-farms               # restart after config change
pm2 reload karjat-farms                # zero-downtime reload
pm2 stop karjat-farms                  # stop without removing
pm2 monit                              # live CPU/memory dashboard
```

---

## Backups (you should do this)

The SQLite DB is just a file. Back it up daily via cron:

```bash
sudo crontab -e
```
Add:
```cron
0 3 * * * cp /var/www/karjat-farms/prisma/karjat.db /var/backups/karjat-$(date +\%F).db && find /var/backups/karjat-*.db -mtime +14 -delete
```
(Daily at 03:00 UTC. Keeps 14 days. Adjust the path if you prefer.)

Also back up `/var/www/karjat-farms/public/uploads/` — that's where user-uploaded photos live.

---

## Adding HTTPS later (when you have a domain)

When you buy a domain (Namecheap, Cloudflare Registrar, GoDaddy ~₹800/year):

1. Point an **A record** for `yourdomain.com` to `YOUR_SERVER_IP`.
2. Wait for DNS to propagate (5–60 minutes; check with `dig yourdomain.com`).
3. On the server:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo sed -i "s/YOUR_SERVER_IP _/yourdomain.com www.yourdomain.com/" /etc/nginx/sites-available/karjat-farms
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   sudo ufw allow 'Nginx HTTPS'
   ```
   Certbot will auto-edit the Nginx config to redirect HTTP → HTTPS. Renewal is automatic via systemd timer.

---

## Troubleshooting

**`502 Bad Gateway` from Nginx**
Next.js isn't running. Check `pm2 status` (as the `karjat` user) and `pm2 logs karjat-farms --err`.

**`better-sqlite3` install fails**
Missing build tools. `sudo apt install build-essential python3` then `npm ci` again.

**`Error: Could not find Prisma Schema`**
You ran a `prisma` command from outside the project dir. `cd /var/www/karjat-farms` first.

**App runs but the homepage is blank / 500**
DB isn't migrated. `cd` into the project and run `npx prisma migrate deploy && npm run build && pm2 restart karjat-farms`.

**Can't reach the IP from your browser**
Check the firewall on your *cloud provider* — many providers (AWS, GCP, Oracle) have a second firewall on top of `ufw` that also needs port 80 opened.

---

## What about Razorpay in production?

You can launch the site with the placeholder keys — bookings will auto-confirm without payment (mock mode), which is fine for showing the site to clients or doing UAT. When you're ready to accept real money:

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Generate **Test Mode** keys first — paste them into `.env` and restart PM2. Try a test booking with card `4111 1111 1111 1111`, any future expiry, any CVV.
3. Once tested, complete Razorpay KYC, get approved for Live Mode, swap in Live keys.

---

## Optional: systemd instead of PM2

If you prefer no extra process manager, here's a systemd unit you can use instead of PM2:

```ini
# /etc/systemd/system/karjat-farms.service
[Unit]
Description=Karjat Farms Next.js app
After=network.target

[Service]
Type=simple
User=karjat
WorkingDirectory=/var/www/karjat-farms
EnvironmentFile=/var/www/karjat-farms/.env
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now karjat-farms
sudo systemctl status karjat-farms
journalctl -u karjat-farms -f          # tail logs
```

PM2 is friendlier for one-server setups; systemd is cleaner if you already use it everywhere else. Pick one.
