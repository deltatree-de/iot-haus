const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');
const mqtt = require('mqtt');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  // WebSocket Server for MQTT Proxy
  const wss = new WebSocket.Server({ 
    server,
    path: '/mqtt'
  });

  // MQTT Broker connection
  const mqttClient = mqtt.connect(`mqtt://${process.env.MQTT_BROKER_HOST || 'localhost'}:${process.env.MQTT_BROKER_PORT || 1883}`, {
    clientId: `mqtt-proxy-${Math.random().toString(16).slice(2, 10)}`,
    clean: true,
    reconnectPeriod: 1000,
  });

  const clientSubscriptions = new Map();
  const activeClients = new Set();

  mqttClient.on('connect', () => {
    console.log('MQTT Proxy connected to broker');
  });

  mqttClient.on('message', (topic, payload) => {
    const message = {
      type: 'message',
      topic: topic,
      payload: payload.toString(),
      timestamp: Date.now()
    };

    // Broadcast to all WebSocket clients subscribed to this topic
    activeClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        const subscriptions = clientSubscriptions.get(client) || new Set();
        if (subscriptions.has(topic) || Array.from(subscriptions).some(sub => topicMatch(sub, topic))) {
          client.send(JSON.stringify(message));
        }
      }
    });
  });

  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    activeClients.add(ws);
    clientSubscriptions.set(ws, new Set());

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'subscribe':
            const subscriptions = clientSubscriptions.get(ws);
            subscriptions.add(message.topic);
            mqttClient.subscribe(message.topic, (err) => {
              if (err) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: `Failed to subscribe to ${message.topic}`,
                  error: err.message
                }));
              } else {
                ws.send(JSON.stringify({
                  type: 'subscribed',
                  topic: message.topic
                }));
              }
            });
            break;

          case 'unsubscribe':
            const subs = clientSubscriptions.get(ws);
            subs.delete(message.topic);
            // Only unsubscribe from MQTT if no other clients are subscribed
            const stillSubscribed = Array.from(clientSubscriptions.values())
              .some(clientSubs => clientSubs.has(message.topic));
            if (!stillSubscribed) {
              mqttClient.unsubscribe(message.topic);
            }
            ws.send(JSON.stringify({
              type: 'unsubscribed',
              topic: message.topic
            }));
            break;

          case 'publish':
            mqttClient.publish(message.topic, message.payload, (err) => {
              if (err) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: `Failed to publish to ${message.topic}`,
                  error: err.message
                }));
              } else {
                ws.send(JSON.stringify({
                  type: 'published',
                  topic: message.topic
                }));
              }
            });
            break;

          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type',
              receivedType: message.type
            }));
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid JSON message',
          error: error.message
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      activeClients.delete(ws);
      clientSubscriptions.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      activeClients.delete(ws);
      clientSubscriptions.delete(ws);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'MQTT WebSocket Proxy connected'
    }));
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> MQTT WebSocket available at ws://${hostname}:${port}/mqtt`);
  });
});

// Helper function to match MQTT topic patterns
function topicMatch(pattern, topic) {
  if (pattern === topic) return true;
  
  const patternParts = pattern.split('/');
  const topicParts = topic.split('/');
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] === '#') return true;
    if (patternParts[i] === '+') continue;
    if (patternParts[i] !== topicParts[i]) return false;
  }
  
  return patternParts.length === topicParts.length;
}
