'use client';

import { useState, useEffect } from 'react';
import { getWebSocketClient } from '@/lib/websocket-client';

export default function WebSocketStatus() {
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const wsClient = getWebSocketClient();
    
    // Try to connect if WebSocket URL is configured
    // Use NEXT_PUBLIC_ prefix for client-side access
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) {
      wsClient.connect()
        .then(() => {
          setConnected(true);
          
          // Subscribe to updates
          wsClient.subscribe('*', (data) => {
            setLastUpdate(new Date());
            console.log('WebSocket update:', data);
          });
        })
        .catch((error) => {
          console.error('WebSocket connection failed:', error);
          setConnected(false);
        });
    }

    return () => {
      wsClient.disconnect();
    };
  }, []);

  if (!process.env.NEXT_PUBLIC_WS_URL) {
    return null; // Don't show if WebSocket is not configured
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      background: 'white',
      border: `1px solid ${connected ? '#10b981' : '#ef4444'}`,
      color: '#333',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      fontSize: '0.85rem',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: connected ? '#10b981' : '#ef4444',
        }} />
        <span>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
}

