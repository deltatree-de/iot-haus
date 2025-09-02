import { useEffect, useRef, useCallback, useState } from 'react';
import { LightState } from '@/types';

interface UseWebSocketMqttOptions {
  url: string;
  topics: string[];
  onMessage: (topic: string, message: LightState) => void;
  onConnectionChange: (status: 'connected' | 'disconnected' | 'connecting') => void;
}

export function useWebSocketMqtt({ url, topics, onMessage, onConnectionChange }: UseWebSocketMqttOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const subscribedTopicsRef = useRef<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    onConnectionChange('connecting');
    setIsConnected(false);

    try {
      const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://');
      // Don't add /mqtt if it's already in the URL
      const finalUrl = wsUrl.endsWith('/mqtt') ? wsUrl : `${wsUrl}/mqtt`;
      const ws = new WebSocket(finalUrl);

      ws.onopen = () => {
        console.log('WebSocket MQTT connected');
        onConnectionChange('connected');
        setIsConnected(true);
        
        // Subscribe to all topics
        topics.forEach(topic => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            topic: topic
          }));
          subscribedTopicsRef.current.add(topic);
        });

        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'message':
              try {
                const lightState: LightState = JSON.parse(data.payload);
                onMessage(data.topic, lightState);
              } catch (error) {
                console.error('Error parsing MQTT message payload:', error);
              }
              break;
              
            case 'subscribed':
              console.log(`Subscribed to topic: ${data.topic}`);
              break;
              
            case 'published':
              console.log(`Published to topic: ${data.topic}`);
              break;
              
            case 'error':
              console.error('MQTT WebSocket error:', data.message, data.error);
              break;
              
            case 'connected':
              console.log('MQTT WebSocket proxy connected');
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket MQTT disconnected:', event.code, event.reason);
        onConnectionChange('disconnected');
        setIsConnected(false);
        subscribedTopicsRef.current.clear();

        // Auto-reconnect after 2 seconds
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 2000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket MQTT error:', error);
        onConnectionChange('disconnected');
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      onConnectionChange('disconnected');
      setIsConnected(false);
    }
  }, [url, topics, onMessage, onConnectionChange]);

  const publishMessage = useCallback((topic: string, message: LightState) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(message);
      wsRef.current.send(JSON.stringify({
        type: 'publish',
        topic: topic,
        payload: payload
      }));
      console.log(`Published to ${topic}:`, message);
    } else {
      console.warn('WebSocket not connected, cannot publish message');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    subscribedTopicsRef.current.clear();
    onConnectionChange('disconnected');
    setIsConnected(false);
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
    isConnected,
  };
}
