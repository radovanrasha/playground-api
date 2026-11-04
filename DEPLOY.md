# Deployment — Docker + CI/CD to a VPS

How a push to `production` ends up live on the VPS:

```
git push production
   │
   ▼
GitHub Actions (.github/workflows/deploy.yml)
   ├─ build-and-push : docker build  →  push to ghcr.io/radovanrasha/playground-api
   └─ deploy         : scp docker-compose.yml → VPS ~/playground-api
                       ssh → docker login → docker compose pull → up -d
   │
   ▼
VPS: container "playground-api" on the host network, listening on :3007,
     talking to the MongoDB that already runs on the VPS (127.0.0.1:27017)
   │
   ▼
nginx (host) : API domain  →  proxy_pass 127.0.0.1:3007 (with WebSocket upgrade)
```

The image is built **in GitHub Actions**, not on the VPS. The VPS only pulls a
finished image and restarts it. The frontend has its own identical pipeline in
the `playground` repo.

Work happens on `staging`; merge `staging` into `production` to release. You
can also run the workflow by hand from the **Actions** tab (*workflow_dispatch*).

### Why host networking?

`server.js` connects to `mongodb://127.0.0.1:27017/playground-app`. In a normal
Docker network, `127.0.0.1` would be the container itself, not the VPS. With
`network_mode: host` the container shares the VPS network, so the existing
MongoDB and its data are used as they are, with no code change.

---

## One-time setup

### 1. GitHub repository secrets

Repo → **Settings → Secrets and variables → Actions**. These names are the
same ones the old pm2 workflow used, so they may already be set:

| Secret                | Value                                                |
| --------------------- | ---------------------------------------------------- |
| `VPS_SSH_HOST`        | VPS IP or hostname                                   |
| `VPS_SSH_USER`        | SSH user (e.g. `dev`)                                |
| `VPS_SSH_PRIVATE_KEY` | **Private** SSH key whose public half is on the VPS  |
| `VPS_SSH_PORT`        | *(optional)* SSH port — defaults to `22`            |

`GITHUB_TOKEN` is provided automatically; it pushes the image to GHCR and is
reused over SSH to authenticate the pull.

### 2. On the VPS (once)

```bash
# Docker + compose plugin (skip if already installed for the portfolio)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"   # then log out/in so `docker` works w/o sudo

# The deploy directory the workflow scps into
mkdir -p ~/playground-api
```

Runtime secrets go in `~/playground-api/.env` (never in the image). Copy the
`.env` the pm2 setup used, at least:

```bash
cp /home/dev/playground/playground-api/source/.env ~/playground-api/.env
# must contain JWT_SECRET=...
```

### 3. Switch over from the old pm2 setup

The container listens on port **3007**, the same port the old pm2 process
used, so stop pm2 first or the API cannot bind the port:

```bash
pm2 stop playground-api
pm2 delete playground-api
pm2 save
```

Your existing nginx site for the API keeps working because the port is the
same. For a fresh server, see
[`deploy/nginx.conf.example`](deploy/nginx.conf.example).

---

## Check it

After the workflow is green, on the VPS:

```bash
docker ps --filter name=playground-api
docker logs playground-api               # → "Connected to Mongo ..." + "SERVER RUNNING ON PORT 3007"
curl http://127.0.0.1:3007               # → Playground app api!
```

## Roll back

Every image is also tagged with its commit SHA. To go back, on the VPS edit
`~/playground-api/docker-compose.yml` to use
`ghcr.io/radovanrasha/playground-api:<sha>` and run `docker compose up -d`
(the next deploy puts `:latest` back).
