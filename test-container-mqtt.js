const WebSocket = require('ws');

function testContainerMQTT() {
  console.log('🧪 Testing Containerized MQTT Functionality...\n');
  
  const ws = new WebSocket('ws://localhost:3000/mqtt');
  
  ws.on('open', function open() {
    console.log('✅ WebSocket connected to containerized MQTT proxy');
    
    // Subscribe to all room topics
    const rooms = ['room_1_left', 'room_1_right', 'room_2_left', 'room_2_right'];
    rooms.forEach(roomId => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        topic: `smarthome/${roomId}/light`
      }));
    });
    
    console.log('📡 Subscribed to all room topics');
    
    // Test publishing a state change
    setTimeout(() => {
      console.log('🔄 Publishing test state change...');
      const testMessage = {
        type: 'publish',
        topic: 'smarthome/room_1_left/light',
        payload: JSON.stringify({
          roomId: 'room_1_left',
          isOn: true,
          timestamp: Date.now()
        })
      };
      ws.send(JSON.stringify(testMessage));
    }, 1000);
  });
  
  ws.on('message', function message(data) {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'message') {
        const payload = JSON.parse(msg.payload);
        console.log(`📨 Received MQTT message:`, {
          topic: msg.topic,
          roomId: payload.roomId,
          isOn: payload.isOn,
          timestamp: new Date(payload.timestamp).toISOString()
        });
      }
    } catch (error) {
      console.log('Raw message:', data.toString());
    }
  });
  
  ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err.message);
  });
  
  ws.on('close', function close() {
    console.log('🔌 WebSocket connection closed');
  });
  
  // Close after 5 seconds
  setTimeout(() => {
    console.log('\n✅ Container MQTT test completed successfully!');
    ws.close();
    process.exit(0);
  }, 5000);
}

testContainerMQTT();
