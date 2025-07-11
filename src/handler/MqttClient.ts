import * as mqtt from 'mqtt';
import * as jwt from 'jsonwebtoken';

export class MqttClient {
    private client: mqtt.MqttClient | null = null;
    private brokerUrl: string;
    private options: mqtt.IClientOptions;

    constructor(brokerUrl: string = `mqtt://localhost:${process.env.MQTT_PORT || 1883}`) {
        this.brokerUrl = brokerUrl;
        this.options = {
            clientId: `fastify-server-${Math.random().toString(16).substr(2, 8)}`,
            clean: true,
            connectTimeout: 4000,
            username: 'fastify-server',
            password: null,
            reconnectPeriod: 1000,
        };
    }

    public async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client = mqtt.connect(this.brokerUrl, this.options);

            this.client.on('connect', () => {
                console.log('MQTT Client connected to broker');
                resolve();
            });

            this.client.on('error', (error) => {
                console.error('MQTT Client connection error:', error);
                reject(error);
            });

            this.client.on('reconnect', () => {
                console.log('MQTT Client reconnecting...');
            });

            this.client.on('close', () => {
                console.log('MQTT Client disconnected');
            });

            this.client.on('message', (topic, message) => {
                console.log(`Received message on topic ${topic}: ${message.toString()}`);
                this.handleMessage(topic, message.toString());
            });
        });
    }

    private handleMessage(topic: string, message: string): void {
        try {
            const data = JSON.parse(message);
            console.log(`Processed message from topic ${topic}:`, data);
        } catch (error) {
            console.log(`Raw message from topic ${topic}: ${message}`);
        }
    }

    public subscribe(topics: string | string[]): void {
        if (!this.client) {
            throw new Error('MQTT client not connected');
        }

        const topicArray = Array.isArray(topics) ? topics : [topics];

        topicArray.forEach(topic => {
            this.client!.subscribe(topic, (error) => {
                if (error) {
                    console.error(`Failed to subscribe to topic ${topic}:`, error);
                } else {
                    console.log(`Subscribed to topic: ${topic}`);
                }
            });
        });
    }

    public publish(topic: string, message: string | object, options?: mqtt.IClientPublishOptions): void {
        if (!this.client) {
            throw new Error('MQTT client not connected');
        }

        const payload = typeof message === 'string' ? message : JSON.stringify(message);

        this.client.publish(topic, payload, options || {}, (error) => {
            if (error) {
                console.error(`Failed to publish to topic ${topic}:`, error);
            } else {
                console.log(`Published message to topic ${topic}`);
            }
        });
    }

    public unsubscribe(topics: string | string[]): void {
        if (!this.client) {
            throw new Error('MQTT client not connected');
        }

        const topicArray = Array.isArray(topics) ? topics : [topics];

        topicArray.forEach(topic => {
            this.client!.unsubscribe(topic, (error) => {
                if (error) {
                    console.error(`Failed to unsubscribe from topic ${topic}:`, error);
                } else {
                    console.log(`Unsubscribed from topic: ${topic}`);
                }
            });
        });
    }

    public disconnect(): Promise<void> {
        return new Promise((resolve) => {
            if (this.client) {
                this.client.end(() => {
                    console.log('MQTT Client disconnected');
                    this.client = null;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    public isConnected(): boolean {
        return this.client ? this.client.connected : false;
    }
}
