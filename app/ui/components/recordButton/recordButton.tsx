import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Upload } from 'lucide-react';

interface PredictionResult {
  predicted_emotion: string;
  confidence: number;
  text:string;
}

interface VoiceEmotionRecorderProps {
  setUserAnswer: React.Dispatch<React.SetStateAction<string>>;
}

const VoiceEmotionRecorder: React.FC<VoiceEmotionRecorderProps> = ({setUserAnswer}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Auto-send audio for prediction when audioBlob is set
  useEffect(() => {
    if (audioBlob && !prediction) {
      sendAudioForPrediction();
    }
  }, [audioBlob]);

  const checkMicrophonePermission = async () => {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state;

  };

  const startRecording = async () => {
    try {
      setError('');
      setPrediction(null);
      setAudioBlob(null);
      
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording');
      }

      const permissionStatus = await checkMicrophonePermission();      
      let constraints: MediaStreamConstraints = { audio: true };
      
      
      if (permissionStatus === 'granted') {
        constraints = { 
          audio: {
            sampleRate: { ideal: 16000 },
            channelCount: { ideal: 1 },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        throw new Error('Your browser does not support audio recording');
      }
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/webm';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);      
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 20000);
      
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      
      let errorMessage = 'Failed to access microphone. ';
      setError(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioForPrediction = async () => {
    if (!audioBlob) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('http://localhost:5000/predictVoice', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result: PredictionResult = await response.json();
      setPrediction(result);
      setUserAnswer(result.text)
      
    } catch (err) {
      setError('Failed to get prediction. Make sure Flask server is running.');
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      happy: 'text-yellow-300',
      sad: 'text-blue-300',
      angry: 'text-red-300',
      fear: 'text-purple-300',
      disgust: 'text-green-300',
      neutral: 'text-gray-300'
    };
    return colors[emotion] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="max-w-md">
      
      <div className="flex flex-row items-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className={`
            w-12 min-w-12 h-12 min-h-12 rounded-full flex items-center justify-center text-white font-semibold
            transition-all duration-200 transform hover:scale-105 active:scale-95
            ${isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isRecording ? (
            <MicOff size={32} />
          ) : (
            <Mic size={32} />
          )}
        </button>
        
        {isLoading && (
          <div className="flex items-center space-x-2 pl-3 text-gray-600">
            <span>Analyzing...</span>
          </div>
        )}
        
        {error && (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {prediction && (
          <div className="w-full px-4 rounded-lg">
            <div className={`px-3 rounded-lg ${getEmotionColor(prediction.predicted_emotion)}`}>
              <p className="font-semibold text-lg capitalize">
                {prediction.predicted_emotion === 'happy' ? 'excited' : 
                  prediction.predicted_emotion === 'angry' ? 'confident' : 
                  prediction.predicted_emotion}
              </p>
              <p className="text-sm opacity-80">
                Magnitude: {(prediction.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default VoiceEmotionRecorder;
