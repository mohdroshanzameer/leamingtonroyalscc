# HTTPS Setup Guide

## Overview

This guide explains how to enable HTTPS for your Cricket Club backend server using the zero-hardcoding configuration system.

## Quick Start

### 1. Generate SSL Certificates

**For Development (Self-Signed):**

```bash
# Create SSL directory
mkdir -p backend/ssl

# Generate private key
openssl genrsa -out backend/ssl/server.key 2048

# Generate certificate signing request
openssl req -new -key backend/ssl/server.key -out backend/ssl/server.csr

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in backend/ssl/server.csr -signkey backend/ssl/server.key -out backend/ssl/server.crt

# Clean up CSR
rm backend/ssl/server.csr
```

When prompted, fill in the certificate details (for development, you can use dummy values).

**For Production (Let's Encrypt - Free):**

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate (requires domain name)
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### 2. Update .env Configuration

Edit your `backend/.env` file:

```env
# Enable HTTPS
ENABLE_HTTPS=true
HTTPS_PORT=443
HTTPS_KEY_PATH="./ssl/server.key"
HTTPS_CERT_PATH="./ssl/server.crt"

# Enable HTTP to HTTPS redirect
HTTPS_REDIRECT_HTTP=true
HTTP_PORT=80
```

**For Production (Let's Encrypt):**

```env
ENABLE_HTTPS=true
HTTPS_PORT=443
HTTPS_KEY_PATH="/etc/letsencrypt/live/yourdomain.com/privkey.pem"
HTTPS_CERT_PATH="/etc/letsencrypt/live/yourdomain.com/fullchain.pem"
HTTPS_REDIRECT_HTTP=true
```

### 3. Start Server

```bash
cd backend
npm start

# If using port 443, you may need sudo:
sudo npm start
```

## Configuration Options

### .env Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_HTTPS` | false | Enable HTTPS server |
| `HTTPS_PORT` | 443 | HTTPS server port |
| `HTTPS_KEY_PATH` | ./ssl/server.key | Path to SSL private key |
| `HTTPS_CERT_PATH` | ./ssl/server.crt | Path to SSL certificate |
| `HTTPS_CA_PATH` | (empty) | Path to CA certificate (optional) |
| `HTTPS_REDIRECT_HTTP` | true | Redirect HTTP to HTTPS |
| `HTTP_PORT` | 5000 | HTTP server port (for redirect) |

## Server Behavior

### When HTTPS is ENABLED:

1. **HTTPS Server** starts on port 443 (or configured port)
2. **HTTP Redirect Server** starts on port 80 (if enabled)
   - All HTTP requests → redirected to HTTPS
3. SSL certificates are loaded and validated

### When HTTPS is DISABLED:

1. **HTTP Server** starts on port 5000 (or configured port)
2. No SSL certificates needed
3. ⚠️ Warning displayed (not suitable for production)

## Port Permissions

Ports 80 and 443 require elevated privileges:

### Option 1: Run with sudo
```bash
sudo npm start
```

### Option 2: Use higher ports (no sudo needed)
```env
HTTP_PORT=8080
HTTPS_PORT=8443
```

### Option 3: Grant Node.js permission (Linux)
```bash
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

## Testing HTTPS

### Test HTTPS Server
```bash
curl -k https://localhost:443/health
```

### Test HTTP Redirect
```bash
curl -I http://localhost:80/health
# Should return 301 redirect to https://
```

### Browser Testing
```
https://localhost
```

For self-signed certificates, you'll see a security warning - this is normal in development. Click "Advanced" → "Proceed to localhost".

## Production Checklist

- [ ] Use real SSL certificates (Let's Encrypt or paid)
- [ ] Set `NODE_ENV=production` in .env
- [ ] Enable HTTPS: `ENABLE_HTTPS=true`
- [ ] Enable redirect: `HTTPS_REDIRECT_HTTP=true`
- [ ] Use strong JWT secret
- [ ] Configure firewall rules (allow 80, 443)
- [ ] Set up auto-renewal for Let's Encrypt
- [ ] Test SSL configuration: https://www.ssllabs.com/ssltest/

## Auto-Renewal (Let's Encrypt)

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e

# Add this line (runs daily at 2am):
0 2 * * * certbot renew --quiet --post-hook "systemctl restart yourapp"
```

## Troubleshooting

### "Failed to load SSL certificates"
- Check that key and cert files exist
- Verify file paths in .env
- Ensure files are readable: `chmod 644 backend/ssl/*`

### "Port 443 requires elevated privileges"
- Run with `sudo npm start`
- Or use port >= 1024
- Or grant Node.js permission (see above)

### "Port already in use"
- Check if another process is using the port:
  ```bash
  sudo lsof -i :443
  sudo lsof -i :80
  ```
- Kill the process or use different ports

### Browser shows "Not Secure" warning
- **Development**: Normal for self-signed certs - click "Advanced" to proceed
- **Production**: Use Let's Encrypt or proper CA-signed certificate

### HTTP not redirecting to HTTPS
- Verify `HTTPS_REDIRECT_HTTP=true` in .env
- Check that HTTP server is running on correct port
- Ensure both servers started successfully

## Frontend Configuration

Update frontend to use HTTPS:

**Development (.env):**
```env
VITE_API_URL=https://localhost:8443/api
```

**Production (.env):**
```env
VITE_API_URL=https://yourdomain.com/api
```

## Security Best Practices

1. **Never commit SSL certificates to git**
   - Add to .gitignore: `ssl/`, `*.key`, `*.crt`

2. **Use strong cipher suites** (in production)
   - Update server config to disable weak ciphers

3. **Enable HSTS** (HTTP Strict Transport Security)
   - Forces browsers to always use HTTPS

4. **Regular certificate renewal**
   - Monitor expiration dates
   - Set up auto-renewal

5. **Keep Node.js and dependencies updated**
   ```bash
   npm audit
   npm update
   ```

## Summary

✅ Zero hardcoding - all config in .env  
✅ Easy enable/disable with `ENABLE_HTTPS` flag  
✅ Automatic HTTP → HTTPS redirect  
✅ Production-ready with Let's Encrypt  
✅ Development-friendly with self-signed certs  

---

**Need Help?**
- SSL Test: https://www.ssllabs.com/ssltest/
- Let's Encrypt: https://letsencrypt.org/
- OpenSSL Docs: https://www.openssl.org/docs/