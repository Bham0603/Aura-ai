import { useState, useEffect, useRef } from 'react';

export function useDeepgram() {
  const [transcript, setTranscript] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (socketRef.current) return;

    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    if (!apiKey) {
      console.error('CRITICAL: Deepgram API Key is missing. Check your .env file and restart the server.');
      alert('CRITICAL: Deepgram API Key is missing. Check your .env file and restart the server.');
      return;
    }

    const url = 'wss://api.deepgram.com/v1/listen?model=nova-3&smart_format=true';
    const socket = new WebSocket(url, ['token', apiKey]);

    socket.onopen = () => {
      console.log('🟢 Deepgram WebSocket Opened Successfully!');
    };

    socket.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        console.log("Deepgram Raw Response:", parsedData);
        
        const newText = parsedData?.channel?.alternatives?.[0]?.transcript;
        if (parsedData?.is_final && newText && newText.trim().length > 0) {
          setTranscript((prev) => prev + (prev ? ' ' : '') + newText);
        }
      } catch (err) {
        console.error('Error parsing Deepgram message:', err);
      }
    };

    socket.onclose = () => {
      console.log('🔴 Deepgram WebSocket Closed.');
      socketRef.current = null;
    };

    socket.onerror = (error) => {
      console.error('❌ Deepgram WebSocket Error:', error);
    };

    socketRef.current = socket;
  };

  const disconnect = () => {
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
      }
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    socketRef,
    transcript,
    connectDeepgram: connect,
    disconnectDeepgram: disconnect,
    clearTranscript: () => setTranscript(''),
  };
}
