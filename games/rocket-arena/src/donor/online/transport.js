import { PROTOCOL, PHYSICS_SHA256, decodeSnapshot } from './protocol.js';
export class Transport {
  constructor({ serverUrl, token, onMessage, onSnapshot, onState }) {
    this.url = serverUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/play';
    this.token = token; this.onMessage = onMessage; this.onSnapshot = onSnapshot; this.onState = onState;
    this.stopped = false; this.connected = false; this.inMatch = false; this.inLobby = false; this.retryStart = 0; this.retry = 0; this.graceMs = 30000;
  }
  connect() {
    if (this.stopped) return;
    this.onState(this.retryStart ? 'reconnecting' : 'connecting');
    const socket = this.socket = new WebSocket(this.url); socket.binaryType = 'arraybuffer';
    const timeout = this.connectTimeout = setTimeout(() => { if (!this.connected) socket.close(); }, 10000);
    socket.onopen = () => { if (this.socket === socket && !this.stopped) this.send({ type: 'hello', protocol: PROTOCOL, physics: PHYSICS_SHA256, nativeCheckpoint: 1, token: this.token }); };
    socket.onmessage = event => {
      if (this.socket !== socket || this.stopped) return;
      this.lastReceived = performance.now();
      try {
        if (event.data instanceof ArrayBuffer) { this.onSnapshot(decodeSnapshot(event.data)); return; }
        const message = JSON.parse(event.data);
        if (['connected', 'reserved', 'private_room'].includes(message.type)) {
          clearTimeout(timeout); this.connected = true; this.retryStart = this.retry = 0;
          this.onState('connected');
          clearInterval(this.heartbeat);
          this.heartbeat = setInterval(() => {
            if (performance.now() - this.lastReceived > 12000) socket.close();
            else this.send({ type: 'ping', nonce: Math.round(performance.now()) });
          }, 5000);
        }
        if (message.type === 'reserved') { this.inMatch = true; this.inLobby = false; this.graceMs = message.graceMs; }
        if (message.type === 'private_room') { this.inLobby = true; this.graceMs = message.graceMs; }
        if (message.type === 'private_closed') this.inLobby = false;
        if (['cancelled', 'result'].includes(message.type)) this.inMatch = false;
        if (message.type === 'error' && ['session_expired', 'update_required', 'reconnect_expired', 'session_replaced'].includes(message.code)) this.stop();
        this.onMessage(message);
      } catch { this.onState('update_required'); this.stop(); }
    };
    socket.onerror = () => {};
    socket.onclose = event => {
      clearTimeout(timeout);
      if (this.socket !== socket || this.stopped) return;
      clearInterval(this.heartbeat);
      if (event.code === 4001) { this.stop(); this.onState('session_replaced'); return; }
      this.connected = false;
      if (this.inMatch || this.inLobby) {
        this.retryStart ||= performance.now();
        if (performance.now() - this.retryStart < this.graceMs) {
          this.onState('reconnecting');
          this.reconnectTimer = setTimeout(() => this.connect(), Math.min(4000, 500 * 2 ** this.retry++)); return;
        }
      }
      this.onState('server_unavailable');
    };
  }
  send(message) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    // Close and use authenticated reconnect rather than adding stale inputs
    // to an unbounded browser/TCP send queue. Offline modes create no socket.
    if (message.type === 'input' && this.socket.bufferedAmount > 16384) { this.socket.close(4013, 'input_congestion'); return false; }
    this.socket.send(JSON.stringify(message)); return true;
  }
  stop() {
    this.stopped = true; this.connected = false; clearInterval(this.heartbeat); clearTimeout(this.reconnectTimer); clearTimeout(this.connectTimeout);
    if (this.socket && this.socket.readyState < WebSocket.CLOSING) this.socket.close(1000, 'leaving_online');
  }
}
