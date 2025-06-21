import React, { useState, useRef } from 'react';
import { Mic, MicOff, Upload } from 'lucide-react';

interface PredictionResult {
  predicted_emotion: string;
  confidence: number;
}

const VoiceEmotionRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state;
    } catch (err) {
      console.log('Permission API not supported');
      return 'unknown';
    }
  };

  const startRecording = async () => {
    try {
      setError('');
      setPrediction(null);
      setAudioBlob(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording');
      }

      // Check permission status first
      const permissionStatus = await checkMicrophonePermission();
      console.log('Microphone permission status:', permissionStatus);
      
      // Try with simpler constraints first
      let constraints: MediaStreamConstraints = { audio: true };
      
      // If permission is granted, try with advanced constraints
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
      
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Microphone access granted');
      
      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported('audio/webm') && !MediaRecorder.isTypeSupported('audio/wav')) {
        throw new Error('Your browser does not support audio recording');
      }
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav';
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
      console.log('Recording started');
      
      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 3000);
      
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      
      let errorMessage = 'Failed to access microphone. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone permission and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please check your audio devices.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Your browser does not support audio recording.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Microphone is already in use by another application.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
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
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result: PredictionResult = await response.json();
      setPrediction(result);
      
    } catch (err) {
      setError('Failed to get prediction. Make sure Flask server is running.');
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      happy: 'text-yellow-600 bg-yellow-50',
      sad: 'text-blue-600 bg-blue-50',
      angry: 'text-red-600 bg-red-50',
      fear: 'text-purple-600 bg-purple-50',
      disgust: 'text-green-600 bg-green-50',
      neutral: 'text-gray-600 bg-gray-50'
    };
    return colors[emotion] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
        Voice Emotion Detector
      </h2>
      
      <div className="flex flex-col items-center space-y-4">
        {/* Recording Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className={`
            w-24 h-24 rounded-full flex items-center justify-center text-white font-semibold
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
        
        <p className="text-sm text-gray-600 text-center">
          {isRecording ? 'Recording... (3 seconds)' : 'Click to record 3 seconds of audio'}
        </p>
        
        {/* Send for Prediction Button */}
        {audioBlob && !prediction && (
          <button
            onClick={sendAudioForPrediction}
            disabled={isLoading}
            className="
              flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg
              hover:bg-green-600 transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Upload size={20} />
            <span>{isLoading ? 'Analyzing...' : 'Predict Emotion'}</span>
          </button>
        )}
        
        {prediction && (
          <div className="w-full p-4 rounded-lg border-2 border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Prediction Result:</h3>
            <div className={`p-3 rounded-lg ${getEmotionColor(prediction.predicted_emotion)}`}>
              <p className="font-semibold text-lg capitalize">
                {prediction.predicted_emotion}
              </p>
              <p className="text-sm opacity-80">
                Confidence: {(prediction.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
        
        {prediction && (
          <button
            onClick={() => {
              setPrediction(null);
              setAudioBlob(null);
              setError('');
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            Record Again
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceEmotionRecorder;
