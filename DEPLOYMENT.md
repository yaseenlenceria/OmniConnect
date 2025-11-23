# 🚀 Deployment Guide

This guide covers various deployment options for OmniConnect.

## Table of Contents

- [Production Requirements](#production-requirements)
- [Deploy to Render](#deploy-to-render)
- [Deploy to Railway](#deploy-to-railway)
- [Deploy to AWS EC2](#deploy-to-aws-ec2)
- [Deploy with Docker](#deploy-with-docker)
- [TURN Server Setup](#turn-server-setup)
- [SSL/HTTPS Setup](#sslhttps-setup)

---

## Production Requirements

Before deploying, ensure you have:

1. **HTTPS/SSL Certificate** - Required for WebRTC camera/mic access
2. **TURN Server** - Required for 30-40% of users behind restrictive NATs
3. **WebSocket Support** - Your hosting platform must support WebSockets
4. **Node.js 18+** - For the signaling server

---

## Deploy to Render

### Step 1: Deploy Signaling Server

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `omniconnect-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free or Starter

5. Add Environment Variables:
   ```
   PORT=3001
   NODE_ENV=production
   ```

6. Click "Create Web Service"
7. Note your server URL: `https://omniconnect-server.onrender.com`

### Step 2: Deploy Client

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `omniconnect-client`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. Add Environment Variable:
   ```
   VITE_SIGNALING_SERVER=wss://omniconnect-server.onrender.com
   ```

5. Click "Create Static Site"
6. Access your app at: `https://omniconnect-client.onrender.com`

---

## Deploy to Railway

### Prerequisites

```bash
npm install -g @railway/cli
railway login
```

### Deploy Server

```bash
cd server
railway init
railway up
railway domain  # Get your server domain
```

### Deploy Client

```bash
cd ../client

# Create .env file
echo "VITE_SIGNALING_SERVER=wss://your-server.railway.app" > .env

railway init
railway up
railway domain  # Get your client domain
```

---

## Deploy to AWS EC2

### Step 1: Launch EC2 Instance

1. Launch Ubuntu 22.04 LTS instance
2. Instance type: t2.micro (free tier) or larger
3. Configure Security Group:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 3001 (WebSocket)

### Step 2: Connect and Setup

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone your repository
git clone <your-repo-url>
cd OmniConnect
```

### Step 3: Deploy Server

```bash
cd server
npm install
pm2 start server.js --name omniconnect-server
pm2 startup  # Enable auto-start on reboot
pm2 save
```

### Step 4: Deploy Client with Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Build client
cd ../client
npm install
VITE_SIGNALING_SERVER=wss://your-domain.com npm run build

# Copy build to nginx
sudo cp -r dist/* /var/www/html/

# Configure Nginx (see SSL section below)
```

---

## Deploy with Docker

### Production Docker Deployment

```bash
# Clone repository
git clone <your-repo-url>
cd OmniConnect

# Create production .env for client
cat > client/.env << EOF
VITE_SIGNALING_SERVER=wss://your-domain.com
EOF

# Build and run with Docker Compose
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Deploy to DigitalOcean with Docker

1. Create a Droplet with Docker pre-installed
2. SSH into droplet
3. Clone repository and run docker-compose
4. Configure domain and SSL (see below)

---

## TURN Server Setup

For production, you MUST add TURN servers. ~30-40% of users need TURN to bypass restrictive NATs.

### Option 1: Use Twilio STUN/TURN

```bash
# Sign up at https://www.twilio.com/
# Get credentials from Console → Voice → TURN

# Update client/src/services/WebRTCService.js:
this.iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:global.turn.twilio.com:3478?transport=udp',
      username: 'your-twilio-username',
      credential: 'your-twilio-credential'
    }
  ]
};
```

### Option 2: Use Xirsys

```bash
# Sign up at https://xirsys.com/
# Get credentials from Dashboard

this.iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:xirsys-server.com:443?transport=tcp',
      username: 'your-username',
      credential: 'your-credential'
    }
  ]
};
```

### Option 3: Self-hosted Coturn

```bash
# Install Coturn on Ubuntu
sudo apt install -y coturn

# Configure /etc/turnserver.conf
listening-port=3478
fingerprint
lt-cred-mech
realm=your-domain.com
user=username:password
external-ip=YOUR_SERVER_IP

# Enable and start
sudo systemctl enable coturn
sudo systemctl start coturn

# Update WebRTC config
this.iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-domain.com:3478',
      username: 'username',
      credential: 'password'
    }
  ]
};
```

---

## SSL/HTTPS Setup

### Option 1: Cloudflare (Easiest)

1. Add your domain to Cloudflare
2. Enable "Full" SSL mode
3. Enable WebSocket support
4. Point DNS to your server
5. Done! Cloudflare handles SSL automatically

### Option 2: Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run

# Update Nginx config for WebSocket
sudo nano /etc/nginx/sites-available/default
```

**Nginx Config with WebSocket:**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Client (static files)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # WebSocket proxy to signaling server
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Environment Variables Summary

### Client

```bash
VITE_SIGNALING_SERVER=wss://your-server.com  # Production WebSocket URL
```

### Server

```bash
PORT=3001                # Server port
NODE_ENV=production      # Environment
```

---

## Post-Deployment Checklist

- [ ] HTTPS is enabled and working
- [ ] Camera/microphone permissions work
- [ ] WebSocket connection successful
- [ ] TURN server configured and tested
- [ ] Two users can connect and see each other
- [ ] Skip partner functionality works
- [ ] Error handling works properly
- [ ] Mobile responsiveness tested
- [ ] Browser console shows no errors

---

## Monitoring

### Health Checks

Both server and client have health endpoints:

```bash
# Server health
curl https://your-server.com/health

# Client health (nginx)
curl https://your-client.com/health
```

### Logs

```bash
# PM2 logs (if using PM2)
pm2 logs omniconnect-server

# Docker logs
docker-compose logs -f server
docker-compose logs -f client

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### WebSocket Connection Failed

1. Check firewall allows port 3001
2. Verify SSL certificate is valid
3. Check CORS configuration
4. Test WebSocket: `websocat wss://your-server.com`

### Camera Not Working

1. Ensure using HTTPS (not HTTP)
2. Check browser console for permissions errors
3. Test on different browsers

### Cannot Connect to Partner

1. Verify TURN server is working
2. Check ICE candidate exchange in console
3. Test STUN servers are accessible
4. Verify WebRTC connection state

---

## Cost Estimation

### Free Tier Options
- **Render**: Free tier available (goes to sleep after 15 min inactivity)
- **Railway**: $5/month credit free
- **Vercel**: Free for static sites
- **Google STUN**: Free

### Paid Options
- **VPS (DigitalOcean/AWS)**: $5-10/month
- **TURN Server (Twilio)**: ~$0.0005 per minute
- **TURN Server (Xirsys)**: $8/month for 500GB
- **Self-hosted TURN**: Free (server costs only)

---

## Support

For deployment issues:
- Check logs first
- Review browser console
- Test with curl/websocat
- Open GitHub issue with details

Good luck with your deployment! 🚀
