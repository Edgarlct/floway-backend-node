import { JWTHandler } from "../webServer/security/JWTHandler";
import { createServer } from 'aedes-server-factory';
import { Server } from 'http';
import { Server as HttpsServer } from 'https';
import * as WebSocket from 'ws';
import * as fs from 'fs';
import * as path from 'path';

const aedes = require('aedes')();

export class MqttServer {
    private port: number;
    private wsPort: number;
    private wssPort?: number;
    private server: any;
    private httpServer: Server;
    private httpsServer?: HttpsServer;
    private wsServer: WebSocket.Server;
    private wssServer?: WebSocket.Server;

    constructor(port: number, wsPort: number, wssPort?: number) {
        this.port = port;
        this.wsPort = wsPort;
        this.wssPort = wssPort;

        process.on('SIGINT', () => {
            console.log('Stopping MQTT server...');
            this.stop();
            process.exit(0);
        })
    }

    public start() {
        // Authentication configuration
        aedes.authenticate = (client: any, username: string, password: Buffer, callback: Function) => {
            const jwt = password ? password.toString() : username;

            if (this.isAuthenticated(jwt) || client?.connDetails?.ipAddress === '::1') {
                callback(null, true);
            } else {
                console.log("Authentication failed for client:", client.id, client?.connDetails?.ipAddress);
                const error = new Error('Authentication failed');
                callback(error, false);
            }
        };

        // Authorization configuration
        aedes.authorizePublish = (client: any, packet: any, callback: Function) => {
            // Check if the client is authorized to publish to this topic
            callback(null);
        };

        aedes.authorizeSubscribe = (client: any, sub: any, callback: Function) => {
            // Check if the client is authorized to subscribe to this topic
            callback(null, sub);
        };

        // MQTT server events
        aedes.on('client', (client: any) => {
            console.log(`Client connected: ${client.id}`);
        });

        aedes.on('clientDisconnect', (client: any) => {
            console.log(`Client disconnected: ${client.id}`);
        });

        aedes.on('publish', (packet: any, client: any) => {
            if (client) {
                console.log(`Message published by ${client.id} on ${packet.topic}`);
            }
        });

        // Start the classic MQTT server (TCP)
        this.server = createServer(aedes);
        this.server.listen(this.port, () => {
            console.log(`MQTT server started on port ${this.port}`);
        });

        // Start the WebSocket server
        this.startWebSocketServer();

        // Start the WebSocket Secure server if wssPort is provided
        if (this.wssPort) {
            this.startWebSocketSecureServer();
        }
    }

    private startWebSocketServer() {
        const http = require('http');
        const ws = require('ws');

        // Create an HTTP server for WebSockets
        this.httpServer = http.createServer();

        // Create the WebSocket server
        this.wsServer = new ws.Server({
            server: this.httpServer,
            path: '/mqtt' // Important for the URL ws://localhost:8083/mqtt
        });

        // Handle WebSocket connections
        this.wsServer.on('connection', (socket: WebSocket, request: any) => {
            console.log('New WebSocket connection');

            // Authenticate the WebSocket client
            const jwt = request.headers['sec-websocket-protocol'] || request.headers['authorization'];
            if (!jwt || !this.isAuthenticated(jwt)) {
                console.error('WebSocket authentication failed');
                socket.close();
                return;
            }

            // Create a duplex stream for Aedes
            const stream = WebSocket.createWebSocketStream(socket);

            // Connect the stream to Aedes
            aedes.handle(stream);
        });

        // Start the HTTP/WebSocket server
        this.httpServer.listen(this.wsPort, () => {
            console.log(`WebSocket MQTT server started on port ${this.wsPort}`);
            console.log(`WebSocket URL: ws://localhost:${this.wsPort}/mqtt`);
        });
    }

    private startWebSocketSecureServer() {
        const https = require('https');
        const ws = require('ws');

        // SSL/TLS certificate configuration
        const sslOptions = this.getSSLOptions();
        if (!sslOptions) {
            console.error('SSL certificates not found, WSS server not started');
            return;
        }

        // Create an HTTPS server for WebSocket Secure
        this.httpsServer = https.createServer(sslOptions);

        // Create the WebSocket Secure server
        this.wssServer = new ws.Server({
            server: this.httpsServer,
            path: '/mqtt'
        });

        // Handle WSS connections
        this.wssServer.on('connection', (socket: WebSocket, request: any) => {
            console.log('New WebSocket Secure connection');

            const params = new URLSearchParams(request.url.split('?')[1]);

            // Authenticate the WebSocket client
            const jwt = request.headers['authorization'] || params.get('token');
            if (!jwt || !this.isAuthenticated(jwt)) {
                console.error('WebSocket Secure authentication failed');
                socket.close();
                return;
            }

            // Create a duplex stream for Aedes
            const stream = WebSocket.createWebSocketStream(socket);

            // Connect the stream to Aedes
            aedes.handle(stream);
        });

        // Start the HTTPS/WSS server
        this.httpsServer.listen(this.wssPort, () => {
            console.log(`WebSocket Secure MQTT server started on port ${this.wssPort}`);
            console.log(`WebSocket Secure URL: wss://localhost:${this.wssPort}/mqtt`);
        });
    }

    private getSSLOptions() {
        try {
            // Use environment variables for SSL certificate paths
            const sslCertPath = process.env.SSL_CERT_PATH;
            const sslKeyPath = process.env.SSL_KEY_PATH;
            const sslChainPath = process.env.SSL_CHAIN_PATH;
            const sslFullChainPath = process.env.SSL_FULLCHAIN_PATH;

            // If environment variables are set, use them
            if (sslKeyPath && (sslCertPath || sslFullChainPath)) {
                const keyPath = path.resolve(sslKeyPath);
                const certPath = path.resolve(sslFullChainPath || sslCertPath!);

                if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
                    const options: any = {
                        key: fs.readFileSync(keyPath),
                        cert: fs.readFileSync(certPath)
                    };

                    // Add chain if available and different from cert
                    if (sslChainPath && sslChainPath !== certPath) {
                        const chainPath = path.resolve(sslChainPath);
                        if (fs.existsSync(chainPath)) {
                            options.ca = fs.readFileSync(chainPath);
                        }
                    }

                    console.log(`SSL certificates loaded from: ${keyPath}, ${certPath}`);
                    return options;
                }
            }

            // Fallback to common locations
            const certPaths = [
                { key: './ssl/server.key', cert: './ssl/server.crt' }
            ];

            for (const certPath of certPaths) {
                if (fs.existsSync(certPath.key) && fs.existsSync(certPath.cert)) {
                    return {
                        key: fs.readFileSync(certPath.key),
                        cert: fs.readFileSync(certPath.cert)
                    };
                }
            }

            console.warn('No SSL certificates found. Please set SSL_KEY_PATH and SSL_CERT_PATH/SSL_FULLCHAIN_PATH in environment variables.');
            return null;
        } catch (error) {
            console.error('Error loading SSL certificates:', error);
            return null;
        }
    }

    public stop() {
        if (this.server) {
            this.server.close();
        }
        if (this.httpServer) {
            this.httpServer.close();
        }
        if (this.httpsServer) {
            this.httpsServer.close();
        }
        if (this.wsServer) {
            this.wsServer.close();
        }
        if (this.wssServer) {
            this.wssServer.close();
        }
        aedes.close();
        console.log('MQTT server stopped');
    }

    public isAuthenticated(jwt: string): boolean {
        try {
            return JWTHandler.verifyJwt(jwt);
        } catch (error) {
            console.error('JWT verification error:', error);
            return false;
        }
    }

    // Useful methods for server management
    public getConnectedClients() {
        return aedes.connectedClients;
    }

    public publishMessage(topic: string, message: string, qos: 0 | 1 | 2 = 0) {
        aedes.publish({
            topic: topic,
            payload: message,
            qos: qos,
            retain: false
        });
    }
}
