const WebSocket = require('ws');

function testContainerMQTTDebugPublish() {
  console.log('🧪 Testing Container MQTT Publish Response...\n');
  
  const ws = new WebSocket('ws://localhost:3000/mqtt');
  
  let publishResponse = false;
  
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
      
      if (msg.type === 'published') {
        publishResponse = true;
        console.log('✅ MQTT Publish confirmed by server!');
      }
      
      if (msg.type === 'message') {
        console.log('✅ MQTT Message received - loop-back working!');
      }
      
      if (msg.type === 'error') {
        console.log('❌ MQTT Error:', msg);
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
    if (publishResponse) {
      console.log('\n✅ Publish functionality confirmed! Server acknowledged the publish.');
    } else {
      console.log('\n❌ No publish response received. MQTT publish may have failed.');
    }
    ws.close();
    process.exit(publishResponse ? 0 : 1);
  }, 8000);
}

testContainerMQTTDebugPublish();
