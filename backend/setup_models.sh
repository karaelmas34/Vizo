#!/bin/bash
# setup_models.sh - Model indirme ve kurulum scripti

set -e

echo "🚀 VizoAI Model Setup Starting..."

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Dizin yapısını oluştur
echo -e "${YELLOW}📁 Creating directory structure...${NC}"
mkdir -p ~/dev/.VizoAi/backend/models
mkdir -p ~/dev/.VizoAi/backend/uploads
mkdir -p ~/dev/.VizoAi/backend/outputs
mkdir -p ~/dev/.VizoAi/backend/logs

cd ~/dev/.VizoAi/backend

# Python sanal ortamı oluştur
echo -e "${YELLOW}🐍 Setting up Python virtual environment...${NC}"
python3 -m venv venv
source venv/bin/activate

# Temel paketleri yükselt
pip install --upgrade pip setuptools wheel

# PyTorch CUDA 11.7 için (RTX 3060 12GB)
echo -e "${YELLOW}🔥 Installing PyTorch with CUDA support...${NC}"
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu117

# Hugging Face CLI
echo -e "${YELLOW}📦 Installing Hugging Face Hub...${NC}"
pip install "huggingface_hub[cli]"

# Git LFS kurulumu (büyük modeller için)
echo -e "${YELLOW}📚 Installing Git LFS...${NC}"
sudo apt update
sudo apt install -y git-lfs
git lfs install

# 1. Wan 2.2 TI2V Model (Image-to-Video) - RTX 3060 için uygun
echo -e "${GREEN}📥 Downloading Wan 2.2 TI2V 5B Model...${NC}"
cd models
huggingface-cli download Wan-AI/Wan2.2-TI2V-5B --local-dir ./Wan2.2-TI2V-5B

# 2. Wan 2.2 kaynak kodunu klonla
echo -e "${GREEN}🔧 Cloning Wan 2.2 source code...${NC}"
git clone https://github.com/Wan-Video/Wan2.2.git
cd Wan2.2

# Wan 2.2 gereksinimlerini yükle
echo -e "${YELLOW}📦 Installing Wan 2.2 requirements...${NC}"
pip install -r requirements.txt

cd ..

# 3. MuseTalk Model
echo -e "${GREEN}🎭 Downloading MuseTalk Model...${NC}"
git clone https://github.com/TMElyralab/MuseTalk.git
cd MuseTalk

# MuseTalk gereksinimlerini yükle
pip install -r requirements.txt

# MuseTalk model ağırlıklarını indir
huggingface-cli download TMElyralab/MuseTalk --local-dir ./models

cd ..

# 4. FFMPEG kurulumu (video işleme için)
echo -e "${YELLOW}🎬 Installing FFMPEG...${NC}"
sudo apt install -y ffmpeg

# 5. PostgreSQL kurulumu
echo -e "${YELLOW}🗃️ Setting up PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# PostgreSQL database oluştur
sudo -u postgres psql -c "CREATE DATABASE vizoai_db;"
sudo -u postgres psql -c "CREATE USER vizoai WITH PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vizoai_db TO vizoai;"

# 6. Redis kurulumu
echo -e "${YELLOW}📮 Installing Redis...${NC}"
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Backend gereksinimlerini yükle
cd ~/dev/.VizoAi/backend
echo -e "${YELLOW}📦 Installing backend requirements...${NC}"
pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary python-multipart python-jose[cryptography] passlib[bcrypt] python-dotenv redis celery moviepy opencv-python mediapipe insightface face-recognition librosa soundfile

# Database migration
echo -e "${YELLOW}🗃️ Setting up database...${NC}"
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

echo -e "${GREEN}✅ Model setup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo "✓ Wan 2.2 TI2V 5B Model (RTX 3060 12GB için optimize)"
echo "✓ MuseTalk Real-time Lip Sync Model"
echo "✓ PostgreSQL Database"
echo "✓ Redis Cache"
echo "✓ FFMPEG Video Processing"
echo ""
echo -e "${GREEN}🚀 Ready to start VizoAI Backend!${NC}"
echo "Run: cd ~/dev/.VizoAi/backend && source venv/bin/activate && python run.py"

# test_gpu.py - GPU test scripti
cat > test_gpu.py << 'EOF'
#!/usr/bin/env python3
import torch
import psutil
import GPUtil

def test_gpu():
    print("🔍 GPU Test Starting...\n")
    
    # CUDA availability
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA Version: {torch.version.cuda}")
        print(f"GPU Device: {torch.cuda.get_device_name(0)}")
        print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        
        # GPU memory test
        device = torch.device('cuda:0')
        test_tensor = torch.randn(1000, 1000, device=device)
        print(f"GPU Memory Used: {torch.cuda.memory_allocated(0) / 1024**3:.2f} GB")
        
        # RTX 3060 12GB check
        total_memory_gb = torch.cuda.get_device_properties(0).total_memory / 1024**3
        if total_memory_gb > 11:
            print("✅ RTX 3060 12GB detected - Ready for Wan 2.2!")
        else:
            print("⚠️ GPU memory might be limited for large models")
    else:
        print("❌ CUDA not available")
    
    # CPU and RAM info
    print(f"\nCPU Cores: {psutil.cpu_count()}")
    print(f"RAM: {psutil.virtual_memory().total / 1024**3:.1f} GB")
    
if __name__ == "__main__":
    test_gpu()
EOF

chmod +x test_gpu.py

# .env dosyası oluştur
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://vizoai:password@localhost/vizoai_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# GPU Settings
CUDA_DEVICE=cuda:0
GPU_MEMORY_FRACTION=0.9

# Model Paths
WAN_MODEL_PATH=
