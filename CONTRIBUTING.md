# 🤝 Contributing to OmniConnect

Thank you for considering contributing to OmniConnect! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)

---

## Code of Conduct

Be respectful, inclusive, and professional. We're all here to learn and build together.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Modern browser (Chrome, Firefox, Edge, Safari)
- Camera and microphone for testing

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/OmniConnect.git
cd OmniConnect
```

---

## Development Setup

### Install Dependencies

```bash
# Install all dependencies (both client and server)
npm run install:all

# Or install individually
cd server && npm install
cd ../client && npm install
```

### Run Development Servers

#### Option 1: Run Both Concurrently

```bash
# From root directory
npm run dev
```

#### Option 2: Run Separately

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

### Access the Application

- **Client**: http://localhost:3000
- **Server**: http://localhost:3001
- **Server Health**: http://localhost:3001/health

### Testing Changes

Open **two browser windows/tabs** to test the random matching:
1. Window 1: http://localhost:3000 → Click "Start Chat"
2. Window 2: http://localhost:3000 → Click "Start Chat"
3. Both should pair and connect

---

## Project Structure

```
OmniConnect/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── services/
│   │   │   ├── WebRTCService.js      # WebRTC connection logic
│   │   │   └── SignalingService.js   # WebSocket communication
│   │   ├── App.jsx                   # Main React component
│   │   ├── App.css                   # Styles
│   │   └── main.jsx                  # Entry point
│   └── package.json
│
├── server/                 # Backend signaling server
│   ├── server.js          # WebSocket server + matchmaking
│   └── package.json
│
└── docs/                   # Documentation
```

### Key Files to Understand

1. **server/server.js** - WebSocket server handling matchmaking and signaling
2. **client/src/services/WebRTCService.js** - WebRTC peer connection management
3. **client/src/services/SignalingService.js** - WebSocket client
4. **client/src/App.jsx** - UI and state management

---

## Making Changes

### Branch Naming

Create a descriptive branch name:

```bash
git checkout -b feature/add-text-chat
git checkout -b fix/video-freeze-issue
git checkout -b docs/update-readme
```

### Types of Contributions

#### 1. Bug Fixes

```bash
# Example: Fix video not displaying
1. Reproduce the bug
2. Identify the cause
3. Fix in appropriate file
4. Test thoroughly
5. Submit PR with description
```

#### 2. New Features

```bash
# Example: Add text chat
1. Discuss in GitHub issue first
2. Plan implementation
3. Update both client and server if needed
4. Add UI components
5. Test with multiple users
6. Document the feature
```

#### 3. Performance Improvements

- Optimize WebRTC connection speed
- Reduce bundle size
- Improve matching algorithm
- Reduce server memory usage

#### 4. Documentation

- Improve README
- Add code comments
- Create tutorials
- Fix typos

---

## Testing

### Manual Testing Checklist

- [ ] Both users can connect
- [ ] Video and audio work correctly
- [ ] Toggle camera/microphone works
- [ ] Skip partner works
- [ ] Disconnect works
- [ ] Reconnection after network drop works
- [ ] Multiple simultaneous pairs work
- [ ] Mobile responsive design works

### Browser Testing

Test on multiple browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if possible)

### Network Testing

Test under different conditions:
- Normal connection
- Slow 3G
- Behind VPN
- Behind restrictive NAT (if possible)

### Console Checks

No errors should appear in:
- Browser console
- Server terminal
- Network tab (WebSocket should be "101 Switching Protocols")

---

## Submitting Changes

### Commit Messages

Use clear, descriptive commit messages:

```bash
# Good
git commit -m "Add text chat feature"
git commit -m "Fix video freeze when toggling camera"
git commit -m "Improve connection reliability with ICE restart"

# Bad
git commit -m "fix bug"
git commit -m "update"
git commit -m "wip"
```

### Pull Request Process

1. **Update Documentation**: Update README if needed
2. **Test Thoroughly**: Ensure all features work
3. **Clean Code**: Remove console.logs and debug code
4. **Create PR**: Use the PR template

#### PR Title Format

```
[Type] Brief description

Examples:
[Feature] Add text chat functionality
[Fix] Resolve video freeze issue
[Docs] Update deployment guide
[Perf] Optimize ICE candidate handling
```

#### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested with multiple users
- [ ] No console errors

## Screenshots (if applicable)
Add screenshots or GIFs

## Related Issues
Fixes #123
```

---

## Coding Standards

### JavaScript/React

```javascript
// Use ES6+ features
const userId = generateId();
const handleClick = () => { /* ... */ };

// Descriptive variable names
const isConnected = true;  // Good
const x = true;            // Bad

// Comments for complex logic
// Calculate ICE candidate priority based on network type
const priority = calculatePriority(candidate);

// Async/await over promises
async function connect() {
  const stream = await getMediaStream();
}
```

### Code Organization

```javascript
// Group related functionality
class WebRTCService {
  // 1. Constructor
  constructor() { }

  // 2. Public methods
  async initLocalStream() { }
  createOffer() { }

  // 3. Private methods
  _handleIceCandidate() { }

  // 4. Cleanup
  cleanup() { }
}
```

### Error Handling

```javascript
// Always handle errors
try {
  const offer = await peerConnection.createOffer();
} catch (error) {
  console.error('Error creating offer:', error);
  // Inform user
  showError('Failed to create connection');
}
```

### CSS

```css
/* Use CSS variables */
:root {
  --primary-color: #4f46e5;
}

/* BEM naming or descriptive classes */
.video-container { }
.video-wrapper--remote { }

/* Mobile-first responsive design */
.container {
  width: 100%;
}

@media (min-width: 768px) {
  .container {
    max-width: 1200px;
  }
}
```

---

## Common Development Tasks

### Add New UI Button

```javascript
// 1. Add button in App.jsx
<button onClick={handleNewFeature}>
  New Feature
</button>

// 2. Add handler
const handleNewFeature = () => {
  // Implementation
};

// 3. Add styles in App.css
.btn-new-feature {
  background: var(--primary-color);
}
```

### Add Server Event

```javascript
// 1. Add event type in server.js
case 'new-event':
  handleNewEvent(message);
  break;

// 2. Add handler
function handleNewEvent(message) {
  // Implementation
}

// 3. Add client listener in SignalingService.js
case 'new-event':
  if (this.onNewEvent) {
    this.onNewEvent(message.data);
  }
  break;
```

### Debug WebRTC Issues

```javascript
// Add detailed logging
peerConnection.oniceconnectionstatechange = () => {
  console.log('ICE State:', peerConnection.iceConnectionState);
  console.log('ICE Gathering State:', peerConnection.iceGatheringState);
  console.log('Connection State:', peerConnection.connectionState);
};

// Check ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    console.log('ICE Candidate:', event.candidate);
  }
};
```

---

## Feature Ideas

Looking for ideas to contribute? Here are some suggestions:

### Easy
- [ ] Add "Report User" button
- [ ] Add connection quality indicator
- [ ] Improve error messages
- [ ] Add loading animations
- [ ] Dark/light theme toggle

### Medium
- [ ] Add text chat alongside video
- [ ] Filter users by interests/tags
- [ ] Add "Next" countdown timer
- [ ] Screenshot capture feature
- [ ] Add user statistics (time spent, partners met)

### Hard
- [ ] Screen sharing support
- [ ] Multiple video layouts (grid view)
- [ ] Recording functionality
- [ ] End-to-end encryption
- [ ] Mobile native apps (React Native)

---

## Resources

### WebRTC Learning
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [WebRTC for the Curious](https://webrtcforthecurious.com/)

### React
- [React Docs](https://react.dev/)
- [React Hooks](https://react.dev/reference/react)

### WebSockets
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws Library Docs](https://github.com/websockets/ws)

---

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Chat**: Join our Discord (if available)

---

## Recognition

Contributors will be:
- Listed in README
- Credited in release notes
- Given public thanks

Thank you for contributing! 🎉
