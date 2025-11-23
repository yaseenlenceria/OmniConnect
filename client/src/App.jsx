import { useState, useEffect, useRef } from 'react';
import WebRTCService from './services/WebRTCService';
import SignalingService from './services/SignalingService';
import './App.css';

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'ws://localhost:3001';

function App() {
  const [status, setStatus] = useState('disconnected');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webrtcServiceRef = useRef(null);
  const signalingServiceRef = useRef(null);

  useEffect(() => {
    initializeServices();

    return () => {
      cleanup();
    };
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize WebRTC service
      webrtcServiceRef.current = new WebRTCService();

      // Initialize signaling service
      signalingServiceRef.current = new SignalingService(SIGNALING_SERVER);

      // Set up signaling callbacks
      setupSignalingCallbacks();

      // Set up WebRTC callbacks
      setupWebRTCCallbacks();

    } catch (err) {
      console.error('Error initializing services:', err);
      setError('Failed to initialize services');
    }
  };

  const setupSignalingCallbacks = () => {
    const signaling = signalingServiceRef.current;

    signaling.onConnected = (userId) => {
      console.log('Connected to server with ID:', userId);
      setStatus('connected');
      setError(null);
    };

    signaling.onWaiting = () => {
      setStatus('waiting');
    };

    signaling.onPaired = async (partnerId) => {
      console.log('Paired with partner:', partnerId);
      setStatus('paired');

      // First user in pair becomes initiator
      setIsInitiator(true);

      // Create and send offer
      try {
        const offer = await webrtcServiceRef.current.createOffer();
        signaling.sendOffer(offer);
        setStatus('connecting');
      } catch (err) {
        console.error('Error creating offer:', err);
        setError('Failed to create connection');
      }
    };

    signaling.onOffer = async (offer) => {
      console.log('Received offer');
      setIsInitiator(false);
      setStatus('connecting');

      try {
        const answer = await webrtcServiceRef.current.createAnswer(offer);
        signaling.sendAnswer(answer);
      } catch (err) {
        console.error('Error creating answer:', err);
        setError('Failed to establish connection');
      }
    };

    signaling.onAnswer = async (answer) => {
      console.log('Received answer');
      try {
        await webrtcServiceRef.current.handleAnswer(answer);
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    };

    signaling.onIceCandidate = async (candidate) => {
      try {
        await webrtcServiceRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    };

    signaling.onPartnerLeft = () => {
      console.log('Partner left the chat');
      setStatus('partner-left');
      handleDisconnect();
    };

    signaling.onDisconnected = () => {
      setStatus('disconnected');
    };

    signaling.onError = (err) => {
      console.error('Signaling error:', err);
      setError('Connection error');
    };
  };

  const setupWebRTCCallbacks = () => {
    const webrtc = webrtcServiceRef.current;

    webrtc.onIceCandidate = (candidate) => {
      signalingServiceRef.current.sendIceCandidate(candidate);
    };

    webrtc.onRemoteStream = (stream) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    webrtc.onConnectionStateChange = (state) => {
      console.log('Connection state changed:', state);
      if (state === 'connected') {
        setStatus('connected-to-peer');
      } else if (state === 'disconnected' || state === 'failed') {
        setStatus('connection-failed');
      }
    };
  };

  const startChat = async () => {
    try {
      setError(null);
      setStatus('initializing');

      // Get local media stream
      const stream = await webrtcServiceRef.current.initLocalStream();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect to signaling server
      await signalingServiceRef.current.connect();

      // Find a partner
      signalingServiceRef.current.findPartner();

    } catch (err) {
      console.error('Error starting chat:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera/microphone access denied. Please allow access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found.');
      } else {
        setError('Failed to start chat. Please check your camera and microphone.');
      }
      setStatus('error');
    }
  };

  const handleDisconnect = () => {
    webrtcServiceRef.current?.closePeerConnection();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const skipPartner = () => {
    handleDisconnect();
    signalingServiceRef.current?.skip();
    setStatus('waiting');
    signalingServiceRef.current?.findPartner();
  };

  const stopChat = () => {
    cleanup();
    setStatus('disconnected');
  };

  const cleanup = () => {
    webrtcServiceRef.current?.cleanup();
    signalingServiceRef.current?.close();
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const toggleVideo = () => {
    const enabled = webrtcServiceRef.current?.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const toggleAudio = () => {
    const enabled = webrtcServiceRef.current?.toggleAudio();
    setIsAudioEnabled(enabled);
  };

  const getStatusText = () => {
    switch (status) {
      case 'disconnected':
        return 'Click "Start Chat" to begin';
      case 'initializing':
        return 'Initializing camera and microphone...';
      case 'connected':
        return 'Connected to server';
      case 'waiting':
        return 'Waiting for a partner...';
      case 'paired':
        return 'Partner found! Connecting...';
      case 'connecting':
        return 'Establishing connection...';
      case 'connected-to-peer':
        return 'Connected! Enjoy your chat';
      case 'partner-left':
        return 'Partner left the chat';
      case 'connection-failed':
        return 'Connection failed. Try skipping to next partner.';
      case 'error':
        return 'Error occurred';
      default:
        return status;
    }
  };

  const isActive = ['waiting', 'paired', 'connecting', 'connected-to-peer'].includes(status);
  const isConnectedToPeer = status === 'connected-to-peer';

  return (
    <div className="app">
      <header className="header">
        <h1>OmniConnect</h1>
        <p className="tagline">Random Video Chat - Connect with strangers worldwide</p>
      </header>

      <main className="main">
        <div className="status-bar">
          <div className={`status-indicator ${isActive ? 'active' : ''}`}></div>
          <span className="status-text">{getStatusText()}</span>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="video-container">
          <div className="video-wrapper remote">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video"
            />
            <div className="video-label">Partner</div>
            {!isConnectedToPeer && (
              <div className="video-placeholder">
                <div className="placeholder-icon">👤</div>
                <p>Partner video will appear here</p>
              </div>
            )}
          </div>

          <div className="video-wrapper local">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="video"
            />
            <div className="video-label">You</div>
            {!isActive && (
              <div className="video-placeholder">
                <div className="placeholder-icon">📹</div>
                <p>Your video will appear here</p>
              </div>
            )}
          </div>
        </div>

        <div className="controls">
          {!isActive ? (
            <button className="btn btn-primary btn-large" onClick={startChat}>
              Start Chat
            </button>
          ) : (
            <>
              <div className="control-group">
                <button
                  className={`btn btn-control ${isVideoEnabled ? 'active' : 'inactive'}`}
                  onClick={toggleVideo}
                  title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoEnabled ? '📹' : '📹❌'}
                </button>

                <button
                  className={`btn btn-control ${isAudioEnabled ? 'active' : 'inactive'}`}
                  onClick={toggleAudio}
                  title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {isAudioEnabled ? '🎤' : '🎤❌'}
                </button>
              </div>

              <div className="control-group">
                <button className="btn btn-warning" onClick={skipPartner}>
                  Skip Partner
                </button>

                <button className="btn btn-danger" onClick={stopChat}>
                  Stop Chat
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>
          Built with WebRTC •
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"> GitHub</a>
        </p>
        <p className="info-text">
          Using Google STUN servers for connectivity
        </p>
      </footer>
    </div>
  );
}

export default App;
