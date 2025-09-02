const WebSocket = require('ws');

function testContainerMQTTDetailed() {
  console.log('🧪 Testing Containerized MQTT Functionality (Detailed)...\n');
  
  // Test basic connectivity first
  console.log('🔗 Testing WebSocket connection...');
  const ws = new WebSocket('ws://localhost:3000/mqtt');
  
  let messageReceived = false;
  
  ws.on('open', function open() {
    console.log('✅ WebSocket connected to containerized MQTT proxy');
    
    // Subscribe to a test topic
    console.log('📡 Subscribing to test topic...');
    ws.send(JSON.stringify({
      type: 'subscribe',
      topic: 'smarthome/room_1_left/light'
    }));
    
    // Wait a bit then publish
    setTimeout(() => {
      console.log('🔄 Publishing test message...');
      const testMessage = {
        type: 'publish',
        topic: 'smarthome/room_1_left/light',
        payload: JSON.stringify({
          roomId: 'room_1_left',
          isOn: true,
          timestamp: Date.now()
        })
      };
      console.log('📤 Sending:', testMessage);
      ws.send(JSON.stringify(testMessage));
    }, 2000);
  });
  
  ws.on('message', function message(data) {
    console.log('📨 Raw message received:', data.toString());
    try {
      const msg = JSON.parse(data);
      console.log('📋 Parsed message:', msg);
      
      if (msg.type === 'message') {
        messageReceived = true;
        try {
          const payload = JSON.parse(msg.payload);
          console.log('✅ MQTT Message received:', {
            topic: msg.topic,
            payload: payload,
            timestamp: new Date(payload.timestamp).toISOString()
          });
        } catch (e) {
          console.log('✅ MQTT Message received (raw payload):', {
            topic: msg.topic,
            payload: msg.payload
          });
        }
      }
    } catch (error) {
      console.log('⚠️  Could not parse message:', error.message);
    }
  });
  
  ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err.message);
  });
  
  ws.on('close', function close(code, reason) {
    console.log('🔌 WebSocket connection closed. Code:', code, 'Reason:', reason?.toString());
  });
  
  // Test for 8 seconds
  setTimeout(() => {
    if (messageReceived) {
      console.log('\n✅ Container MQTT test completed successfully! Message loop-back working.');
    } else {
      console.log('\n⚠️  No MQTT message received. Connection established but MQTT loop-back failed.');
      console.log('This could indicate an issue with the MQTT broker or proxy configuration.');
    }
    ws.close();
    process.exit(messageReceived ? 0 : 1);
  }, 8000);
}

testContainerMQTTDetailed();
