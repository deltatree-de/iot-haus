import { useEffect, useRef, useCallback } from 'react';
import { LightState } from '@/types';
import { useMockMqtt } from './useMockMqtt';
import { useWebSocketMqtt } from './useWebSocketMqtt';

interface UseMqttOptions {
  brokerUrl: string;
  topics: string[];
  onMessage: (topic: string, message: LightState) => void;
  onConnectionChange: (status: 'connected' | 'disconnected' | 'connecting') => void;
}

export function useMqtt({ brokerUrl, topics, onMessage, onConnectionChange }: UseMqttOptions) {
  // Always use WebSocket MQTT instead of mock for real MQTT broker connection
  const shouldUseMock = false; // Changed from: brokerUrl.includes('localhost') && process.env.NODE_ENV === 'development';

  const mockMqtt = useMockMqtt({
    topics,
    onMessage,
    onConnectionChange,
  });

  const webSocketMqtt = useWebSocketMqtt({
    url: brokerUrl,
    topics,
    onMessage,
    onConnectionChange,
  });

  const publishMessage = useCallback((topic: string, message: LightState) => {
    if (shouldUseMock) {
      return mockMqtt.publishMessage(topic, message);
    } else {
      return webSocketMqtt.publishMessage(topic, message);
    }
  }, [shouldUseMock, mockMqtt, webSocketMqtt]);

  const disconnect = useCallback(() => {
    if (shouldUseMock) {
      return mockMqtt.disconnect();
    } else {
      return webSocketMqtt.disconnect();
    }
  }, [shouldUseMock, mockMqtt, webSocketMqtt]);

  const reconnect = useCallback(() => {
    if (shouldUseMock) {
      return mockMqtt.reconnect();
    } else {
      return webSocketMqtt.reconnect();
    }
  }, [shouldUseMock, mockMqtt, webSocketMqtt]);

  return {
    publishMessage,
    disconnect,
    reconnect,
    isConnected: shouldUseMock ? mockMqtt.isConnected : webSocketMqtt.isConnected,
  };
}
