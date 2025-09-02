// Types for the smart home application
export interface Room {
  id: string;
  name: string;
  floor: number;
  position: 'left' | 'right';
  lightOn: boolean;
}

export interface Floor {
  number: number;
  rooms: Room[];
}

export interface House {
  floors: Floor[];
}

export interface LightState {
  roomId: string;
  isOn: boolean;
  timestamp: number;
  clientId?: string; // Optional client ID to prevent message loops
}

export interface MqttMessage {
  topic: string;
  payload: string;
  timestamp: number;
}
