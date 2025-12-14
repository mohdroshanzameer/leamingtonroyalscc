# Enable HTTPS for Backend

## Quick Setup (Self-Signed Certificate for Development)

### Option 1: Using OpenSSL (Recommended)

1. **Install OpenSSL** (if not already installed):
   - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html
   - Or use Git Bash (comes with Git for Windows)

2. **Generate SSL Certificate**:
   ```bash
   cd backend
   mkdir ssl
   cd ssl
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=UK/ST=Warwickshire/L=Leamington/O=LRCC/CN=localhost"
   ```

3. **Enable HTTPS in backend/.env**:
   ```
   USE_HTTPS=true
   HTTPS_PORT=5443
   ```

4. **Restart server**:
   ```bash
   npm start
   ```

5. **Access**: https://localhost:5443
   - Your browser will show a security warning (normal for self-signed certs)
   - Click "Advanced" → "Proceed to localhost"

### Option 2: Using mkcert (Easiest - Trusted by Browser)

1. **Install mkcert**:
   ```bash
   # Windows (using Chocolatey)
   choco install mkcert

   # Or download from: https://github.com/FiloSottile/mkcert/releases
   ```

2. **Install local CA**:
   ```bash
   mkcert -install
   ```

3. **Generate certificate**:
   ```bash
   cd backend
   mkdir ssl
   cd ssl
   mkcert localhost 127.0.0.1 ::1
   ren localhost+2.pem cert.pem
   ren localhost+2-key.pem key.pem
   ```

4. **Enable HTTPS in backend/.env**:
   ```
   USE_HTTPS=true
   HTTPS_PORT=5443
   ```

5. **Restart server** and access https://localhost:5443
   - No browser warnings! ✅

## Production Setup (Real SSL Certificate)

For production with a real domain, use **Let's Encrypt**:

1. **Get a domain name** and point it to your server IP

2. **Install Certbot**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install certbot
   ```

3. **Generate certificate**:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```

4. **Copy certificates**:
   ```bash
   cd backend
   mkdir ssl
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
   sudo chown $USER:$USER ssl/*.pem
   ```

5. **Update backend/.env**:
   ```
   USE_HTTPS=true
   HTTPS_PORT=443
   ```

6. **Run with sudo** (port 443 requires admin):
   ```bash
   sudo npm start
   ```

## Update Frontend

Update `frontend/.env` to use HTTPS:
```
REACT_APP_API_URL=https://localhost:5443/api
```

Rebuild frontend:
```bash
npm run build
```

## Verify HTTPS

Check your setup:
```bash
curl -k https://localhost:5443/api/auth/check
```

## Troubleshooting

**"SSL certificates not found" error:**
- Ensure `backend/ssl/key.pem` and `backend/ssl/cert.pem` exist
- Check file permissions

**Browser security warnings:**
- Normal for self-signed certificates
- Use mkcert for development to avoid warnings
- Use Let's Encrypt for production

**Port 443 permission denied:**
- On Linux/Mac, run with sudo for ports < 1024
- Or use port 5443 instead

**Mixed content errors:**
- Ensure frontend uses `https://` in API_URL
- Check browser console for blocked requests