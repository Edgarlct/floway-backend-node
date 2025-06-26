import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'event' | 'error';
  channel?: string;
  data?: any;
  eventType?: string;
}

export interface ClientSubscription {
  ws: WebSocket;
  subscriptions: Set<string>;
  clientId: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, ClientSubscription> = new Map();
  private server: any;

  constructor(port: number = 8080) {
    // Créer un serveur HTTP pour les WebSockets
    this.server = createServer();
    this.wss = new WebSocketServer({
      server: this.server,
      // Pas de vérification d'origine pour les apps mobiles
      verifyClient: () => true
    });

    this.setupWebSocketHandlers();
    this.server.listen(port, () => {
      console.log(`WebSocket Server running on port ${port}`);
    });
  }

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      console.log(`Client connected: ${clientId}`);

      // Créer une nouvelle subscription pour ce client
      const clientSubscription: ClientSubscription = {
        ws,
        subscriptions: new Set(),
        clientId
      };

      this.clients.set(clientId, clientSubscription);

      // Envoyer un message de bienvenue avec l'ID du client
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'connected',
        data: { clientId }
      });

      ws.on('message', (data: string) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          this.sendToClient(clientId, {
            type: 'error',
            data: { message: 'Invalid JSON format' }
          });
        }
      });

      ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        if (message.channel) {
          client.subscriptions.add(message.channel);
          console.log(`Client ${clientId} subscribed to ${message.channel}`);
          this.sendToClient(clientId, {
            type: 'event',
            eventType: 'subscribed',
            data: { channel: message.channel }
          });
        }
        break;

      case 'unsubscribe':
        if (message.channel) {
          client.subscriptions.delete(message.channel);
          console.log(`Client ${clientId} unsubscribed from ${message.channel}`);
          this.sendToClient(clientId, {
            type: 'event',
            eventType: 'unsubscribed',
            data: { channel: message.channel }
          });
        }
        break;

      default:
        this.sendToClient(clientId, {
          type: 'error',
          data: { message: 'Unknown message type' }
        });
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  // Méthodes publiques pour émettre des événements
  public emitToChannel(channel: string, eventType: string, data: any) {
    const message: WebSocketMessage = {
      type: 'event',
      eventType,
      data
    };

    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel)) {
        this.sendToClient(client.clientId, message);
      }
    });

    console.log(`Event '${eventType}' emitted to channel '${channel}' for ${this.getSubscriberCount(channel)} subscribers`);
  }

  public emitToAll(eventType: string, data: any) {
    const message: WebSocketMessage = {
      type: 'event',
      eventType,
      data
    };

    this.clients.forEach((client) => {
      this.sendToClient(client.clientId, message);
    });

    console.log(`Event '${eventType}' emitted to all ${this.clients.size} connected clients`);
  }

  public emitToClient(clientId: string, eventType: string, data: any) {
    this.sendToClient(clientId, {
      type: 'event',
      eventType,
      data
    });
  }

  public getSubscriberCount(channel: string): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel)) {
        count++;
      }
    });
    return count;
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public getChannels(): string[] {
    const channels = new Set<string>();
    this.clients.forEach((client) => {
      client.subscriptions.forEach((channel) => {
        channels.add(channel);
      });
    });
    return Array.from(channels);
  }

  public close() {
    this.wss.close();
    this.server.close();
  }
}

export const wsManager = new WebSocketManager(parseInt(process.env.WS_PORT || '8080'));
