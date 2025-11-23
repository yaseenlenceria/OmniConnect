import express from 'express';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import http from 'http';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store connected clients
const clients = new Map();
// Queue of users waiting to be paired
const waitingQueue = [];
// Store active pairs
const activePairs = new Map();

// Utility function to send message to a client
function sendToClient(clientId, message) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === 1) { // OPEN state
    client.ws.send(JSON.stringify(message));
  }
}

// Pair two users together
function pairUsers(userId1, userId2) {
  activePairs.set(userId1, userId2);
  activePairs.set(userId2, userId1);

  // Notify both users they are paired
  sendToClient(userId1, {
    type: 'paired',
    partnerId: userId2,
    message: 'You are now connected! Begin WebRTC negotiation.'
  });

  sendToClient(userId2, {
    type: 'paired',
    partnerId: userId1,
    message: 'You are now connected! Begin WebRTC negotiation.'
  });

  console.log(`Paired users: ${userId1} <-> ${userId2}`);
}

// Remove user from waiting queue
function removeFromQueue(userId) {
  const index = waitingQueue.indexOf(userId);
  if (index > -1) {
    waitingQueue.splice(index, 1);
  }
}

// Handle user disconnect
function handleDisconnect(userId) {
  console.log(`User disconnected: ${userId}`);

  // Remove from waiting queue
  removeFromQueue(userId);

  // If user was in an active pair, notify partner
  const partnerId = activePairs.get(userId);
  if (partnerId) {
    sendToClient(partnerId, {
      type: 'partner-left',
      message: 'Your partner has disconnected.'
    });
    activePairs.delete(partnerId);
    activePairs.delete(userId);
  }

  // Remove client
  clients.delete(userId);

  console.log(`Active clients: ${clients.size}, Waiting: ${waitingQueue.length}, Pairs: ${activePairs.size / 2}`);
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  const userId = uuidv4();
  console.log(`New connection: ${userId}`);

  // Store client
  clients.set(userId, { ws, userId });

  // Send user their ID
  ws.send(JSON.stringify({
    type: 'connected',
    userId: userId,
    message: 'Connected to signaling server'
  }));

  // Handle messages from client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'find-partner':
          // Add user to waiting queue
          if (!waitingQueue.includes(userId)) {
            waitingQueue.push(userId);
            console.log(`User ${userId} added to queue. Queue size: ${waitingQueue.length}`);

            // Try to pair with someone in queue
            if (waitingQueue.length >= 2) {
              const user1 = waitingQueue.shift();
              const user2 = waitingQueue.shift();
              pairUsers(user1, user2);
            } else {
              sendToClient(userId, {
                type: 'waiting',
                message: 'Waiting for a partner...'
              });
            }
          }
          break;

        case 'offer':
          // Forward WebRTC offer to partner
          const offerPartnerId = activePairs.get(userId);
          if (offerPartnerId) {
            sendToClient(offerPartnerId, {
              type: 'offer',
              offer: message.offer,
              from: userId
            });
            console.log(`Forwarded offer from ${userId} to ${offerPartnerId}`);
          }
          break;

        case 'answer':
          // Forward WebRTC answer to partner
          const answerPartnerId = activePairs.get(userId);
          if (answerPartnerId) {
            sendToClient(answerPartnerId, {
              type: 'answer',
              answer: message.answer,
              from: userId
            });
            console.log(`Forwarded answer from ${userId} to ${answerPartnerId}`);
          }
          break;

        case 'ice-candidate':
          // Forward ICE candidate to partner
          const icePartnerId = activePairs.get(userId);
          if (icePartnerId) {
            sendToClient(icePartnerId, {
              type: 'ice-candidate',
              candidate: message.candidate,
              from: userId
            });
          }
          break;

        case 'skip':
        case 'disconnect':
          // Handle user wanting to disconnect/skip
          const currentPartnerId = activePairs.get(userId);
          if (currentPartnerId) {
            sendToClient(currentPartnerId, {
              type: 'partner-left',
              message: 'Your partner has disconnected.'
            });
            activePairs.delete(currentPartnerId);
            activePairs.delete(userId);
          }
          removeFromQueue(userId);

          sendToClient(userId, {
            type: 'disconnected',
            message: 'You have been disconnected.'
          });
          break;

        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle connection close
  ws.on('close', () => {
    handleDisconnect(userId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${userId}:`, error);
    handleDisconnect(userId);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: clients.size,
    waiting: waitingQueue.length,
    activePairs: activePairs.size / 2
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});
