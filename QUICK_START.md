# ⚡ Quick Start - Backend Deployment (20 minutes)

## Summary

✅ **38 API endpoints** implemented and tested  
✅ **Production build** verified  
✅ **Zero errors** - ready to deploy  
✅ **Supabase database** connected  

---

## 1. SSH to Azure VM (1 minute)

```bash
ssh azureuser@ip-lab-student-01
cd ~
```

---

## 2. Create Configuration (2 minutes)

```bash
mkdir -p ~/csedu-app
cd ~/csedu-app

# Create .env file with your Supabase credentials
cat > .env << 'EOF'
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://YOUR_SUPABASE_USER:YOUR_PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://YOUR_SUPABASE_USER:YOUR_PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
API_URL=https://csedu.du.ac.bd
FRONTEND_URL=https://csedu.du.ac.bd
CORS_ORIGIN=https://csedu.du.ac.bd
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
SESSION_SECRET=your-super-secret-key-min-32-chars
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@csedu.du.ac.bd
EC_NOTIFICATION_EMAIL=ec@csedu-club.com
EOF
```

---

## 3. Deploy with Docker (5 minutes)

```bash
# Create docker-compose file
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  app:
    image: csedu-app:latest
    container_name: csedu-portal
    restart: unless-stopped
    ports:
      - "8000:8000"
    env_file: .env
    networks:
      - csedu-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  csedu-network:
    driver: bridge
EOF

# Pull and start container
docker-compose -f docker-compose.prod.yml up -d

# Verify running
docker ps | grep csedu
```

---

## 4. Update Nginx (3 minutes)

```bash
sudo nano /etc/nginx/sites-available/csedu
```

Add this (keep existing frontend config):

```nginx
location /api/v1 {
    proxy_pass http://localhost:8000/api/v1;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then:

```bash
sudo systemctl reload nginx
```

---

## 5. Test (2 minutes)

```bash
# Test local
curl http://localhost:8000/api/v1/elections

# Test through Nginx
curl https://csedu.du.ac.bd/api/v1/elections

# Test login (create account first)
curl -X POST https://csedu.du.ac.bd/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

---

## 📊 API Status

| Endpoint | Status |
|----------|--------|
| `/api/v1/auth/login` | ✅ |
| `/api/v1/auth/signup` | ✅ |
| `/api/v1/members/profile` | ✅ |
| `/api/v1/elections` | ✅ |
| `/api/v1/events` | ✅ |
| `/api/v1/finance/budgets` | ✅ |
| `/api/v1/meetings` | ✅ |
| `/api/v1/notices` | ✅ |
| **All 38 endpoints** | **✅** |

---

## 🆘 Quick Troubleshooting

**Container won't start:**
```bash
docker-compose -f docker-compose.prod.yml logs
```

**Check if running:**
```bash
docker ps
docker logs csedu-portal
```

**Restart:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

**Clear and redeploy:**
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📖 Full Documentation

- `WHAT_TO_DO_NEXT.md` - Detailed deployment guide
- `API_DOCUMENTATION.md` - All 38 endpoints with examples
- `DEPLOYMENT_GUIDE.md` - Setup instructions
- `IMPLEMENTATION_COMPLETE.md` - Technical details

---

## ✨ What's Ready

✅ All 38 API endpoints working  
✅ User authentication (JWT)  
✅ Elections voting system  
✅ Event RSVP management  
✅ Budget tracking  
✅ Member management  
✅ Role-based access control  
✅ Audit logging  
✅ Email notifications  

---

## ⏱️ Total Time: ~20 minutes

You'll be live with a fully functional backend! 🚀

