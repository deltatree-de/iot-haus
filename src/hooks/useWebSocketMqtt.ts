import { useEffect, useRef, useCallback, useState } from 'react';
import { LightState } from '@/types';

interface UseWebSocketMqttOptions {
  url: string;
  topics: string[];
  onMessage: (topic: string, message: LightState) => void;
  onConnectionChange: (status: 'connected' | 'disconnected' | 'connecting') => void;
}

// Generate a unique client ID to avoid message loops
const CLIENT_ID = `client_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

export function useWebSocketMqtt({ url, topics, onMessage, onConnectionChange }: UseWebSocketMqttOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const subscribedTopicsRef = useRef<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const sentMessagesRef = useRef<Set<string>>(new Set()); // Track sent messages to prevent loops

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
                console.log('🔌 WebSocket MQTT message received:', { topic: data.topic, lightState });
                
                // Temporarily disable duplicate filtering to debug
                // Create a unique message identifier to prevent rapid duplicate processing
                // const messageId = `${data.topic}_${lightState.roomId}_${lightState.isOn}_${lightState.timestamp}`;
                
                // Check if this exact message was just processed (prevent rapid duplicates)
                // if (sentMessagesRef.current.has(messageId)) {
                //   console.log('⏭️ Skipping duplicate message:', messageId);
                //   // Remove from tracking after a short delay to allow processing
                //   setTimeout(() => {
                //     sentMessagesRef.current.delete(messageId);
                //   }, 100);
                //   return;
                // }
                
                // Always process the message to update UI - even our own messages
                console.log('✅ Processing MQTT message, calling onMessage...');
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
      // Add client ID for identification but don't use it for filtering
      const messageWithClientId = {
        ...message,
        clientId: CLIENT_ID
      };
      
      // Track the message briefly to prevent rapid duplicates
      const messageId = `${topic}_${message.roomId}_${message.isOn}_${message.timestamp}`;
      sentMessagesRef.current.add(messageId);
      
      // Clean up old message IDs after 1 second
      setTimeout(() => {
        sentMessagesRef.current.delete(messageId);
      }, 1000);
      
      const payload = JSON.stringify(messageWithClientId);
      wsRef.current.send(JSON.stringify({
        type: 'publish',
        topic: topic,
        payload: payload
      }));
      console.log(`Published to ${topic}:`, messageWithClientId);
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
