import { WebSocketConfig } from './config';

class RobustWebSocket {
    private url: string;
    private heartbeatInterval: number;
    private reconnectDelay: number;
    private maxReconnectDelay: number;
    private queuedMessages: any[]; // Example, replace 'any' with appropriate type

    constructor(url: string, options: { heartbeatInterval?: number, reconnectDelay?: number, maxReconnectDelay?: number } = {}) {
        this.url = url;
        this.heartbeatInterval = options.heartbeatInterval || 30000;
        this.reconnectDelay = options.reconnectDelay || 1000;
        this.maxReconnectDelay = options.maxReconnectDelay || 30000;
        this.queuedMessages = [];
        this.isReconnecting = false;
        this.latency = null;
        this.initWebSocket();
      }

  initWebSocket() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("WebSocket connection established");
      this.isReconnecting = false;
      this.reconnectDelay = 1000;
      this.sendHeartbeat();
      this.sendQueuedMessages();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log("WebSocket connection closed");
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      if (!this.isReconnecting) {
        this.reconnect();
      } else {
        this.ws.close();
      }
    };
  }

  handleMessage(message) {
    switch (message.type) {
      case "heartbeat":
        this.latency = Date.now() - message.timestamp;
        console.log(`Latency: ${this.latency} ms`);
        this.updateStatus("heartbeat-status", "success", `Latency: ${this.latency} ms`);
        break;
      case "ack":
        console.log("Acknowledged message:", message.id);
        this.updateStatus("ack-status", "success", `Content: ${message.content}`);
        break;
      case "metrics_ack":
        this.updateStatus("metrics-status", "success", message.status);
        break;
      case "binary_ack":
        console.log(message.status);
        this.updateStatus("binary-data-status", "success", message.status);
        break;
      case "alert":
        console.log(message.status);
        this.updateStatus("alerting-status", "success", message.status);
        break;
      case "analytics_ack":
        console.log(message.status);
        this.updateStatus("analytics-status", "success", message.status);
        break;
      case "priority_ack":
        console.log(message.status);
        this.updateStatus("prioritization-status", "success", message.status);
        break;
      case "routing_ack":
        console.log(message.status);
        this.updateStatus("routing-status", "success", message.status);
        break;
      case "api_ack":
        console.log(message.status);
        this.updateStatus("api-abstraction-status", "success", message.status);
        break;
      case "custom_ack":
        console.log(message.status);
        this.updateStatus("customization-status", "success", message.status);
        break;
      case "qos_ack":
        console.log(message.status);
        this.updateStatus("qos-status", "success", message.status);
        break;
      case "config_ack":
        console.log(message.status);
        this.updateStatus("dynamic-config-status", "success", message.status);
        break;
      default:
        console.log("Received message:", message);
        break;
    }
  }

  sendHeartbeat() {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "heartbeat", timestamp: Date.now() }));
      setTimeout(() => this.sendHeartbeat(), this.heartbeatInterval);
    }
  }

  send(message) {
    if (typeof message === "object" && !message.id) {
      message.id = Date.now();
    }
    const data = JSON.stringify(message);
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.queuedMessages.push(data);
    }
  }

  sendCompressed(message) {
    if (typeof message === "object" && !message.id) {
      message.id = Date.now();
    }
    const compressedData = this.compress(JSON.stringify(message));
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(compressedData);
    } else {
      this.queuedMessages.push(compressedData);
    }
  }

  compress(data) {
    // Simple compression simulation (in reality, use a proper compression algorithm)
    return data.split("").reverse().join("");
  }

  sendQueuedMessages() {
    while (this.queuedMessages.length > 0 && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(this.queuedMessages.shift());
    }
  }

  reconnect() {
    if (!this.isReconnecting) {
      this.isReconnecting = true;
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        this.initWebSocket();
      }, this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }
  }

  updateStatus(id, status, message = "") {
    // Encapsulate DOM manipulation here, can be overridden or extended for different UIs
    if (typeof setStatus === 'function') {
      setStatus(id, status, message);
    } else {
      console.log(`Status [${id}]: ${status} - ${message}`);
    }
  }
}

// Usage example with configuration
const wsClient = new RobustWebSocket('wss://localhost:8765', WebSocketConfig);
