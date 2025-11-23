# 🌐 OmniConnect

<div align="center">

**Random Video Chat Application Built with WebRTC**

Connect with strangers worldwide through peer-to-peer video calling

[Features](#features) • [Architecture](#architecture) • [Quick Start](#quick-start) • [Deployment](#deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

OmniConnect is a real-time video chat application that randomly pairs users for video conversations, similar to Omegle or Chatroulette. It uses WebRTC for peer-to-peer audio/video communication and WebSockets for signaling.

## ✨ Features

- **Random Matching**: Automatically pairs users with random strangers
- **Real-time Video & Audio**: Peer-to-peer WebRTC communication
- **Low Latency**: Direct browser-to-browser connections
- **Controls**: Toggle camera/microphone, skip partners, disconnect
- **Responsive Design**: Works on desktop and mobile devices
- **NAT Traversal**: STUN server configuration for connectivity
- **Automatic Reconnection**: Handles network interruptions gracefully

## 🏗️ Architecture

```
┌─────────────┐                    ┌─────────────┐
│   User A    │                    │   User B    │
│   Browser   │                    │   Browser   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │    WebSocket (Signaling)         │
       ├──────────────┬───────────────────┤
       │              │                   │
       │         ┌────▼────┐             │
       │         │ Server  │             │
       │         │ Node.js │             │
       │         │   WS    │             │
       │         └─────────┘             │
       │                                 │
       └─────────────────────────────────┘
         WebRTC (Direct P2P Audio/Video)
              via STUN/TURN
```

### Components

1. **WebRTC Service** (`client/src/services/WebRTCService.js`)
   - Manages RTCPeerConnection
   - Handles local/remote media streams
   - Creates offers/answers
   - Processes ICE candidates

2. **Signaling Server** (`server/server.js`)
   - WebSocket server for matchmaking
   - Pairs random users
   - Relays offer/answer/ICE candidates
   - Manages user queue and active connections

3. **Signaling Client** (`client/src/services/SignalingService.js`)
   - WebSocket client
   - Sends connection requests
   - Forwards WebRTC messages

4. **React UI** (`client/src/App.jsx`)
   - Video display components
   - User controls
   - Connection status

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **WebRTC API** - Peer-to-peer communication
- **WebSocket API** - Signaling

### Backend
- **Node.js 20** - Runtime
- **Express** - HTTP server
- **ws** - WebSocket library
- **UUID** - Unique ID generation

### DevOps
- **Docker** - Containerization
- **Nginx** - Production web server
- **Docker Compose** - Multi-container orchestration

## 📦 Prerequisites

- **Node.js** 18+ and npm
- **Modern browser** with WebRTC support (Chrome, Firefox, Safari, Edge)
- **Camera and microphone** access
- **HTTPS** (required for camera/mic in production)

## 🚀 Quick Start

### Option 1: Run with Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd OmniConnect

# Start both server and client
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Server: http://localhost:3001
```

### Option 2: Run Locally

#### 1. Start the Signaling Server

```bash
cd server
npm install
npm start
```

The server will run on `http://localhost:3001`

#### 2. Start the Client

```bash
cd client
npm install
npm run dev
```

The client will run on `http://localhost:3000`

#### 3. Open in Browser

Navigate to `http://localhost:3000` and click "Start Chat"

**Note**: You'll need at least 2 browser windows/tabs to test matching

## 📁 Project Structure

```
OmniConnect/
├── client/                      # Frontend React application
│   ├── public/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/
│   │   │   ├── WebRTCService.js      # WebRTC peer connection logic
│   │   │   └── SignalingService.js   # WebSocket signaling
│   │   ├── App.jsx             # Main application component
│   │   ├── App.css             # Styles
│   │   └── main.jsx            # Entry point
│   ├── Dockerfile
│   ├── nginx.conf              # Nginx configuration for production
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Backend signaling server
│   ├── server.js               # WebSocket server + matchmaking logic
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # Docker orchestration
├── .gitignore
└── README.md
```

## 🔄 How It Works

### Step-by-Step Flow

1. **User Opens App**
   - Browser requests camera/microphone permission
   - Local media stream is captured

2. **Connect to Server**
   - User clicks "Start Chat"
   - WebSocket connection established to signaling server
   - Server assigns unique user ID

3. **Find Partner**
   - User added to waiting queue
   - Server pairs two waiting users

4. **WebRTC Negotiation**
   - **User A** (initiator):
     - Creates WebRTC offer
     - Sends to server → relayed to User B
   - **User B** (responder):
     - Receives offer
     - Creates answer
     - Sends to server → relayed to User A

5. **ICE Candidate Exchange**
   - Both users send network information (ICE candidates)
   - Server relays between users

6. **Direct P2P Connection**
   - WebRTC establishes direct connection
   - Audio/video flows peer-to-peer (NOT through server)

7. **Chat Active**
   - Users can toggle video/audio
   - Skip to next partner
   - End chat

8. **Disconnect**
   - Partner notified
   - Both users can find new partners

## 🌍 Deployment

### Deploy to Render (Recommended)

#### 1. Deploy Signaling Server

```bash
# In Render dashboard:
# - New Web Service
# - Connect your repository
# - Root directory: server
# - Build command: npm install
# - Start command: npm start
# - Add environment variable: PORT=3001
```

#### 2. Deploy Client

```bash
# In Render dashboard:
# - New Static Site
# - Root directory: client
# - Build command: npm install && npm run build
# - Publish directory: dist
# - Add environment variable: VITE_SIGNALING_SERVER=wss://your-server.onrender.com
```

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy server
cd server
railway up

# Deploy client
cd ../client
railway up
```

### Deploy to Vercel + Custom Server

```bash
# Deploy client to Vercel
cd client
vercel

# Deploy server to any Node.js host:
# - Railway
# - Render
# - DigitalOcean
# - AWS EC2
# - Heroku
```

### Important Deployment Notes

1. **HTTPS Required**: WebRTC requires HTTPS in production for camera/microphone access
2. **WebSocket URL**: Update `VITE_SIGNALING_SERVER` to use `wss://` (secure WebSocket)
3. **TURN Server**: For production, add TURN servers for better connectivity (30-40% of users need it)

## ⚙️ Configuration

### STUN/TURN Servers

Edit `client/src/services/WebRTCService.js`:

```javascript
this.iceServers = {
  iceServers: [
    // Free STUN servers
    { urls: 'stun:stun.l.google.com:19302' },

    // Add TURN server for production (REQUIRED for ~30% of users)
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ]
};
```

#### Recommended TURN Providers:
- **Twilio ICE** - https://www.twilio.com/docs/stun-turn
- **Xirsys** - https://xirsys.com/
- **Cloudflare Calls** - https://www.cloudflare.com/products/calls/
- **Self-hosted Coturn** - https://github.com/coturn/coturn

### Environment Variables

**Client** (`.env`):
```bash
VITE_SIGNALING_SERVER=ws://localhost:3001  # Development
# VITE_SIGNALING_SERVER=wss://your-server.com  # Production
```

**Server**:
```bash
PORT=3001
NODE_ENV=production
```

## 🐛 Troubleshooting

### Camera/Microphone Not Working

- Ensure HTTPS (required in production)
- Check browser permissions
- Test with `chrome://settings/content/camera`

### Cannot Connect to Partner

- Check STUN/TURN server configuration
- Verify WebSocket connection
- Check firewall/NAT settings
- Add TURN server for restrictive networks

### WebSocket Connection Failed

- Verify signaling server is running
- Check CORS settings
- Ensure correct WebSocket URL (ws:// or wss://)
- Check firewall allows WebSocket connections

### No Video/Audio After Connection

- Check ICE candidate exchange
- Verify STUN servers are accessible
- Try adding TURN server
- Check browser console for WebRTC errors

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

- Built with WebRTC and modern web technologies
- Uses Google's free STUN servers
- Inspired by Omegle and Chatroulette

---

<div align="center">

**Built with ❤️ using WebRTC**

[Report Bug](../../issues) • [Request Feature](../../issues)

</div>
