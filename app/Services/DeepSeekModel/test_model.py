from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import torchaudio
import librosa
import tempfile
import os
from flask_cors import CORS
from load_model import load_finetuned_model, generate_response

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
            nn.Linear(3072, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, num_classes)
        )
        self.pooling = AttentionPooling(3072)
        
    def forward(self, x):
        features, _ = self.wavModel.extract_features(x)
        features = torch.cat([features[-4], features[-3], features[-2], features[-1]], dim=-1)
        features = self.pooling(features)
        return self.classifier(features)

def load_emotion_model():
    global emotion_model, emotion_labels, emotion_device
    try:
        emotion_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        emotion_labels = torch.load("emotion_labels.pth", map_location=emotion_device)
        emotion_model = audioModel(len(emotion_labels)).to(emotion_device)
        emotion_model.load_state_dict(torch.load("cremad_emotion_model.pth", map_location=emotion_device))
        emotion_model.eval()
        print(f"Emotion model loaded on {emotion_device}")
        return True
    except Exception as e:
        print(f"Error loading emotion model: {e}")
        return False

@app.route('/deepSeekAnswer', methods=['POST'])
def generate_text():
    data = request.json
    prompt = data.get('prompt')
    question = data.get('question')
    prompt = f"""
        # Expert Interview Coach Feedback

        ## Your Task
        Review the candidate's response to the question: "{question}"

        Their answer was: "{prompt}"

        Provide concise, actionable feedback with:
        1. 2-3 specific strengths in the response
        2. 1-2 areas for improvement with concrete suggestions
        3. A brief, improved sample response (under 5 sentences)

        DO NOT repeat the original question or answer verbatim.
        DO NOT explain your thought process or analysis method.
        Focus ONLY on constructive feedback and improvement suggestions.
        """
    model_path = "./model-finetuned-rtx4050"
    model, tokenizer = load_finetuned_model(model_path)
    answer = generate_response(model, tokenizer, prompt)

    return jsonify({'answer': answer})

@app.route('/predict', methods=['POST'])
def predict_emotion():
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        audio_bytes = audio_file.read()
        
        # Save to temp file and process
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name
        
        try:
            # Load and process audio
            waveform, _ = librosa.load(temp_path, sr=16000, mono=True)
            waveform = torch.from_numpy(waveform).float().squeeze()
            
            if waveform.shape[0] > 16000:
                waveform = waveform[:16000]
            else:
                waveform = torch.nn.functional.pad(waveform, (0, 16000 - waveform.shape[0]))
            
            # Predict
            with torch.no_grad():
                waveform = waveform.unsqueeze(0).to(emotion_device)
                outputs = emotion_model(waveform)
                predicted_idx = torch.argmax(outputs, dim=1).item()
                confidence = torch.softmax(outputs, dim=1).max().item()
            
            return jsonify({
                "predicted_emotion": emotion_labels[predicted_idx],
                "confidence": float(confidence)
            })
        
        finally:
            os.unlink(temp_path)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    load_emotion_model()
    app.run(debug=True)