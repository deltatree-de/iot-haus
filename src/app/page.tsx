'use client';

import { useState, useCallback } from 'react';
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
  const [house, setHouse] = useState<House>(initialHouse);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

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

  // MQTT Hook
  const { publishMessage } = useMqtt({
    brokerUrl: process.env.NEXT_PUBLIC_MQTT_BROKER_URL || 'ws://localhost:3000/mqtt',
    topics: MQTT_TOPICS,
    onMessage: handleMqttMessage,
    onConnectionChange: setConnectionStatus,
  });

  // Handle light toggle
  const handleLightToggle = useCallback((roomId: string) => {
    const room = allRooms.find(r => r.id === roomId);
    if (!room) return;

    const newLightState = !room.lightOn;
    const topic = `smarthome/${roomId}/light`;
    
    // Update local state immediately for responsive UI
    setHouse(prevHouse => ({
      ...prevHouse,
      floors: prevHouse.floors.map(floor => ({
        ...floor,
        rooms: floor.rooms.map(r => 
          r.id === roomId 
            ? { ...r, lightOn: newLightState }
            : r
        ),
      })),
    }));

    // Publish to MQTT
    const lightState: LightState = {
      roomId,
      isOn: newLightState,
      timestamp: Date.now(),
    };

    publishMessage(topic, lightState);
  }, [allRooms, publishMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Smart Home Control System</h1>
          <p className="text-gray-600">Steuern Sie die Beleuchtung in Ihrem Zuhause in Echtzeit</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* House Visualization */}
          <div className="flex justify-center">
            <HouseVisualization 
              house={house} 
              onLightToggle={handleLightToggle}
            />
          </div>

          {/* Control Panel */}
          <div className="flex justify-center">
            <ControlPanel 
              rooms={allRooms}
              onLightToggle={handleLightToggle}
              connectionStatus={connectionStatus}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">System-Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>Stockwerke:</strong> 2
              </div>
              <div>
                <strong>Zimmer:</strong> 4
              </div>
              <div>
                <strong>MQTT Broker:</strong> {process.env.NEXT_PUBLIC_MQTT_BROKER_URL || 'ws://localhost:3000/mqtt'}
              </div>
              <div>
                <strong>Status:</strong> 
                <span className={`ml-1 ${
                  connectionStatus === 'connected' ? 'text-green-600' : 
                  connectionStatus === 'connecting' ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {connectionStatus === 'connected' ? 'Verbunden' : 
                   connectionStatus === 'connecting' ? 'Verbinde...' : 'Getrennt'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
