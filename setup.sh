#!/bin/bash

# CSEDU Students' Club Portal - Setup Script
# Run this on your server to quickly deploy the application

set -e

echo "================================================"
echo "CSEDU Students' Club Portal - Setup Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root (needed for some operations)
if [ "$EUID" -eq 0 ] && [ "$1" != "--allow-root" ]; then
   echo -e "${RED}Please do not run this script as root${NC}"
   exit 1
fi

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_step() {
    echo ""
    echo -e "${YELLOW}>>> $1${NC}"
}

# Step 1: Check prerequisites
print_step "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    echo "Install it with: sudo apt install -y docker.io"
    exit 1
fi
print_status "Docker installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    echo "Install it with: sudo apt install -y docker-compose"
    exit 1
fi
print_status "Docker Compose installed"

# Check Nginx
if ! command -v nginx &> /dev/null; then
    print_warning "Nginx is not installed. Install with: sudo apt install -y nginx"
fi
print_status "Nginx check complete"

# Step 2: Create necessary directories
print_step "Creating directories..."
mkdir -p logs backups
print_status "Directories created"

# Step 3: Environment setup
print_step "Setting up environment..."

if [ ! -f ".env.local" ]; then
    print_warning "Creating .env.local from template"
    cat > .env.local << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@host:5432/csedu_db"
DIRECT_URL="postgresql://user:password@host:5432/csedu_db"

# API Configuration
NODE_ENV=production
PORT=8000
API_URL=https://csedu.du.ac.bd
FRONTEND_URL=https://csedu.du.ac.bd

# JWT Configuration (Generate with: openssl genrsa -out private.pem 2048)
JWT_PRIVATE_KEY="your-private-key-here"
JWT_PUBLIC_KEY="your-public-key-here"

# Authentication
SESSION_SECRET="your-session-secret-min-32-chars"

# CORS
CORS_ORIGIN=https://csedu.du.ac.bd

# SSLCommerz Payment Gateway
SSLCOMMERZ_STORE_ID=your-store-id
SSLCOMMERZ_STORE_PASSWORD=your-store-password

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@csedu.du.ac.bd

# File Storage
STORAGE_ENDPOINT=https://minio.example.com
STORAGE_BUCKET=csedu-media
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
EOF
    echo -e "${YELLOW}Please update .env.local with your configuration${NC}"
else
    print_status ".env.local already exists"
fi

# Step 4: Build Docker image
print_step "Building Docker image..."
docker build -t csedu-app:latest . || {
    print_error "Failed to build Docker image"
    exit 1
}
print_status "Docker image built successfully"

# Step 5: Setup Nginx (if running with sudo)
if command -v sudo &> /dev/null; then
    print_step "Setting up Nginx..."
    
    if [ -f "nginx/csedu" ]; then
        sudo cp nginx/csedu /etc/nginx/sites-available/ 2>/dev/null || print_warning "Could not copy nginx config (needs sudo)"
        
        if [ ! -L /etc/nginx/sites-enabled/csedu ]; then
            sudo ln -s /etc/nginx/sites-available/csedu /etc/nginx/sites-enabled/csedu 2>/dev/null || print_warning "Could not create nginx symlink"
        fi
        
        sudo nginx -t 2>/dev/null && print_status "Nginx configuration is valid" || print_warning "Nginx configuration test failed"
    else
        print_warning "Nginx config file not found"
    fi
fi

# Step 6: Start containers
print_step "Starting Docker containers..."
docker-compose -f docker-compose.prod.yml up -d || {
    print_error "Failed to start containers"
    exit 1
}
print_status "Containers started"

# Step 7: Wait for app to be ready
print_step "Waiting for application to be ready..."
sleep 10

# Step 8: Run database migrations
print_step "Running database migrations..."
docker exec csedu-portal npx prisma migrate deploy || {
    print_warning "Database migrations failed (database might not be ready yet)"
}

# Step 9: Verify setup
print_step "Verifying setup..."

# Check if app is running
if docker ps | grep -q csedu-portal; then
    print_status "Application container is running"
else
    print_error "Application container is not running"
    docker logs csedu-portal
    exit 1
fi

# Check health endpoint
if timeout 5 curl -f http://localhost:8000/health &>/dev/null; then
    print_status "Health check passed"
else
    print_warning "Health check failed (might take a moment to start)"
fi

# Final summary
echo ""
echo "================================================"
echo -e "${GREEN}Setup completed successfully!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Set up SSL certificate:"
echo "   sudo certbot certonly --nginx -d csedu.du.ac.bd"
echo "3. Restart Nginx:"
echo "   sudo systemctl restart nginx"
echo ""
echo "Application URL: https://csedu.du.ac.bd"
echo "API URL: https://csedu.du.ac.bd/api"
echo ""
echo "View logs with:"
echo "  docker logs -f csedu-portal"
echo ""
echo "Stop containers with:"
echo "  docker-compose down"
echo ""
echo "For more information, see DEPLOYMENT_GUIDE.md"
echo ""
