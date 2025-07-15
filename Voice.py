import torch
import torch.nn as nn
import torch.optim as optim
import torchaudio
import librosa
import numpy as np
import os
import glob
import pandas as pd
from torch.utils.data import DataLoader, random_split
import random

class CREMADDataset(torch.utils.data.Dataset):
    def __init__(self, data_dir="./data"):
        self.data_dir = data_dir
        self.file_paths = []
        self.emotion_labels = []
        self._load_file_paths()
        self.labels = sorted(list(set(self.emotion_labels)))
        self.label_to_idx = {label: idx for idx, label in enumerate(self.labels)}
        
    def _load_file_paths(self):
        csv_path = os.path.join(self.data_dir, "processedResults", "tabulatedVotes.csv")
        if not os.path.exists(csv_path):
            csv_path = os.path.join(self.data_dir, "tabulatedVotes.csv")
        audio_dir = os.path.join(self.data_dir, "AudioWAV")
        
        df = pd.read_csv(csv_path)
        if 'fileName' not in df.columns and df.columns[0] == '':
            df = df.rename(columns={'': 'fileName'})
        
        for _, row in df.iterrows():
            filename = row['fileName'] 
            filename += ".wav"
            audio_path = os.path.join(audio_dir, filename)
            audio_path = audio_path.replace("\\", "/")

            if os.path.exists(audio_path):
                emotion_counts = {k: row.get(k, 0) for k in ['A', 'D', 'F', 'H', 'N', 'S']}
                max_emotion_code = max(emotion_counts, key=emotion_counts.get)
                emotion = {'A': 'angry', 'D': 'disgust', 'F': 'fear', 'H': 'happy', 'N': 'neutral', 'S': 'sad'}.get(max_emotion_code)
                self.file_paths.append(audio_path)
                self.emotion_labels.append(emotion)
    
    def __getitem__(self, idx):
        waveform, _ = librosa.load(self.file_paths[idx], sr=16000, mono=True)
        waveform = torch.from_numpy(waveform).float().squeeze()
        
        if waveform.shape[0] > 16000:
            start_idx = random.randint(0, waveform.shape[0] - 16000)
            waveform = waveform[start_idx:start_idx + 16000]
        else:
            waveform = torch.nn.functional.pad(waveform, (0, 16000 - waveform.shape[0]))
        
        return waveform, torch.tensor(self.label_to_idx[self.emotion_labels[idx]], dtype=torch.long)
    
    def __len__(self):
        return len(self.file_paths)
    
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

def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = correct = total = 0
    
    for waveform, targets in loader:
        waveform, targets = waveform.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = model(waveform)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        _, predicted = torch.max(outputs.data, 1)
        total += targets.size(0)
        correct += (predicted == targets).sum().item()
    
    return total_loss / len(loader), 100 * correct / total

def validate_epoch(model, loader, criterion, device):
    model.eval()
    total_loss = correct = total = 0
    
    with torch.no_grad():
        for waveform, targets in loader:
            waveform, targets = waveform.to(device), targets.to(device)
            outputs = model(waveform)
            loss = criterion(outputs, targets)
            total_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += targets.size(0)
            correct += (predicted == targets).sum().item()
    
    return total_loss / len(loader), 100 * correct / total

def main():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    dataset = CREMADDataset(data_dir="./data")
    
    train_size = int(0.8 * len(dataset))
    train_dataset, val_dataset = random_split(dataset, [train_size, len(dataset) - train_size])
    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=8, shuffle=False, num_workers=0)
    
    model = audioModel(len(dataset.labels)).to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.0001)
    criterion = nn.CrossEntropyLoss()
    
    for epoch in range(30):
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_acc = validate_epoch(model, val_loader, criterion, device)
        print(f"Epoch {epoch+1}: Train Acc {train_acc:.2f}%, Val Acc {val_acc:.2f}%")
    
    torch.save(model.state_dict(), "cremad_emotion_model.pth")
    torch.save(dataset.labels, "emotion_labels.pth")

def predict_audio(model, audio_path, labels, device):
    model.eval()
    waveform, _ = librosa.load(audio_path, sr=16000, mono=True)
    waveform = torch.from_numpy(waveform).float().squeeze()
    
    if waveform.shape[0] > 16000:
        start_idx = random.randint(0, waveform.shape[0] - 16000)
        waveform = waveform[start_idx:start_idx + 16000]
    else:
        waveform = torch.nn.functional.pad(waveform, (0, 16000 - waveform.shape[0]))
    
    with torch.no_grad():
        waveform = waveform.unsqueeze(0).to(device)
        outputs = model(waveform)
        predicted_idx = torch.argmax(outputs, dim=1).item()
        confidence = torch.softmax(outputs, dim=1).max().item()
    
    return {"predicted_emotion": labels[predicted_idx], "confidence": confidence}

if __name__ == "__main__":
    main()
import torch
import torch.nn as nn
import torch.optim as optim
import torchaudio
import librosa
import numpy as np
import os
import glob
import pandas as pd
from torch.utils.data import DataLoader, random_split
import random

class CREMADDataset(torch.utils.data.Dataset):
    def __init__(self, data_dir="./data"):
        self.data_dir = data_dir
        self.file_paths = []
        self.emotion_labels = []
        self._load_file_paths()
        self.labels = sorted(list(set(self.emotion_labels)))
        self.label_to_idx = {label: idx for idx, label in enumerate(self.labels)}
        
    def _load_file_paths(self):
        csv_path = os.path.join(self.data_dir, "processedResults", "tabulatedVotes.csv")
        if not os.path.exists(csv_path):
            csv_path = os.path.join(self.data_dir, "tabulatedVotes.csv")
        audio_dir = os.path.join(self.data_dir, "AudioWAV")
        
        df = pd.read_csv(csv_path)
        if 'fileName' not in df.columns and df.columns[0] == '':
            df = df.rename(columns={'': 'fileName'})
        
        for _, row in df.iterrows():
            filename = row['fileName'] 
            filename += ".wav"
            audio_path = os.path.join(audio_dir, filename)
            audio_path = audio_path.replace("\\", "/")

            if os.path.exists(audio_path):
                emotion_counts = {k: row.get(k, 0) for k in ['A', 'D', 'F', 'H', 'N', 'S']}
                max_emotion_code = max(emotion_counts, key=emotion_counts.get)
                emotion = {'A': 'angry', 'D': 'disgust', 'F': 'fear', 'H': 'happy', 'N': 'neutral', 'S': 'sad'}.get(max_emotion_code)
                self.file_paths.append(audio_path)
                self.emotion_labels.append(emotion)
    
    def __getitem__(self, idx):
        waveform, _ = librosa.load(self.file_paths[idx], sr=16000, mono=True)
        waveform = torch.from_numpy(waveform).float().squeeze()
        
        if waveform.shape[0] > 16000:
            start_idx = random.randint(0, waveform.shape[0] - 16000)
            waveform = waveform[start_idx:start_idx + 16000]
        else:
            waveform = torch.nn.functional.pad(waveform, (0, 16000 - waveform.shape[0]))
        
        return waveform, torch.tensor(self.label_to_idx[self.emotion_labels[idx]], dtype=torch.long)
    
    def __len__(self):
        return len(self.file_paths)
    
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

def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = correct = total = 0
    
    for waveform, targets in loader:
        waveform, targets = waveform.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = model(waveform)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        _, predicted = torch.max(outputs.data, 1)
        total += targets.size(0)
        correct += (predicted == targets).sum().item()
    
    return total_loss / len(loader), 100 * correct / total

def validate_epoch(model, loader, criterion, device):
    model.eval()
    total_loss = correct = total = 0
    
    with torch.no_grad():
        for waveform, targets in loader:
            waveform, targets = waveform.to(device), targets.to(device)
            outputs = model(waveform)
            loss = criterion(outputs, targets)
            total_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += targets.size(0)
            correct += (predicted == targets).sum().item()
    
    return total_loss / len(loader), 100 * correct / total

def main():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    dataset = CREMADDataset(data_dir="./data")
    
    train_size = int(0.8 * len(dataset))
    train_dataset, val_dataset = random_split(dataset, [train_size, len(dataset) - train_size])
    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=8, shuffle=False, num_workers=0)
    
    model = audioModel(len(dataset.labels)).to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.0001)
    criterion = nn.CrossEntropyLoss()
    
    for epoch in range(30):
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_acc = validate_epoch(model, val_loader, criterion, device)
        print(f"Epoch {epoch+1}: Train Acc {train_acc:.2f}%, Val Acc {val_acc:.2f}%")
    
    torch.save(model.state_dict(), "cremad_emotion_model.pth")
    torch.save(dataset.labels, "emotion_labels.pth")

def predict_audio(model, audio_path, labels, device):
    model.eval()
    waveform, _ = librosa.load(audio_path, sr=16000, mono=True)
    waveform = torch.from_numpy(waveform).float().squeeze()
    
    if waveform.shape[0] > 16000:
        start_idx = random.randint(0, waveform.shape[0] - 16000)
        waveform = waveform[start_idx:start_idx + 16000]
    else:
        waveform = torch.nn.functional.pad(waveform, (0, 16000 - waveform.shape[0]))
    
    with torch.no_grad():
        waveform = waveform.unsqueeze(0).to(device)
        outputs = model(waveform)
        predicted_idx = torch.argmax(outputs, dim=1).item()
        confidence = torch.softmax(outputs, dim=1).max().item()
    
    return {"predicted_emotion": labels[predicted_idx], "confidence": confidence}

if __name__ == "__main__":
    main()