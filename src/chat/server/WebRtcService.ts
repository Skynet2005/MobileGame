// WebRTC Service for peer-to-peer direct messaging
// This service manages WebRTC connections between characters for private chats

// ICE server configuration for WebRTC
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Store active peer connections
interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  characterId: string;
  targetCharacterId: string;
}

class WebRTCService {
  private peerConnections: Map<string, PeerConnection>;
  private characterId: string | null;
  private onMessageCallback: ((message: any) => void) | null;
  private signalServerUrl: string;

  constructor() {
    this.peerConnections = new Map();
    this.characterId = null;
    this.onMessageCallback = null;
    this.signalServerUrl = process.env.NODE_ENV === 'production'
      ? `${window.location.origin}/api/chat/webrtc/signal`
      : 'http://localhost:3000/api/chat/webrtc/signal';
  }

  // Initialize the WebRTC service
  initialize(characterId: string, onMessage: (message: any) => void): void {
    this.characterId = characterId;
    this.onMessageCallback = onMessage;

    // Setup signaling server listeners
    this.setupSignalingListeners();
  }

  // Set up WebSocket connection for signaling
  private setupSignalingListeners(): void {
    if (!this.characterId) {
      console.error('Cannot set up WebRTC signaling without characterId');
      return;
    }

    // Note: WebSocket connection is established in the main WebSocket service
    // We'll use SSE as the signaling channel to exchange RTC offers/answers
    const eventSource = new EventSource(`/api/chat/notifications/sse?characterId=${this.characterId}`);

    eventSource.addEventListener('rtc_offer', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleIncomingOffer(data);
      } catch (error) {
        console.error('Error handling RTC offer:', error);
      }
    });

    eventSource.addEventListener('rtc_answer', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleIncomingAnswer(data);
      } catch (error) {
        console.error('Error handling RTC answer:', error);
      }
    });

    eventSource.addEventListener('rtc_ice_candidate', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleIncomingICECandidate(data);
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    eventSource.addEventListener('error', () => {
      console.error('SSE connection error');
      // Reconnect after a short delay
      setTimeout(() => this.setupSignalingListeners(), 5000);
    });
  }

  // Initiate a peer connection with another character
  async initiateConnection(targetCharacterId: string): Promise<void> {
    if (!this.characterId) {
      throw new Error('WebRTC service not initialized with characterId');
    }

    // Create a unique connection ID by combining the character IDs
    const connectionId = [this.characterId, targetCharacterId].sort().join('-');

    // Check if connection already exists
    if (this.peerConnections.has(connectionId)) {
      console.log('Peer connection already exists');
      return;
    }

    // Create new WebRTC peer connection
    const peerConnection = new RTCPeerConnection(iceServers);

    // Create data channel
    const dataChannel = peerConnection.createDataChannel('chat');
    this.setupDataChannel(dataChannel);

    // Store the connection
    this.peerConnections.set(connectionId, {
      connection: peerConnection,
      dataChannel,
      characterId: this.characterId,
      targetCharacterId
    });

    // Set up event handlers
    this.setupPeerConnectionListeners(peerConnection, connectionId);

    // Create and send offer
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send the offer via the server
      await fetch(this.signalServerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'offer',
          offer: peerConnection.localDescription,
          from: this.characterId,
          to: targetCharacterId
        }),
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      this.peerConnections.delete(connectionId);
    }
  }

  // Handle incoming offer from another character
  private async handleIncomingOffer(data: any): Promise<void> {
    if (!this.characterId) {
      console.error('Cannot handle offer without characterId');
      return;
    }

    const { from, offer } = data;

    // Create a unique connection ID
    const connectionId = [this.characterId, from].sort().join('-');

    // Create new peer connection if it doesn't exist
    if (!this.peerConnections.has(connectionId)) {
      const peerConnection = new RTCPeerConnection(iceServers);

      // Set up event listeners for this connection
      this.setupPeerConnectionListeners(peerConnection, connectionId);

      // Handle data channel creation by the remote peer
      peerConnection.addEventListener('datachannel', (event) => {
        this.setupDataChannel(event.channel);

        // Store data channel reference
        const connection = this.peerConnections.get(connectionId);
        if (connection) {
          connection.dataChannel = event.channel;
        }
      });

      // Store the connection
      this.peerConnections.set(connectionId, {
        connection: peerConnection,
        dataChannel: null,
        characterId: this.characterId,
        targetCharacterId: from
      });

      // Set remote description (the offer)
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        // Create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Send answer back
        await fetch(this.signalServerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'answer',
            answer: peerConnection.localDescription,
            from: this.characterId,
            to: from
          }),
        });
      } catch (error) {
        console.error('Error creating answer:', error);
        this.peerConnections.delete(connectionId);
      }
    }
  }

  // Handle incoming answer to our offer
  private async handleIncomingAnswer(data: any): Promise<void> {
    const { from, answer } = data;

    if (!this.characterId) {
      console.error('Cannot handle answer without characterId');
      return;
    }

    // Get the connection ID
    const connectionId = [this.characterId, from].sort().join('-');

    // Find the connection
    const connection = this.peerConnections.get(connectionId);

    if (connection) {
      try {
        // Set the remote description (the answer)
        await connection.connection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    }
  }

  // Handle incoming ICE candidate
  private async handleIncomingICECandidate(data: any): Promise<void> {
    const { from, candidate } = data;

    if (!this.characterId) {
      console.error('Cannot handle ICE candidate without characterId');
      return;
    }

    // Get the connection ID
    const connectionId = [this.characterId, from].sort().join('-');

    // Find the connection
    const connection = this.peerConnections.get(connectionId);

    if (connection) {
      try {
        // Add the ICE candidate
        await connection.connection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }

  // Set up event listeners for a peer connection
  private setupPeerConnectionListeners(
    peerConnection: RTCPeerConnection,
    connectionId: string
  ): void {
    // Handle ICE candidates
    peerConnection.addEventListener('icecandidate', async (event) => {
      if (event.candidate) {
        const connection = this.peerConnections.get(connectionId);

        if (connection && this.characterId) {
          try {
            // Send the ICE candidate to the peer via the server
            await fetch(this.signalServerUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'ice_candidate',
                candidate: event.candidate,
                from: this.characterId,
                to: connection.targetCharacterId
              }),
            });
          } catch (error) {
            console.error('Error sending ICE candidate:', error);
          }
        }
      }
    });

    // Handle connection state changes
    peerConnection.addEventListener('connectionstatechange', () => {
      switch (peerConnection.connectionState) {
        case 'connected':
          console.log('WebRTC peer connection established');
          break;
        case 'disconnected':
        case 'failed':
          console.log('WebRTC peer connection lost');
          this.peerConnections.delete(connectionId);
          break;
        case 'closed':
          console.log('WebRTC peer connection closed');
          this.peerConnections.delete(connectionId);
          break;
      }
    });
  }

  // Set up data channel for messaging
  private setupDataChannel(dataChannel: RTCDataChannel): void {
    dataChannel.onopen = () => {
      console.log('Data channel opened');
    };

    dataChannel.onclose = () => {
      console.log('Data channel closed');
    };

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(message);
        }
      } catch (error) {
        console.error('Error processing WebRTC message:', error);
      }
    };
  }

  // Send a message to a specific character via WebRTC
  async sendDirectMessage(targetCharacterId: string, content: string): Promise<boolean> {
    if (!this.characterId) {
      console.error('Cannot send message without characterId');
      return false;
    }

    // Get connection ID
    const connectionId = [this.characterId, targetCharacterId].sort().join('-');

    // Find the connection
    const connection = this.peerConnections.get(connectionId);

    // If connection exists and is ready, send the message
    if (connection && connection.dataChannel && connection.dataChannel.readyState === 'open') {
      try {
        const message = {
          type: 'direct_message',
          from: this.characterId,
          to: targetCharacterId,
          content,
          timestamp: new Date().toISOString()
        };

        connection.dataChannel.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebRTC message:', error);
        return false;
      }
    } else {
      // No open data channel, try to establish connection first
      try {
        await this.initiateConnection(targetCharacterId);
        console.log('Initiated new WebRTC connection, message will be sent once connected');
        return false; // Message not sent immediately, will need to try again after connection
      } catch (error) {
        console.error('Failed to initiate WebRTC connection:', error);
        return false;
      }
    }
  }

  // Close all peer connections
  closeAllConnections(): void {
    this.peerConnections.forEach((conn) => {
      if (conn.dataChannel) {
        conn.dataChannel.close();
      }
      conn.connection.close();
    });

    this.peerConnections.clear();
  }

  // Check if a connection to a character exists
  hasConnectionTo(characterId: string): boolean {
    if (!this.characterId) return false;

    const connectionId = [this.characterId, characterId].sort().join('-');
    return this.peerConnections.has(connectionId);
  }
}

// Export a singleton instance
const webRTCService = new WebRTCService();
export default webRTCService;
