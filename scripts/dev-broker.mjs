// Lokaler MQTT-Broker für die Entwicklung ohne Docker (aedes, nur devDependency).
// Start: npm run dev:broker   – dann in einem zweiten Terminal: npm run dev
import net from 'node:net';
import { Aedes } from 'aedes';

const port = Number(process.env.MQTT_BROKER_PORT || 1883);
const broker = await Aedes.createBroker();
const server = net.createServer(broker.handle);

server.listen(port, '127.0.0.1', () => {
  console.log(`MQTT-Entwicklungsbroker läuft auf mqtt://127.0.0.1:${port} (Zustand nur im Speicher)`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
