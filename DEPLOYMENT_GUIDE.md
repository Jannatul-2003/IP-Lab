# CSEDU Students' Club Portal - Deployment Guide

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Docker & Docker Compose installed
- Nginx installed and running
- PostgreSQL/Supabase account
- SSLCommerz merchant account (for payments)
- Let's Encrypt for SSL certificates
- Node.js 20+ (for local development)

---

## 1. Database Setup (Supabase)

### Step 1.1: Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Note your connection string and credentials

### Step 1.2: Run Schema Migration
```bash
# Connect to your Supabase database using psql or SQL Editor

# Copy the entire content from: database/schema.sql
# Paste it into the Supabase SQL Editor
# OR use psql:

psql "postgresql://[user]:[password]@[host]:5432/[database]" < database/schema.sql
```

### Step 1.3: Verify Tables
```bash
# List all tables
\dt

# You should see tables like:
# - users
# - members
# - elections
# - candidates
# - votes
# - events
# - rsvps
# - notices
# - budgets
# - expenditures
# - payments
# - payment_logs
# - audit_log
# - etc.
```

---

## 2. Environment Configuration

### Step 2.1: Backend Environment (.env.local)

Create `server/.env.local`:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/csedu_db"
DIRECT_URL="postgresql://user:password@host:5432/csedu_db"

# API Configuration
NODE_ENV=production
PORT=8000
API_URL=https://csedu.du.ac.bd
FRONTEND_URL=https://csedu.du.ac.bd

# JWT Configuration
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Authentication
SESSION_SECRET="your-long-random-session-secret-here-min-32-chars"

# Cors
CORS_ORIGIN=https://csedu.du.ac.bd

# SSLCommerz Payment Gateway
SSLCOMMERZ_STORE_ID=your-store-id-here
SSLCOMMERZ_STORE_PASSWORD=your-store-password-here

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@csedu.du.ac.bd

# File Storage (MinIO/S3)
STORAGE_ENDPOINT=https://minio.example.com
STORAGE_BUCKET=csedu-media
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_REGION=us-east-1

# Logging
LOG_LEVEL=info

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=15m
```

### Step 2.2: Generate JWT Keys

```bash
# Generate RSA key pair for JWT signing
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Convert to base64 for env variable
cat private.pem | base64 -w 0
cat public.pem | base64 -w 0
```

### Step 2.3: Frontend Environment (.env.local)

Create `client/.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://csedu.du.ac.bd/api
NEXT_PUBLIC_APP_NAME=CSEDU Club Portal
```

---

## 3. Docker & Server Setup

### Step 3.1: Build Docker Image

```bash
cd /path/to/IP-Lab

# Build the Docker image
docker build -t csedu-app:latest .

# Tag for registry (if using Docker Hub)
docker tag csedu-app:latest your-dockerhub-username/csedu-app:latest

# Push to registry
docker push your-dockerhub-username/csedu-app:latest
```

### Step 3.2: Create Docker Compose File

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    image: csedu-app:latest
    container_name: csedu-portal
    restart: always
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_PRIVATE_KEY=${JWT_PRIVATE_KEY}
      - JWT_PUBLIC_KEY=${JWT_PUBLIC_KEY}
      - SSLCOMMERZ_STORE_ID=${SSLCOMMERZ_STORE_ID}
      - SSLCOMMERZ_STORE_PASSWORD=${SSLCOMMERZ_STORE_PASSWORD}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - csedu-network
    depends_on:
      - nginx
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    container_name: csedu-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/csedu:/etc/nginx/sites-available/csedu:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:rw
    networks:
      - csedu-network
    depends_on:
      - app
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  csedu-network:
    driver: bridge
```

### Step 3.3: Deploy on Server

```bash
# SSH into your server
ssh azureuser@104.215.151.14

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (if not installed)
sudo apt install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Create app directory
mkdir -p /home/azureuser/csedu-portal
cd /home/azureuser/csedu-portal

# Copy files
# (Use scp or git clone)
git clone <your-repo-url> .

# Create .env file
sudo nano .env

# Paste environment variables here
# Save: Ctrl+X, then Y, then Enter

# Run with docker-compose
sudo docker-compose -f docker-compose.prod.yml up -d
```

---

## 4. Nginx Configuration

### Step 4.1: Set Up Nginx

```bash
# Copy nginx config
sudo cp ./nginx/csedu /etc/nginx/sites-available/

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/csedu /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# If output is OK, reload
sudo systemctl reload nginx
```

### Step 4.2: Set Up SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Create certificate
sudo certbot certonly --nginx -d csedu.du.ac.bd -d www.csedu.du.ac.bd

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

---

## 5. SSLCommerz Payment Gateway Setup

### Step 5.1: Get Merchant Credentials

1. Go to https://developer.sslcommerz.com
2. Register and create a merchant account
3. Get your Store ID and Store Password
4. Add to `.env` file:
   ```
   SSLCOMMERZ_STORE_ID=your_store_id
   SSLCOMMERZ_STORE_PASSWORD=your_store_password
   ```

### Step 5.2: Configure IPN Endpoint

1. In SSLCommerz dashboard, set IPN URL:
   ```
   https://csedu.du.ac.bd/api/v1/payments/ipn
   ```

2. Set return URL:
   ```
   https://csedu.du.ac.bd/payment/success
   ```

3. Set cancel URL:
   ```
   https://csedu.du.ac.bd/payment/cancel
   ```

### Step 5.3: Test Payment Flow

```bash
# In development
NODE_ENV=development node server.js

# Gateway URL for testing:
# Sandbox: https://sandbox.sslcommerz.com
# Production: https://securepay.sslcommerz.com
```

---

## 6. Database Backup & Maintenance

### Step 6.1: Automated Backup

```bash
# Create backup script: backup-db.sh
#!/bin/bash

BACKUP_DIR="/home/azureuser/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_URL="your-database-url"

mkdir -p $BACKUP_DIR

pg_dump $DB_URL | gzip > $BACKUP_DIR/csedu_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "csedu_*.sql.gz" -mtime +30 -delete

# Add to crontab (daily at 2 AM)
# 0 2 * * * /home/azureuser/backup-db.sh
```

### Step 6.2: Restore from Backup

```bash
# Restore database
zcat /path/to/backup/csedu_20240101_020000.sql.gz | psql $DATABASE_URL
```

---

## 7. Monitoring & Logs

### Step 7.1: View Logs

```bash
# Container logs
docker logs -f csedu-portal

# Nginx logs
sudo tail -f /var/log/nginx/csedu_access.log
sudo tail -f /var/log/nginx/csedu_error.log

# System logs
sudo journalctl -u docker.service -n 100 -f
```

### Step 7.2: Health Check

```bash
# Check if app is running
curl https://csedu.du.ac.bd/health

# Check database connection
curl https://csedu.du.ac.bd/api/v1/health/db
```

---

## 8. Maintenance

### Step 8.1: Update Application

```bash
cd /home/azureuser/csedu-portal

# Pull latest code
git pull origin main

# Rebuild Docker image
docker-compose -f docker-compose.prod.yml build

# Restart containers
docker-compose -f docker-compose.prod.yml up -d
```

### Step 8.2: Database Migrations

```bash
# Run migrations
docker exec csedu-portal npx prisma migrate deploy

# Seed data (if needed)
docker exec csedu-portal npx prisma db seed
```

### Step 8.3: Clear Cache

```bash
# Clear Docker volumes
docker volume prune

# Clear old images
docker image prune -a
```

---

## 9. Troubleshooting

### Issue: Container won't start
```bash
# Check logs
docker logs csedu-portal

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Database connection failed
```bash
# Verify DATABASE_URL in .env
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Issue: Nginx shows 502 Bad Gateway
```bash
# Check if backend is running
curl http://localhost:8000

# Check nginx logs
sudo tail -f /var/log/nginx/csedu_error.log
```

### Issue: SSL certificate issues
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Reload nginx
sudo systemctl reload nginx
```

---

## 10. Performance Optimization

### Step 10.1: Enable Caching

Already configured in nginx.conf with:
- Browser caching for static assets (1 year)
- Gzip compression
- Connection pooling

### Step 10.2: Database Optimization

```sql
-- Analyze table for query optimization
ANALYZE;

-- Check index usage
SELECT * FROM pg_stat_user_indexes;
```

### Step 10.3: Monitor Resources

```bash
# CPU & Memory
docker stats csedu-portal

# Disk usage
du -sh /home/azureuser/csedu-portal
```

---

## Contact & Support

- Email: innova-du@du.ac.bd
- GitHub: https://github.com/Jannatul-2003/IP-Lab
- Issues: https://github.com/Jannatul-2003/IP-Lab/issues

---

## Production Checklist

- [ ] Database backup configured
- [ ] SSL certificates installed and auto-renewal enabled
- [ ] Environment variables properly set
- [ ] Docker containers running
- [ ] Nginx configured and tested
- [ ] Monitoring and logging enabled
- [ ] Payment gateway tested
- [ ] Firewall rules configured
- [ ] Regular backup schedule set
- [ ] Disaster recovery plan documented

---

**Last Updated:** April 2026
**Version:** 1.0
