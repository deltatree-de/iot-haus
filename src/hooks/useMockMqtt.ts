import { useEffect, useRef, useCallback } from 'react';
import { LightState } from '@/types';

interface MockMqttOptions {
  topics: string[];
  onMessage: (topic: string, message: LightState) => void;
  onConnectionChange: (status: 'connected' | 'disconnected' | 'connecting') => void;
}

// Mock MQTT client for local development without a real broker
export function useMockMqtt({ topics, onMessage, onConnectionChange }: MockMqttOptions) {
  const subscribersRef = useRef<Map<string, LightState>>(new Map());
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    onConnectionChange('connecting');
    
    // Simulate connection delay
    setTimeout(() => {
      isConnectedRef.current = true;
      onConnectionChange('connected');
      console.log('Mock MQTT connected');
    }, 1000);
  }, [onConnectionChange]);

  const publishMessage = useCallback((topic: string, message: LightState) => {
    if (!isConnectedRef.current) {
      console.warn('Mock MQTT client not connected');
      return;
    }

    console.log(`Mock MQTT publish to ${topic}:`, message);
    
    // Store the message
    subscribersRef.current.set(topic, message);
    
    // Simulate network delay and broadcast to other "clients"
    setTimeout(() => {
      onMessage(topic, message);
    }, 50);
  }, [onMessage]);

  const disconnect = useCallback(() => {
    isConnectedRef.current = false;
    onConnectionChange('disconnected');
    console.log('Mock MQTT disconnected');
  }, [onConnectionChange]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    publishMessage,
    disconnect,
    reconnect: connect,
    isConnected: isConnectedRef.current,
  };
}
