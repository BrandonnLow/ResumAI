from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import torchaudio
import torchaudio.transforms as T
import tempfile
import numpy as np
import os
import subprocess
from flask_cors import CORS
from load_model import load_finetuned_model, generate_response
from transformers import WhisperProcessor, WhisperForConditionalGeneration

app = Flask(__name__)
CORS(app)
torch.cuda.empty_cache()

emotion_model = None
emotion_labels = None
emotion_device = None

class AttentionPooling(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.attention = nn.Linear(input_dim, 1)
        
    def forward(self, x):
        weights = torch.softmax(self.attention(x), dim=1)
        return torch.sum(x * weights, dim=1)

class audioModel(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.wavModel = torchaudio.pipelines.WAV2VEC2_BASE.get_model()
        for i, layer in enumerate(self.wavModel.encoder.transformer.layers):
            if i < 8: 
                for param in layer.parameters():
                    param.requires_grad = False
        self.classifier = nn.Sequential(
            nn.Linear(3072, 512), nn.BatchNorm1d(512), nn.ReLU(), nn.Dropout(0.4),
            nn.Linear(512, 256), nn.BatchNorm1d(256), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, 128), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(128, num_classes)
        )
        self.pooling = AttentionPooling(3072)
        
    def forward(self, x):
        features, _ = self.wavModel.extract_features(x)
        features = torch.cat([features[-4], features[-3], features[-2], features[-1]], dim=-1)
        features = self.pooling(features)
        return self.classifier(features)

def convert_webm_to_wav(webm_path, wav_path):
    cmd = ['ffmpeg', '-i', webm_path, '-ar', '16000', '-ac', '1', '-y', wav_path]
    result = subprocess.run(cmd, capture_output=True, timeout=30)
    return result.returncode == 0

def load_emotion_model():
    global emotion_model, emotion_labels, emotion_device
    emotion_device = torch.device('cuda')
    emotion_labels = torch.load("emotion_labels.pth", map_location=emotion_device)
    emotion_model = audioModel(len(emotion_labels)).to(emotion_device)
    emotion_model.load_state_dict(torch.load("cremad_emotion_model.pth", map_location=emotion_device))
    emotion_model.eval()

@app.route('/deepSeekAnswer', methods=['POST'])
def generate_text():
    data = request.json
    prompt = f"""# Expert Interview Coach Feedback
## Your Task
Review the candidate's response to the question: "{data.get('question')}"
Their answer was: "{data.get('prompt')}"
Provide concise, actionable feedback with:
1. 2-3 specific strengths in the response
2. 1-2 areas for improvement with concrete suggestions
3. A brief, improved sample response (under 5 sentences)
DO NOT repeat the original question or answer verbatim.
DO NOT explain your thought process or analysis method.
Focus ONLY on constructive feedback and improvement suggestions."""
    
    model, tokenizer = load_finetuned_model("./model-finetuned-rtx4050")
    answer = generate_response(model, tokenizer, prompt)
    return jsonify({'answer': answer})

@app.route('/predictVoice', methods=['POST'])
def predict_emotion():
    if emotion_model is None:
        return jsonify({"error": "Model not loaded"}), 500
        
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file"}), 400
        
    audio_file = request.files['audio']
    audio_bytes = audio_file.read()
    
    with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_webm:
        temp_webm.write(audio_bytes)
        webm_path = temp_webm.name
    
    wav_path = webm_path.replace('.webm', '.wav')
    
    try:
        try:
            waveform, sample_rate = torchaudio.load(webm_path)
        except:
            if not convert_webm_to_wav(webm_path, wav_path):
                return jsonify({"error": "Audio conversion failed"}), 400
            waveform, sample_rate = torchaudio.load(wav_path)
        
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
        
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            waveform = resampler(waveform)
        
        waveform = waveform.squeeze().numpy()

        # Store entire waveform for Whisper
        entire_waveform = waveform.copy()
        
        if np.max(np.abs(waveform)) < 1e-6:
            return jsonify({"error": "Audio too quiet"}), 400
        
        waveform = waveform / np.max(np.abs(waveform))
        
        # Pad/cut waveform for emotion model
        if len(waveform) > 16000:
            waveform = waveform[:16000]
        else:
            waveform = np.pad(waveform, (0, 16000 - len(waveform)), mode='constant')
        
        waveform = torch.tensor(waveform, dtype=torch.float32).unsqueeze(0).to(emotion_device)
        
        # Emotion prediction using processed waveform
        with torch.no_grad():
            outputs = emotion_model(waveform)
            predicted_idx = torch.argmax(outputs, dim=1).item()
            confidence = torch.softmax(outputs, dim=1).max().item()

        whisper_processor = WhisperProcessor.from_pretrained("openai/whisper-base")
        whisper_model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-base")
        whisper_model.to(emotion_device)

        text = ""
        try:
            # Use entire waveform for Whisper transcription
            inputs = whisper_processor(entire_waveform, sampling_rate=16000, return_tensors="pt")
            inputs = inputs.to(emotion_device)
                
            with torch.no_grad():
                predicted_ids = whisper_model.generate(inputs["input_features"])
                text = whisper_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
        except Exception as e:
                text = "Transcription failed"
        
        return jsonify({
            "predicted_emotion": emotion_labels[predicted_idx],
            "confidence": float(confidence),
            "text": text
        })
        
    finally:
        for temp_path in [webm_path, wav_path]:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
if __name__ == '__main__':
    load_emotion_model()
    app.run(debug=True)
