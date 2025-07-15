import os
import sys
import tempfile
import librosa
import torch
import torch.nn.functional as F
import torch.nn as nn
import torchaudio
from pydub import AudioSegment
from transformers import WhisperProcessor, WhisperForConditionalGeneration


def convert_ogg_to_wav(ogg_path, wav_path):
    audio = AudioSegment.from_file(ogg_path)
    audio.export(wav_path, format="wav")

def predict_emotion(audio_file_path):
    file_ext = os.path.splitext(audio_file_path)[1].lower()
    
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
        temp_wav_path = temp_wav.name
    convert_ogg_to_wav(audio_file_path, temp_wav_path)
    process_path = temp_wav_path
    cleanup_temp = True

    waveform_numpy, _ = librosa.load(process_path, sr=16000, mono=True)
    waveform = torch.from_numpy(waveform_numpy).float().squeeze()

    if waveform.shape[0] > 16000:
        waveform = waveform[:16000]
    else:
        waveform = F.pad(waveform, (0, 16000 - waveform.shape[0]))

    waveform_tensor = waveform.unsqueeze(0).to(emotion_device)

    with torch.no_grad():
        outputs = emotion_model(waveform_tensor)
        predicted_idx = torch.argmax(outputs, dim=1).item()
        confidence = torch.softmax(outputs, dim=1).max().item()

    whisper_processor = WhisperProcessor.from_pretrained("openai/whisper-base")
    whisper_model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-base")
    whisper_model.to(emotion_device)

    text = ""
    inputs = whisper_processor(waveform_numpy, sampling_rate=16000, return_tensors="pt")
    inputs = inputs.to(emotion_device)
                
    with torch.no_grad():
        predicted_ids = whisper_model.generate(inputs["input_features"])
        text = whisper_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]

    print(f"Transcribed text: {text}")
    
    with torch.no_grad():
        outputs = emotion_model(waveform_tensor)
        predicted_idx = torch.argmax(outputs, dim=1).item()
        confidence = torch.softmax(outputs, dim=1).max().item()
        probabilities = torch.softmax(outputs, dim=1).squeeze().cpu().numpy()
    
    print(f"testing file: {os.path.basename(audio_file_path)}")
    print(f"result: {emotion_labels[predicted_idx]} ({confidence*100:.1f}% confident)")
    print("all scores:", end=" ")
    for label, prob in zip(emotion_labels, probabilities):
        print(f"{label}={prob:.3f}", end=" ")
    
    if cleanup_temp:
        os.unlink(temp_wav_path)

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
        return emotion_model
    except Exception as e:
        return False

def main():
    audio_file_path = './testaudio.ogg'
    
    global emotion_model, emotion_device, emotion_labels
    emotion_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    emotion_model = load_emotion_model()
    emotion_labels = ['angry', 'happy', 'sad', 'neutral']
    
    predict_emotion(audio_file_path)

if __name__ == "__main__":
    main()
