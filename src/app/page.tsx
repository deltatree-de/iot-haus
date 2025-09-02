'use client';

import { useState, useCallback, useEffect } from 'react';
import { House, Room, LightState } from '@/types';
import HouseVisualization from '@/components/HouseVisualization';
import ControlPanel from '@/components/ControlPanel';
import { useMqtt } from '@/hooks/useMqtt';

// Initial house configuration
const initialHouse: House = {
  floors: [
    {
      number: 1,
      rooms: [
        { id: 'room_1_left', name: 'Wohnzimmer', floor: 1, position: 'left', lightOn: false },
        { id: 'room_1_right', name: 'Küche', floor: 1, position: 'right', lightOn: false },
      ],
    },
    {
      number: 2,
      rooms: [
        { id: 'room_2_left', name: 'Schlafzimmer', floor: 2, position: 'left', lightOn: false },
        { id: 'room_2_right', name: 'Badezimmer', floor: 2, position: 'right', lightOn: false },
      ],
    },
  ],
};

// MQTT Topics for each room
const MQTT_TOPICS = [
  'smarthome/room_1_left/light',
  'smarthome/room_1_right/light',
  'smarthome/room_2_left/light',
  'smarthome/room_2_right/light',
];

export default function Home() {
  // Initialize house state from localStorage if available
  const [house, setHouse] = useState<House>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smart-home-state');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error('Failed to parse saved state:', error);
        }
      }
    }
    return initialHouse;
  });
  
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart-home-state', JSON.stringify(house));
    }
  }, [house]);

  // Get all rooms in a flat array
  const allRooms = house.floors.flatMap(floor => floor.rooms);

  // Handle incoming MQTT messages
  const handleMqttMessage = useCallback((topic: string, message: LightState) => {
    setHouse(prevHouse => ({
      ...prevHouse,
      floors: prevHouse.floors.map(floor => ({
        ...floor,
        rooms: floor.rooms.map(room => 
          room.id === message.roomId 
            ? { ...room, lightOn: message.isOn }
            : room
        ),
      })),
    }));
  }, []);

  // Generate WebSocket URL dynamically based on current window location
  const getMqttBrokerUrl = useCallback(() => {
    if (typeof window === 'undefined') {
      // Server-side fallback
      const envUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;
      return envUrl && envUrl !== 'auto' ? envUrl : 'ws://localhost:3000/mqtt';
    }
    
    // Check if environment variable is set and use it if it's not localhost or auto
    const envUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;
    if (envUrl && envUrl !== 'auto' && !envUrl.includes('localhost')) {
      return envUrl;
    }
    
    // Generate relative WebSocket URL based on current window location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/mqtt`;
  }, []);

  // MQTT Hook
  const { publishMessage } = useMqtt({
    brokerUrl: getMqttBrokerUrl(),
    topics: MQTT_TOPICS,
    onMessage: handleMqttMessage,
    onConnectionChange: setConnectionStatus,
  });

  // Sync initial state when connected
  useEffect(() => {
    if (connectionStatus === 'connected') {
      // Small delay to ensure connection is fully established
      const timeoutId = setTimeout(() => {
        allRooms.forEach(room => {
          const topic = `smarthome/${room.id}/light`;
          const lightMessage: LightState = {
            roomId: room.id,
            isOn: room.lightOn,
            timestamp: Date.now(),
          };
          publishMessage(topic, lightMessage);
        });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [connectionStatus, allRooms, publishMessage]);

  // Handle light toggle
  const handleLightToggle = useCallback((roomId: string) => {
    const room = allRooms.find(r => r.id === roomId);
    if (!room) return;

    const newLightState = !room.lightOn;
    const topic = `smarthome/${roomId}/light`;
    
    // Create MQTT message
    const lightMessage: LightState = {
      roomId,
      isOn: newLightState,
      timestamp: Date.now(),
    };

    // Publish to MQTT - this will trigger onMessage for ALL connected clients
    publishMessage(topic, lightMessage);
    
    // Note: We DON'T update local state here - it will be updated via MQTT onMessage
    // This ensures all devices stay in sync
  }, [allRooms, publishMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-white/20 mb-6">
            <span className="text-3xl mr-3">🏠</span>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Smart Home
              </h1>
              <p className="text-lg text-gray-600 font-medium">Control System</p>
            </div>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Steuern Sie die Beleuchtung in Ihrem intelligenten Zuhause mit modernster MQTT-Technologie in Echtzeit
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
          {/* House Visualization */}
          <div className="flex justify-center">
            <div className="transform hover:scale-105 transition-transform duration-500">
              <HouseVisualization 
                house={house} 
                onLightToggle={handleLightToggle}
              />
            </div>
          </div>

          {/* Control Panel */}
          <div className="flex justify-center">
            <div className="transform hover:scale-105 transition-transform duration-500">
              <ControlPanel 
                rooms={allRooms}
                onLightToggle={handleLightToggle}
                connectionStatus={connectionStatus}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Footer Info */}
        <div className="mt-16 text-center">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto border border-white/20">
            <div className="mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                📊 System-Information
              </h3>
              <p className="text-gray-600">Technische Details Ihres Smart Home Systems</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="text-3xl mb-2">🏢</div>
                <div className="text-2xl font-bold text-blue-600">2</div>
                <div className="text-sm text-gray-600 font-medium">Stockwerke</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="text-3xl mb-2">🚪</div>
                <div className="text-2xl font-bold text-purple-600">4</div>
                <div className="text-sm text-gray-600 font-medium">Zimmer</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="text-3xl mb-2">📡</div>
                <div className="text-xs font-mono text-green-600 truncate">{getMqttBrokerUrl().split('//')[1]}</div>
                <div className="text-sm text-gray-600 font-medium">MQTT Broker</div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <div className="text-3xl mb-2">
                  {connectionStatus === 'connected' ? '✅' : 
                   connectionStatus === 'connecting' ? '🔄' : '❌'}
                </div>
                <div className={`text-sm font-bold ${
                  connectionStatus === 'connected' ? 'text-green-600' : 
                  connectionStatus === 'connecting' ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {connectionStatus === 'connected' ? 'Verbunden' : 
                   connectionStatus === 'connecting' ? 'Verbinde...' : 'Getrennt'}
                </div>
                <div className="text-sm text-gray-600 font-medium">Verbindung</div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <span className="mr-2">⚡</span>
                <span className="font-medium">Echtzeit-Synchronisation über MQTT</span>
                <span className="ml-2">•</span>
                <span className="ml-2">WebSocket-Protokoll</span>
                <span className="ml-2">•</span>
                <span className="ml-2">Multi-Device Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
