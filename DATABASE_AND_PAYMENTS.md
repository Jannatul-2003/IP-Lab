# Database and Payments Setup Guide

## Table of Contents
1. [Supabase Database Setup](#supabase-setup)
2. [SSLCommerz Payment Integration](#sslcommerz-setup)
3. [Payment Flow](#payment-flow)
4. [Database Schema](#database-schema)
5. [Testing](#testing)

---

## Supabase Setup

### Prerequisites
- Supabase account (https://supabase.com)
- PostgreSQL client (optional, for testing)

### Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in project details:
   - **Project Name**: `csedu-portal`
   - **Database Password**: Use a strong password
   - **Region**: Choose closest region (Asia Southeast 1 for Bangladesh)
4. Click "Create new project"
5. Wait for database to be ready (2-3 minutes)

### Step 2: Get Connection Credentials

1. Go to **Settings** → **Database**
2. Copy the following:
   - **Connection string** (Standard)
   - **Host**: `db.xxxxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: (The one you set)

### Step 3: Run Database Schema

#### Option A: Using Supabase SQL Editor (Recommended)

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New Query"**
3. Copy entire content from `database/schema.sql`
4. Paste it into the editor
5. Click **"Run"**
6. Wait for completion

#### Option B: Using psql Command Line

```bash
# Install PostgreSQL client (if not installed)
# Ubuntu/Debian:
sudo apt install postgresql-client

# macOS:
brew install postgresql

# Connect and run schema
psql "postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres" < database/schema.sql

# Verify tables were created
psql "postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres" -c "\dt"
```

### Step 4: Enable Row Level Security (RLS)

In Supabase SQL Editor:

```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create auth schema role (if not exists)
CREATE ROLE authenticated;
```

### Step 5: Verify Database

In Supabase SQL Editor, run:

```sql
-- Count all tables
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public';

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check payment table structure
\d payments
```

Expected tables: ~17 tables including users, members, elections, events, payments, etc.

---

## SSLCommerz Setup

### Prerequisites
- SSLCommerz merchant account
- Store ID and Store Password

### Step 1: Create SSLCommerz Account

1. Visit https://developer.sslcommerz.com
2. Click "Merchant Registration"
3. Fill in the form with:
   - **Business Name**: CSEDU Club
   - **Email**: your-email@du.ac.bd
   - **Phone**: +88017xxx
   - **Address**: Dhaka, Bangladesh
   - **Business Type**: Non-profit Organization
4. Submit for verification (usually approved within 24 hours)

### Step 2: Get Sandbox Credentials

1. Log in to SSLCommerz dashboard
2. Go to **Account Settings** → **API Credentials**
3. Copy:
   - **Store ID** (e.g., `testbox123`)
   - **Store Password** (e.g., `qwerty@123`)

### Step 3: Configure Sandbox Environment

Create a test transaction:

```bash
# Add to .env.local (for development)
SSLCOMMERZ_STORE_ID=testbox123
SSLCOMMERZ_STORE_PASSWORD=qwerty@123
NODE_ENV=development
```

### Step 4: Set Up Production Credentials

Once verified:

1. Go to **Account Settings** → **Production Credentials**
2. Request production credentials (submit KYC documents)
3. After approval, update .env.local with production credentials:

```bash
SSLCOMMERZ_STORE_ID=your_production_store_id
SSLCOMMERZ_STORE_PASSWORD=your_production_store_password
NODE_ENV=production
```

### Step 5: Configure IPN Webhook

In SSLCommerz Dashboard:

1. Go to **Settings** → **Integration**
2. Set **IPN URL**:
   ```
   https://csedu.du.ac.bd/api/v1/payments/ipn
   ```
3. Set **Return URL**:
   ```
   https://csedu.du.ac.bd/payment/success
   ```
4. Set **Cancel URL**:
   ```
   https://csedu.du.ac.bd/payment/cancel
   ```
5. Set **Fail URL**:
   ```
   https://csedu.du.ac.bd/payment/failed
   ```
6. Save settings

---

## Payment Flow

### Complete Payment Process

```
1. User initiates payment
   ↓
2. Backend creates Payment record (status: 'initiated')
   ↓
3. Backend calls SSLCommerz API to get gateway URL
   ↓
4. User is redirected to SSLCommerz payment page
   ↓
5. User enters card details and completes payment
   ↓
6. SSLCommerz processes payment
   ↓
7a. SUCCESS: SSLCommerz redirects to return URL
    Backend verifies with SSLCommerz API
    Updates Payment record (status: 'completed')
    Activates membership (if membership payment)
    ↓
7b. WEBHOOK: SSLCommerz sends IPN notification
    Backend updates Payment record
    ↓
8. User sees success message
```

### Payment Status Flow

```
initiated → pending → completed ✓
                   → failed ✗
                   → refunded
```

---

## Database Schema

### Payments Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  member_id UUID REFERENCES members(id),
  amount NUMERIC(14,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BDT',
  status TEXT CHECK (status IN ('initiated','pending','completed','failed','refunded')),
  payment_method VARCHAR(50),
  gateway_response JSONB,
  description VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### Payment Types

```typescript
// Membership payment
{
  type: 'membership',
  amount: 500, // Annual fee in BDT
  description: 'Annual Membership Fee'
}

// Event payment
{
  type: 'event',
  eventId: 'event-uuid',
  amount: 200,
  description: 'Workshop Registration Fee'
}

// Fund donation
{
  type: 'donation',
  amount: 1000,
  description: 'Club Fund Donation'
}
```

### Payment Verification

SSLCommerz sends back:

```json
{
  "tran_id": "csedu_transaction_id",
  "status": "VALID",
  "amount": 500,
  "currency": "BDT",
  "card_type": "VISA",
  "card_issuer": "BANK_NAME",
  "card_issuer_code": "BANK_CODE",
  "card_issuer_country": "Bangladesh",
  "response_code": "0",
  "val_id": "validation_id_from_sslcommerz"
}
```

---

## API Endpoints

### Initiate Payment

```http
POST /api/v1/payments/initiate

Authorization: Bearer {token}

{
  "amount": 500,
  "description": "Annual Membership Fee",
  "type": "membership",
  "memberId": "member-uuid"
}

Response:
{
  "paymentId": "payment-uuid",
  "transactionId": "CSEDU_1711900000000_abc123",
  "gatewayUrl": "https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q=...",
  "sessionKey": "session_key_from_sslcommerz",
  "amount": 500
}
```

### Verify Payment

```http
POST /api/v1/payments/verify

Authorization: Bearer {token}

{
  "transactionId": "CSEDU_1711900000000_abc123",
  "amount": 500
}

Response:
{
  "status": "success",
  "message": "Payment verified successfully",
  "paymentId": "payment-uuid",
  "transactionId": "CSEDU_1711900000000_abc123",
  "amount": 500
}
```

### Get Payment Details

```http
GET /api/v1/payments/{paymentId}

Authorization: Bearer {token}

Response:
{
  "id": "payment-uuid",
  "transaction_id": "CSEDU_1711900000000_abc123",
  "member_id": "member-uuid",
  "amount": 500,
  "status": "completed",
  "completed_at": "2026-04-01T10:30:00Z",
  "gateway_response": { ... }
}
```

---

## Testing

### Test Card Details (Sandbox)

| Card Type | Card Number | Expiry | CVV |
|-----------|-------------|--------|-----|
| VISA | 4111111111111111 | 12/25 | 123 |
| Master | 5105105105105100 | 12/25 | 123 |
| AMEX | 378282246310005 | 12/25 | 1234 |

### Test Payment Flow

```bash
# 1. Start backend in development
NODE_ENV=development npm run dev

# 2. Go to payment page and click "Pay Now"

# 3. On payment gateway, use test card details above

# 4. Verify payment was recorded
SELECT * FROM payments WHERE status = 'completed';

# 5. Check audit log
SELECT * FROM audit_log WHERE action = 'PAYMENT_COMPLETED' ORDER BY logged_at DESC;
```

### Verify IPN Webhook

```bash
# Test IPN locally (with ngrok for tunneling)
npm install -g ngrok

# In terminal 1: Start backend
npm run dev

# In terminal 2: Tunnel to localhost
ngrok http 8000

# Update SSLCommerz IPN URL to:
# https://your-ngrok-url.ngrok.io/api/v1/payments/ipn

# Make test payment and check logs
docker logs -f csedu-portal
```

---

## Production Checklist

### Database
- [ ] Supabase project created
- [ ] Schema migrations completed
- [ ] RLS policies enabled
- [ ] Backup scheduled
- [ ] Connection pooling configured

### Payments
- [ ] SSLCommerz production account verified
- [ ] Production credentials added to .env
- [ ] IPN webhook configured
- [ ] SSL certificate installed
- [ ] Payment flow tested end-to-end
- [ ] Refund process documented

### Security
- [ ] Database password strong (>20 chars)
- [ ] JWT keys generated and stored securely
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Payment data encrypted

### Monitoring
- [ ] Payment logs enabled
- [ ] Error notifications set up
- [ ] Database backups automated
- [ ] Health checks configured
- [ ] Alert system in place

---

## Troubleshooting

### Database Connection Issues

```bash
# Test Supabase connection
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" -c "SELECT 1;"

# Check connection string format
# Correct: postgresql://user:password@host:port/database
# Wrong: postgresql://host:port/database (missing credentials)
```

### Payment Gateway Issues

```bash
# Check SSLCommerz credentials
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password

# Test API connection
curl -X POST "https://sandbox.sslcommerz.com/gwprocess/v4/api.php" \
  -d "store_id=testbox123" \
  -d "store_passwd=qwerty@123" \
  -d "total_amount=100" \
  -d "tran_id=test_$(date +%s)"
```

### IPN Not Received

1. Check SSLCommerz dashboard - IPN URL must be publicly accessible
2. Ensure HTTPS is used
3. Check firewall rules allow incoming webhooks
4. Add logging to IPN endpoint
5. Test with ngrok locally first

### Payment Status Stuck in 'pending'

```sql
-- Check payment record
SELECT * FROM payments WHERE status = 'pending';

-- Check payment logs
SELECT * FROM payment_logs WHERE payment_id = 'payment-uuid' ORDER BY logged_at DESC;

-- Manually verify (for troubleshooting only)
UPDATE payments SET status = 'completed', completed_at = NOW() WHERE id = 'payment-uuid';
```

---

## Support

- **SSLCommerz Support**: https://developer.sslcommerz.com
- **Supabase Docs**: https://supabase.com/docs
- **Payment Issues**: Check /logs/payments.log
- **Database Issues**: Check Supabase dashboard

---

**Last Updated:** April 2026
**Version:** 1.0
