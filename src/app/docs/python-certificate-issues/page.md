---
tags:
  - python
  - installation
  - troubleshooting
  - intermediate
title: Handle SSL Certificate Errors in the Python Client
nextjs:
  metadata:
    title: Fix Python SSL CERTIFICATE_VERIFY_FAILED in TerminusDB
    description: "Fix SSLCertVerificationError when the TerminusDB Python client connects to a local or self-signed server: trust a CA bundle with REQUESTS_CA_BUNDLE or export the server cert."
    keywords: python, SSL, certificate, self-signed, TLS, verify
    alternates:
      canonical: https://terminusdb.com/docs/python-certificate-issues/
---

When you connect the Python client to a TerminusDB server that uses a self-signed certificate or a local TLS proxy, you can see errors like `SSLCertVerificationError` or `CERTIFICATE_VERIFY_FAILED`. This guide shows how to make the client trust your certificate.

{% callout type="note" title="No verify option in the client" %}
The TerminusDB Python client has no `verify` option. `Client(url, verify=False)` does not turn off the check. To trust a certificate, use the `REQUESTS_CA_BUNDLE` environment variable or your system trust store, as shown below.
{% /callout %}

## Trust a CA bundle with REQUESTS_CA_BUNDLE

The client uses the Python `requests` library. `requests` reads the `REQUESTS_CA_BUNDLE` environment variable and checks server certificates against that file. You do not need to change your code:

```bash
export REQUESTS_CA_BUNDLE=/path/to/ca-bundle.crt
python my_app.py
```

You can also set it in Python, before you call `connect()`:

```python
import os
os.environ["REQUESTS_CA_BUNDLE"] = "/path/to/ca-bundle.crt"

from terminusdb_client import Client

client = Client("https://my-terminusdb.internal:6363")
client.connect(user="admin", key="root")
```

The file replaces the default list of trusted CAs for that process. If your app also calls public HTTPS services, use a bundle that has your CA and the public CAs, or add your CA to the system trust store.

## Export your self-signed certificate

If you made a self-signed certificate for your TerminusDB server, export it and use it as the CA bundle:

```bash
# Get the certificate from a running server (Linux/macOS)
openssl s_client -connect my-terminusdb.internal:6363 < /dev/null 2>/dev/null \
  | openssl x509 -outform PEM > terminusdb-cert.pem

export REQUESTS_CA_BUNDLE=./terminusdb-cert.pem
python my_app.py
```

## Add the CA to the system trust store

For a company CA that many apps use, add it to the system trust store of the machine or container (for example `update-ca-certificates` on Debian and Ubuntu). Then point `REQUESTS_CA_BUNDLE` at the system bundle, for example `/etc/ssl/certs/ca-certificates.crt`.

## Troubleshooting

**Error:** `SSLCertVerificationError: certificate verify failed: unable to get local issuer certificate`

The server certificate was signed by a CA that your Python process does not trust. Solutions:
1. Set `REQUESTS_CA_BUNDLE` to a file that has your CA
2. Add your CA to the system trust store

**Error:** `SSLCertVerificationError: certificate verify failed: self-signed certificate`

The server uses a self-signed certificate. Export it (see above) and set `REQUESTS_CA_BUNDLE` to the exported file.

**Error:** `ConnectionError: Max retries exceeded`

This is not a certificate error. The client cannot reach the server. Check that TerminusDB is running and that the hostname and port are correct.

## When to use each approach

| Scenario | Recommendation |
|----------|---------------|
| Local Docker with `localhost` | Use `http://localhost:6363` (no TLS needed) |
| Self-signed cert in development | Export the cert and set `REQUESTS_CA_BUNDLE` |
| Internal CA in staging/production | Add the CA to the system trust store |
| CI/CD pipeline with internal CA | Set `REQUESTS_CA_BUNDLE` env var |
| Public TerminusDB Cloud | No action needed — certificates are valid |

## See also

- [Python Quickstart](/docs/connect-with-python-client/) — connect to TerminusDB with the Python client
- [Self-Hosted Installation](/docs/self-hosted-installation/) — deploy with TLS reverse proxy
- [Troubleshooting Connection Failures](/docs/troubleshooting-connection/) — other connectivity issues
