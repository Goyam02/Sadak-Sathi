#!/bin/bash

# Sadak Saathi - Quick Start Script
# This script sets up the complete development environment

set -e  # Exit on error

echo "🛵 Sadak Saathi - Quick Start"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "README_FULL.md" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "📋 Checking prerequisites..."
echo ""

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION"
else
    echo -e "${RED}❌ Python 3.11+ required but not found${NC}"
    echo "   Install from: https://www.python.org/downloads/"
    exit 1
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION"
else
    echo -e "${RED}❌ Node.js 18+ required but not found${NC}"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    echo -e "${GREEN}✓${NC} Docker $DOCKER_VERSION"
else
    echo -e "${YELLOW}⚠${NC}  Docker not found (optional, but recommended)"
    echo "   Install from: https://docs.docker.com/get-docker/"
fi

# Check Docker Compose
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker Compose"
else
    echo -e "${YELLOW}⚠${NC}  Docker Compose not found (optional)"
fi

echo ""
echo "================================"
echo "1️⃣  Setting up Backend"
echo "================================"
echo ""

cd sadak-saathi-backend

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    echo -e "${GREEN}✓${NC} Virtual environment created"
else
    echo -e "${GREEN}✓${NC} Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
echo -e "${GREEN}✓${NC} Dependencies installed"

# Set up .env
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠${NC}  Please edit sadak-saathi-backend/.env with your database credentials"
    echo ""
fi

# Check if Docker is available for database
if command_exists docker; then
    read -p "Start PostgreSQL + Redis with Docker? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting PostgreSQL + Redis containers..."
        docker-compose up -d db redis
        echo "Waiting for PostgreSQL to be ready..."
        sleep 5
        echo -e "${GREEN}✓${NC} Database services started"
        
        # Run migrations
        echo "Running database migrations..."
        alembic upgrade head
        echo -e "${GREEN}✓${NC} Migrations complete"
        
        # Optional: Seed data
        read -p "Seed sample hazard data? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            python scripts/seed_sample_hazards.py
            echo -e "${GREEN}✓${NC} Sample data seeded"
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC}  Docker not available. Please set up PostgreSQL manually."
    echo "   See docs/DEPLOYMENT.md for instructions"
fi

cd ..

echo ""
echo "================================"
echo "2️⃣  Setting up Mobile App"
echo "================================"
echo ""

cd SadakSaathi

# Install Node dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Set up .env
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    
    # Try to detect local IP
    if command_exists ipconfig; then
        # macOS
        LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "192.168.1.100")
    elif command_exists hostname; then
        # Linux
        LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "192.168.1.100")
    else
        LOCAL_IP="192.168.1.100"
    fi
    
    # Update .env with detected IP
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|http://192.168.1.100:8000|http://$LOCAL_IP:8000|g" .env
    else
        sed -i "s|http://192.168.1.100:8000|http://$LOCAL_IP:8000|g" .env
    fi
    
    echo -e "${YELLOW}⚠${NC}  Please edit SadakSaathi/.env with:"
    echo "   - Your Google Maps API key"
    echo "   - Backend URL: http://$LOCAL_IP:8000 (detected)"
    echo ""
fi

cd ..

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "🚀 To start the backend:"
echo "   cd sadak-saathi-backend"
echo "   source .venv/bin/activate"
echo "   uvicorn app.main:app --reload"
echo ""
echo "📱 To start the mobile app:"
echo "   cd SadakSaathi"
echo "   npx expo start"
echo ""
echo "📚 Next steps:"
echo "   1. Edit .env files with your API keys"
echo "   2. Start the backend server"
echo "   3. Start the Expo development server"
echo "   4. Scan QR code with Expo Go app"
echo ""
echo "📖 Full documentation: README_FULL.md"
echo "🐛 Issues? https://github.com/Goyam02/Sadak-Sathi/issues"
echo ""
echo "Happy coding! 🎉"
