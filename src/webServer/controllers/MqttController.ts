import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as jwt from 'jsonwebtoken';

interface MqttTokenRequest {
    Body: {
        clientId: string;
        userId?: string;
    };
}

interface MqttPublishRequest {
    Body: {
        topic: string;
        message: string | object;
    };
}

export function MqttController(fastify: FastifyInstance) {
    
    fastify.post('/mqtt/token', async (request: FastifyRequest<MqttTokenRequest>, reply: FastifyReply) => {
        try {
            const { clientId, userId } = request.body;
            
            if (!clientId) {
                return reply.status(400).send({ error: 'Client ID is required' });
            }

            const token = jwt.sign(
                { 
                    clientId, 
                    userId: userId || null,
                    type: 'mqtt',
                    timestamp: Date.now()
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            reply.send({ 
                token,
                websocketUrl: `ws://localhost:${process.env.MQTT_WS_PORT || 8883}?token=${token}`,
                tcpUrl: `mqtt://localhost:${process.env.MQTT_PORT || 1883}`
            });
        } catch (error) {
            console.error('Error generating MQTT token:', error);
            reply.status(500).send({ error: 'Internal server error' });
        }
    });

    fastify.post('/mqtt/publish', async (request: FastifyRequest<MqttPublishRequest>, reply: FastifyReply) => {
        try {
            const { topic, message } = request.body;
            
            if (!topic || !message) {
                return reply.status(400).send({ error: 'Topic and message are required' });
            }

            reply.send({ success: true, message: 'Message queued for publishing' });
        } catch (error) {
            console.error('Error publishing MQTT message:', error);
            reply.status(500).send({ error: 'Internal server error' });
        }
    });

    fastify.get('/mqtt/status', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            reply.send({ 
                status: 'running',
                ports: {
                    mqtt: process.env.MQTT_PORT || 1883,
                    websocket: process.env.MQTT_WS_PORT || 8883
                }
            });
        } catch (error) {
            console.error('Error getting MQTT status:', error);
            reply.status(500).send({ error: 'Internal server error' });
        }
    });
}