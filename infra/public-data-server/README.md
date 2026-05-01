# Public TerminusDB Data Server

Public read-only TerminusDB instance at `https://data.terminusdb.org` for anonymous cloning of template databases used in documentation.

## Architecture

- **Host:** Fly.io (`lhr` region — London)
- **App name:** `dfrnt-data-terminusdb`
- **Auto-scaling:** Stops after idle, auto-starts on incoming request
- **Storage:** 1 GB persistent Fly volume at `/app/terminusdb/storage`
- **Databases:** `public/star-wars`, `public/ecommerce`, `public/nuclear`, `public/lego` (all public, anonymous access)

## Clone Commands

```bash
# Star Wars demo dataset
terminusdb clone https://data.terminusdb.org/public/star-wars --token=anonymous

# E-Commerce demo dataset
terminusdb clone https://data.terminusdb.org/public/ecommerce --token=anonymous

# Nuclear power plants dataset
terminusdb clone https://data.terminusdb.org/public/nuclear --token=anonymous

# Lego sets dataset (~60 MB)
terminusdb clone https://data.terminusdb.org/public/lego --token=anonymous
```

> The first clone after idle may take a few seconds while the server cold-starts. Subsequent operations are instant.

## Organisation Choice

We use a `public` organisation to match the original data.terminusdb.org conventions and maintain backward compatibility with existing documentation and clone URLs. The URLs are clear and self-documenting: `data.terminusdb.org/public/star-wars`.

## CI/CD Deployment

This server is deployed automatically via GitHub Actions when files under `infra/public-data-server/` change on `main`.

### Setting Up the Deploy Token

1. Generate a Fly.io deploy token:

   ```bash
   fly tokens create deploy -a dfrnt-data-terminusdb
   ```

2. Add the token as a GitHub repository secret:
   - Go to **Repository Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `FLY_API_TOKEN`
   - Value: paste the token from step 1

3. Push changes to `infra/public-data-server/` on `main` — the workflow triggers automatically.

You can also trigger a deploy manually from the Actions tab using "Run workflow".

## Manual Deployment

### Prerequisites

- [Fly CLI](https://fly.io/docs/flyctl/install/) installed and authenticated
- Access to the `dfrnt` Fly.io organisation

### First-Time Setup

```bash
cd infra/public-data-server/

# 1. Create the Fly app
fly apps create dfrnt-data-terminusdb

# 2. Create persistent volume (1 GB, London region)
fly volumes create terminusdb_data --region lhr --size 1

# 3. Set the admin password (generate a strong random value)
fly secrets set TERMINUSDB_ADMIN_PASS="$(openssl rand -base64 32)"

# 4. Deploy
fly deploy

# 5. Verify the server is running
fly status
curl -sf https://dfrnt-data-terminusdb.fly.dev/api/ok && echo "OK"
```

### Custom Domain (data.terminusdb.org)

```bash
# 1. Request a TLS certificate for the custom domain
fly certs add data.terminusdb.org

# 2. At the terminusdb.org DNS provider, add:
#    A      data  →  66.241.125.73
#    AAAA   data  →  2a09:8280:1::10e:a4bb:0
#
#    Or CNAME:
#    CNAME  data  →  ykmx3mj.dfrnt-data-terminusdb.fly.dev

# 3. Verify TLS is provisioned
fly certs show data.terminusdb.org
```

### Subsequent Deploys

After updating template data or configuration:

```bash
cd infra/public-data-server/
fly deploy
```

To force re-bootstrap (e.g. after schema changes), SSH in and remove the marker:

```bash
fly ssh console
rm /app/terminusdb/storage/.bootstrapped
# Then restart: fly apps restart dfrnt-data-terminusdb
```

## Updating Template Data

1. Replace the JSON files in `templates/star-wars/` or `templates/ecommerce/`, or the bundle files in `templates/bundles/`
2. Run `fly deploy` — the new image is built with the updated data baked in
3. If the databases already exist on the volume, remove the bootstrap marker and restart (see above)

For a clean slate, destroy and recreate the volume:

```bash
fly volumes list
fly volumes destroy <volume-id>
fly volumes create terminusdb_data --region lhr --size 1
fly deploy
```

## Security

- **Admin password:** Stored as a Fly.io secret, never in code
- **JWT disabled:** Not needed for a public read-only server
- **Dashboard disabled:** Reduces attack surface
- **Anonymous access:** Falls through to `User/anonymous` with cloner role (clone + commit_read_access only)
- **No sensitive data:** Only public demo datasets

## Cost Estimate

| Component | Monthly |
|-----------|---------|
| shared-cpu-1x, 512 MB (on-demand, ~2 h/day) | ~$2-5 |
| 1 GB persistent volume | ~$0.15 |
| Dedicated IPv4 (if needed) | $2 |
| Bandwidth (~1 GB/month) | $0 (included) |
| Custom domain TLS | $0 (included) |
| **Total** | **~$2-7** |

## Deployment Verification

After deploying, verify that anonymous clone works end-to-end:

```bash
# 1. Check server health
curl -sf https://data.terminusdb.org/api/ok && echo "Server healthy"

# 2. Test anonymous clone (the critical path)
terminusdb clone https://data.terminusdb.org/public/star-wars --token=anonymous

# 3. Verify data was loaded
terminusdb doc get public/star-wars --type=Person --count=1
```

**Important:** The `bootstrap-templates.sh` script creates databases with `--public` and explicitly grants cloner capabilities (clone + commit_read_access). If anonymous clone fails with 403, verify that capabilities were applied correctly. You may need to manually grant them:

```bash
fly ssh console
# Inside the container:
/app/terminusdb/terminusdb capability grant anonymous public/star-wars cloner
/app/terminusdb/terminusdb capability grant anonymous public/ecommerce cloner
/app/terminusdb/terminusdb capability grant anonymous public/nuclear cloner
/app/terminusdb/terminusdb capability grant anonymous public/lego cloner
```

## Troubleshooting

```bash
# Check app status
fly status

# View logs
fly logs

# SSH into the running machine
fly ssh console

# Check if bootstrap ran
ls -la /app/terminusdb/storage/.bootstrapped

# Test anonymous clone locally
terminusdb clone https://data.terminusdb.org/public/star-wars --token=anonymous
```
