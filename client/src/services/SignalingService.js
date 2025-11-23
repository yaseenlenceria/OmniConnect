/**
 * Signaling Service - Manages WebSocket connection to signaling server
 *
 * This service handles:
 * - WebSocket connection to server
 * - User ID management
 * - Sending/receiving signaling messages
 * - Partner matching requests
 */

class SignalingService {
  constructor(serverUrl) {
    this.serverUrl = serverUrl || 'ws://localhost:3001';
    this.ws = null;
    this.userId = null;
    this.partnerId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    // Event callbacks
    this.onConnected = null;
    this.onPaired = null;
    this.onOffer = null;
    this.onAnswer = null;
    this.onIceCandidate = null;
    this.onPartnerLeft = null;
    this.onWaiting = null;
    this.onDisconnected = null;
    this.onError = null;
  }

  /**
   * Connect to signaling server
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log('Connected to signaling server');
          this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (this.onError) {
            this.onError(error);
          }
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from signaling server');
          if (this.onDisconnected) {
            this.onDisconnected();
          }
          this.attemptReconnect();
        };

        resolve();
      } catch (error) {
        console.error('Failed to connect to signaling server:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming messages from server
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message.type);

      switch (message.type) {
        case 'connected':
          this.userId = message.userId;
          console.log('Assigned user ID:', this.userId);
          if (this.onConnected) {
            this.onConnected(this.userId);
          }
          break;

        case 'waiting':
          console.log('Waiting for partner...');
          if (this.onWaiting) {
            this.onWaiting();
          }
          break;

        case 'paired':
          this.partnerId = message.partnerId;
          console.log('Paired with:', this.partnerId);
          if (this.onPaired) {
            this.onPaired(this.partnerId);
          }
          break;

        case 'offer':
          console.log('Received offer from:', message.from);
          if (this.onOffer) {
            this.onOffer(message.offer);
          }
          break;

        case 'answer':
          console.log('Received answer from:', message.from);
          if (this.onAnswer) {
            this.onAnswer(message.answer);
          }
          break;

        case 'ice-candidate':
          if (this.onIceCandidate) {
            this.onIceCandidate(message.candidate);
          }
          break;

        case 'partner-left':
          console.log('Partner left');
          this.partnerId = null;
          if (this.onPartnerLeft) {
            this.onPartnerLeft();
          }
          break;

        case 'disconnected':
          console.log('Disconnected');
          this.partnerId = null;
          if (this.onDisconnected) {
            this.onDisconnected();
          }
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Send message to server
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      console.error('WebSocket is not connected');
      return false;
    }
  }

  /**
   * Request to find a partner
   */
  findPartner() {
    this.send({ type: 'find-partner' });
    console.log('Requested partner matching');
  }

  /**
   * Send WebRTC offer to partner
   */
  sendOffer(offer) {
    this.send({
      type: 'offer',
      offer: offer
    });
    console.log('Sent offer to partner');
  }

  /**
   * Send WebRTC answer to partner
   */
  sendAnswer(answer) {
    this.send({
      type: 'answer',
      answer: answer
    });
    console.log('Sent answer to partner');
  }

  /**
   * Send ICE candidate to partner
   */
  sendIceCandidate(candidate) {
    this.send({
      type: 'ice-candidate',
      candidate: candidate
    });
  }

  /**
   * Skip current partner
   */
  skip() {
    this.send({ type: 'skip' });
    this.partnerId = null;
    console.log('Skipped partner');
  }

  /**
   * Disconnect from current partner
   */
  disconnect() {
    this.send({ type: 'disconnect' });
    this.partnerId = null;
    console.log('Disconnected from partner');
  }

  /**
   * Attempt to reconnect to server
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Close WebSocket connection
   */
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.userId = null;
      this.partnerId = null;
    }
  }

  /**
   * Check if connected to server
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Check if paired with a partner
   */
  isPaired() {
    return this.partnerId !== null;
  }
}

export default SignalingService;
