import { useState, useRef, useEffect, useCallback } from 'react';

export function useAudioCapture(socketRef?: React.MutableRefObject<WebSocket | null>) {
  const [isSystemRecording, setIsSystemRecording] = useState(false);
  const [isMicRecording, setIsMicRecording] = useState(false);

  const systemRecorderRef = useRef<MediaRecorder | null>(null);
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  
  const systemStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const cleanupStream = (streamRef: React.MutableRefObject<MediaStream | null>) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const cleanupRecorder = (recorderRef: React.MutableRefObject<MediaRecorder | null>) => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  };

  const stopSystemAudio = useCallback(() => {
    cleanupRecorder(systemRecorderRef);
    cleanupStream(systemStreamRef);
    setIsSystemRecording(false);
  }, []);

  const stopMic = useCallback(() => {
    cleanupRecorder(micRecorderRef);
    cleanupStream(micStreamRef);
    setIsMicRecording(false);
  }, []);

  const captureSystemAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Stop video track to save resources
      stream.getVideoTracks().forEach((track) => track.stop());
      const audioTracks = stream.getAudioTracks();

      if (audioTracks.length === 0) {
        console.warn('No system audio track found.');
        cleanupStream({ current: stream } as React.MutableRefObject<MediaStream | null>);
        return;
      }

      // Create a new stream with just the audio track
      const audioStream = new MediaStream([audioTracks[0]]);
      systemStreamRef.current = audioStream;

      const mediaRecorder = new MediaRecorder(audioStream);
      systemRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          if (socketRef?.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(e.data);
          } else {
            console.log('System audio chunk received, size:', e.data.size);
          }
        }
      };

      // Handle user manually stopping the stream (e.g. from the Chrome overlay)
      audioTracks[0].onended = () => {
        stopSystemAudio();
      };

      mediaRecorder.start(250);
      setIsSystemRecording(true);
    } catch (err) {
      console.error('Failed to capture system audio:', err);
      setIsSystemRecording(false);
    }
  }, [stopSystemAudio, socketRef]);

  const captureMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      micStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      micRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          if (socketRef?.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(e.data);
          } else {
            console.log('Microphone audio chunk received, size:', e.data.size);
          }
        }
      };

      // Handle track ended
      stream.getAudioTracks()[0].onended = () => {
        stopMic();
      };

      mediaRecorder.start(250);
      setIsMicRecording(true);
    } catch (err) {
      console.error('Failed to capture microphone:', err);
      setIsMicRecording(false);
    }
  }, [stopMic, socketRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecorder(systemRecorderRef);
      cleanupStream(systemStreamRef);
      cleanupRecorder(micRecorderRef);
      cleanupStream(micStreamRef);
    };
  }, []);

  return {
    isSystemRecording,
    isMicRecording,
    captureSystemAudio,
    stopSystemAudio,
    captureMic,
    stopMic,
  };
}
