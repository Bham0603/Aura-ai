import { useEffect, useState } from 'react';
import { useAudioCapture } from './hooks/useAudioCapture';
import { useDeepgram } from './hooks/useDeepgram';
import { generateAIResponse } from './utils/gemini';

function App() {
  const { socketRef, transcript, connectDeepgram, disconnectDeepgram, clearTranscript } = useDeepgram();
  const {
    isSystemRecording,
    isMicRecording,
    captureSystemAudio,
    stopSystemAudio,
    captureMic,
    stopMic,
  } = useAudioCapture(socketRef);

  const [aiNotes, setAiNotes] = useState<string[]>([]);

  useEffect(() => {
    if (isSystemRecording || isMicRecording) {
      connectDeepgram();
    } else {
      disconnectDeepgram();
    }
  }, [isSystemRecording, isMicRecording, connectDeepgram, disconnectDeepgram]);

  // Debounce logic for Gemini API
  useEffect(() => {
    if (!transcript) return;

    const timeoutId = setTimeout(async () => {
      const currentTranscript = transcript;
      clearTranscript();
      
      const response = await generateAIResponse(currentTranscript);
      if (response && response !== 'NULL' && response !== '`NULL`') {
        setAiNotes((prev) => [response, ...prev]);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [transcript, clearTranscript]);

  return (
    <div className="overlay-container">
      <header className="header">
        <h1> Aura-Ai </h1>
      </header>

      <main className="content">
        <section className="transcript-section" style={{ minHeight: '60px', marginBottom: '20px' }}>
          <p style={{ fontStyle: 'italic', opacity: 0.8 }}>
            {transcript || 'Live transcript placeholder...'}
          </p>
        </section>

        <section className="ai-notes-section" style={{ flex: 1, overflowY: 'auto' }}>
          {aiNotes.length === 0 && (
            <p style={{ opacity: 0.5 }}>AI notes will appear here...</p>
          )}
          {aiNotes.map((note, index) => (
            <div 
              key={index} 
              className="ai-note" 
              style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderRadius: '8px',
                whiteSpace: 'pre-wrap'
              }}
            >
              {note}
            </div>
          ))}
        </section>
      </main>

      <footer className="interactive-element">
        <div className="control-panel">
          <div className="status-indicator">
            <span className={`status-dot ${(isSystemRecording || isMicRecording) ? 'recording' : ''}`}></span>
            <span>{(isSystemRecording || isMicRecording) ? 'Recording Active' : 'Idle'}</span>
          </div>
          
          <div className="toggles">
            <button 
              className={`toggle-btn ${isSystemRecording ? 'active' : ''}`} 
              onClick={isSystemRecording ? stopSystemAudio : captureSystemAudio}
            >
              {isSystemRecording ? 'Stop System Audio' : 'Capture System Audio'}
            </button>
            <button 
              className={`toggle-btn ${isMicRecording ? 'active' : ''}`} 
              onClick={isMicRecording ? stopMic : captureMic}
            >
              {isMicRecording ? 'Stop Microphone' : 'Capture Microphone'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
