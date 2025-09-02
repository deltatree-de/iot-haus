#!/usr/bin/env node

/**
 * Test Script für Multi-Device-Synchronisation
 * 
 * Dieses Skript simuliert mehrere Geräte und testet die MQTT-Synchronisation
 */

const WebSocket = require('ws');

const MQTT_URL = process.env.MQTT_URL || 'ws://localhost:3000/mqtt';
const ROOM_IDS = ['room_1_left', 'room_1_right', 'room_2_left', 'room_2_right'];

class MockDevice {
  constructor(name) {
    this.name = name;
    this.ws = null;
    this.lightStates = {};
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`🔌 ${this.name}: Verbinding zu ${MQTT_URL}...`);
      
      this.ws = new WebSocket(MQTT_URL);
      
      this.ws.on('open', () => {
        console.log(`✅ ${this.name}: Verbunden!`);
        
        // Subscribe to all room topics
        ROOM_IDS.forEach(roomId => {
          this.subscribe(`smarthome/${roomId}/light`);
        });
        
        resolve();
      });
      
      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });
      
      this.ws.on('error', (error) => {
        console.error(`❌ ${this.name}: WebSocket Fehler:`, error.message);
        reject(error);
      });
      
      this.ws.on('close', () => {
        console.log(`🔌 ${this.name}: Verbindung getrennt`);
      });
    });
  }

  subscribe(topic) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        topic: topic
      }));
    }
  }

  toggleLight(roomId) {
    const currentState = this.lightStates[roomId] || false;
    const newState = !currentState;
    
    const message = {
      roomId: roomId,
      isOn: newState,
      timestamp: Date.now()
    };
    
    console.log(`💡 ${this.name}: Schalte ${roomId} ${newState ? 'EIN' : 'AUS'}`);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'publish',
        topic: `smarthome/${roomId}/light`,
        payload: JSON.stringify(message)
      }));
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'message':
        const lightState = JSON.parse(message.payload);
        this.lightStates[lightState.roomId] = lightState.isOn;
        console.log(`🔄 ${this.name}: ${lightState.roomId} ist jetzt ${lightState.isOn ? 'EIN' : 'AUS'}`);
        break;
        
      case 'subscribed':
        console.log(`📡 ${this.name}: Abonniert: ${message.topic}`);
        break;
        
      case 'published':
        console.log(`📤 ${this.name}: Publiziert zu: ${message.topic}`);
        break;
        
      case 'error':
        console.error(`❌ ${this.name}: MQTT Fehler:`, message.message);
        break;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function runTest() {
  console.log('🏠 Smart Home Multi-Device Test\n');
  
  // Create mock devices
  const devices = [
    new MockDevice('📱 Smartphone'),
    new MockDevice('💻 Laptop'),
    new MockDevice('📺 Smart TV')
  ];
  
  try {
    // Connect all devices
    console.log('🔌 Verbinde alle Geräte...\n');
    await Promise.all(devices.map(device => device.connect()));
    
    console.log('\n⏱️  Warte auf Initialisierung...\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 1: Smartphone schaltet Wohnzimmer-Licht ein
    console.log('🧪 Test 1: Smartphone schaltet Wohnzimmer-Licht ein');
    devices[0].toggleLight('room_1_left');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 2: Laptop schaltet Küche-Licht ein
    console.log('\n🧪 Test 2: Laptop schaltet Küche-Licht ein');
    devices[1].toggleLight('room_1_right');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 3: Smart TV schaltet Schlafzimmer-Licht ein
    console.log('\n🧪 Test 3: Smart TV schaltet Schlafzimmer-Licht ein');
    devices[2].toggleLight('room_2_left');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 4: Smartphone schaltet alle Lichter aus
    console.log('\n🧪 Test 4: Smartphone schaltet alle Lichter aus');
    ROOM_IDS.forEach((roomId, index) => {
      setTimeout(() => devices[0].toggleLight(roomId), index * 200);
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n✅ Test abgeschlossen!');
    console.log('\n📊 Finale Lichtzustände:');
    devices.forEach(device => {
      console.log(`  ${device.name}:`, device.lightStates);
    });
    
    // Verify all devices have the same state
    const firstDeviceState = JSON.stringify(devices[0].lightStates);
    const allSynced = devices.every(device => 
      JSON.stringify(device.lightStates) === firstDeviceState
    );
    
    if (allSynced) {
      console.log('\n🎉 ERFOLG: Alle Geräte sind synchronisiert!');
    } else {
      console.log('\n❌ FEHLER: Geräte sind nicht synchronisiert!');
    }
    
  } catch (error) {
    console.error('\n❌ Test fehlgeschlagen:', error.message);
  } finally {
    // Disconnect all devices
    console.log('\n🔌 Trenne alle Geräte...');
    devices.forEach(device => device.disconnect());
    
    setTimeout(() => {
      console.log('\n👋 Test beendet');
      process.exit(0);
    }, 1000);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 Test abgebrochen');
  process.exit(0);
});

// Run the test
runTest().catch(console.error);
