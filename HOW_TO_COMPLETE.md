# How to Complete: Connecting the Frontend to a Real Backend

This document is a step-by-step engineering guide for turning the CSEDU Students' Club Portal from a fully-working mock frontend into a production-ready full-stack application. Every mock, every API call, every auth touch-point is documented here.

---

## Table of Contents

1. [What is Currently Mocked](#1-what-is-currently-mocked)
2. [Recommended Backend Stack](#2-recommended-backend-stack)
3. [Database Schema (PostgreSQL)](#3-database-schema-postgresql)
4. [Authentication — JWT Flow](#4-authentication--jwt-flow)
5. [Complete API Contract](#5-complete-api-contract)
6. [Frontend Integration — File by File](#6-frontend-integration--file-by-file)
7. [File Storage for Media Uploads](#7-file-storage-for-media-uploads)
8. [Email Notifications](#8-email-notifications)
9. [Environment Variables](#9-environment-variables)
10. [CORS Configuration](#10-cors-configuration)
11. [Deployment](#11-deployment)
12. [Security Checklist](#12-security-checklist)

---

## 1. What is Currently Mocked

| File | What it mocks | What to replace with |
|---|---|---|
| `lib/mockData.ts` | All data (members, events, notices, election, budgets, gallery) | Real API responses |
| `app/login/page.tsx` | Auth with `MOCK_USERS` dict + `"mock-jwt-token"` | `authApi.login()` → real JWT |
| `app/register/page.tsx` | `setTimeout` instead of real API call | `membersApi.apply()` |
| `app/events/page.tsx` | RSVP optimistic toggle with local state | `eventsApi.rsvp()` / `eventsApi.cancelRsvp()` |
| `app/events/[id]/page.tsx` | Same RSVP — local state | Real API |
| `app/elections/[id]/vote/page.tsx` | `setTimeout` "submit" | `electionsApi.vote()` |
| `app/profile/page.tsx` | `setTimeout` "save" | `membersApi.update()` |
| `app/ec/members/page.tsx` | Local `useState` mutations | `membersApi.approve/reject/cancel()` |
| `app/ec/elections/page.tsx` | Local `status` state, mock results | `electionsApi.openPhase1/closePhase1/…` + `electionsApi.results()` |
| `app/ec/finance/page.tsx` | Local budget/expenditure state | `financeApi.createBudget/logExpenditure/approveBudget()` |
| `app/ec/media/page.tsx` | `URL.createObjectURL` (local blob) | Presigned S3 upload → `mediaApi.getUploadUrl/confirm()` |
| `app/advisor/page.tsx` | All mock data reads | Real API reads |
| `app/admin/page.tsx` | Static `MOCK_USERS` + `MOCK_AUDIT` | Real user management + audit log API |
| `app/providers.tsx` | Reads user from localStorage | Same — but token must come from real login |

---

## 2. Recommended Backend Stack

Any REST API backend works. The frontend speaks JSON over HTTP — it doesn't care what runs on the other end.

**Recommended (Python + FastAPI):**
```
FastAPI          — typed, async, auto-generates OpenAPI docs
PostgreSQL       — primary database
SQLAlchemy 2     — ORM
Alembic          — migrations
python-jose      — JWT signing / verification
bcrypt           — password hashing
boto3            — AWS S3 uploads
fastapi-mail     — email notifications
uvicorn          — ASGI server
```

**Alternative (Node.js + Express):**
```
Express + TypeScript
PostgreSQL (pg / Drizzle ORM)
jsonwebtoken
bcryptjs
aws-sdk / @aws-sdk/client-s3
nodemailer
```

**Alternative (Django):**
```
Django REST Framework
djangorestframework-simplejwt
django-storages (S3)
```

> The frontend's `lib/api.ts` uses `NEXT_PUBLIC_API_URL` as the base URL. All you need is a REST API at that URL with the endpoints listed in Section 5.

---

## 3. Database Schema (PostgreSQL)

Below is the full schema derived from `types/index.ts`. Column names use `snake_case` (PostgreSQL convention).

```sql
-- ─────────────────────────────────────────
-- USERS & AUTH
-- ─────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'GUEST', 'MEMBER', 'VOLUNTEER', 'EC_OFFICER',
  'PRESIDENT', 'SECRETARY', 'FACULTY_ADVISOR', 'SYSTEM_ADMIN'
);

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'MEMBER',
  ec_role     TEXT,                          -- e.g. "President", "Treasurer"
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MEMBERS
-- ─────────────────────────────────────────

CREATE TYPE member_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

CREATE TABLE members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id   TEXT UNIQUE NOT NULL,
  full_name    TEXT NOT NULL,
  batch_year   SMALLINT NOT NULL,
  phone        TEXT,
  status       member_status NOT NULL DEFAULT 'PENDING',
  joined_date  DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- COMMITTEE TERMS
-- ─────────────────────────────────────────

CREATE TYPE term_status AS ENUM ('active', 'archived');

CREATE TABLE committee_terms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_number   SMALLINT UNIQUE NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE,
  status        term_status NOT NULL DEFAULT 'active'
);

CREATE TABLE ec_role_holders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id       UUID NOT NULL REFERENCES committee_terms(id),
  member_id     UUID NOT NULL REFERENCES members(id),
  role_title    TEXT NOT NULL,
  assigned_date DATE NOT NULL,
  UNIQUE (term_id, role_title)
);

-- ─────────────────────────────────────────
-- ELECTIONS
-- ─────────────────────────────────────────

CREATE TYPE election_status AS ENUM (
  'DRAFT', 'PHASE1_OPEN', 'PHASE1_CLOSED',
  'SHORTLISTING', 'PHASE2_OPEN', 'COMPLETED'
);

CREATE TABLE elections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id       UUID NOT NULL REFERENCES committee_terms(id),
  phase1_start  TIMESTAMPTZ NOT NULL,
  phase1_end    TIMESTAMPTZ NOT NULL,
  phase2_start  TIMESTAMPTZ,
  phase2_end    TIMESTAMPTZ,
  shortlist_n   SMALLINT NOT NULL DEFAULT 3,
  status        election_status NOT NULL DEFAULT 'DRAFT'
);

CREATE TABLE candidates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id   UUID NOT NULL REFERENCES elections(id),
  member_id     UUID NOT NULL REFERENCES members(id),
  position      TEXT NOT NULL,
  phase1_votes  INT NOT NULL DEFAULT 0,
  phase2_votes  INT NOT NULL DEFAULT 0,
  shortlisted   BOOLEAN NOT NULL DEFAULT FALSE,
  winner        BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (election_id, member_id, position)
);

CREATE TABLE votes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id   UUID NOT NULL REFERENCES elections(id),
  phase         TEXT NOT NULL CHECK (phase IN ('phase1', 'phase2')),
  candidate_id  UUID NOT NULL REFERENCES candidates(id),
  position      TEXT NOT NULL,
  cast_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- voter_id intentionally omitted: anonymized per constitution
  -- implement as: store voter_id in a separate join table, nulled after phase closes
);

-- To enforce one-vote-per-member per position per phase without storing voter_id
-- in the vote row permanently, use a separate table that is TRUNCATED after each phase:
CREATE TABLE vote_receipts (
  member_id     UUID NOT NULL REFERENCES members(id),
  election_id   UUID NOT NULL REFERENCES elections(id),
  position      TEXT NOT NULL,
  phase         TEXT NOT NULL,
  PRIMARY KEY (member_id, election_id, position, phase)
);

-- ─────────────────────────────────────────
-- EVENTS & RSVPs
-- ─────────────────────────────────────────

CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'RSVP_CLOSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE event_type   AS ENUM ('workshop', 'seminar', 'carnival', 'sports', 'general');

CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  event_type    event_type NOT NULL,
  event_date    TIMESTAMPTZ NOT NULL,
  venue         TEXT,
  capacity      INT NOT NULL,
  rsvp_deadline TIMESTAMPTZ,
  description   TEXT,
  status        event_status NOT NULL DEFAULT 'DRAFT',
  organizer_id  UUID REFERENCES members(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rsvps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, member_id)
);

CREATE TABLE volunteer_roles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role_name           TEXT NOT NULL,
  description         TEXT,
  assigned_member_id  UUID REFERENCES members(id),
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled'))
);

-- ─────────────────────────────────────────
-- NOTICES
-- ─────────────────────────────────────────

CREATE TYPE notice_type AS ENUM ('General', 'Policy', 'Membership', 'Election', 'Event');

CREATE TABLE notices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  notice_type   notice_type NOT NULL DEFAULT 'General',
  author_id     UUID REFERENCES users(id),
  author_role   TEXT,
  published_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FINANCE
-- ─────────────────────────────────────────

CREATE TYPE budget_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE budgets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id           UUID NOT NULL REFERENCES committee_terms(id),
  event_id          UUID REFERENCES events(id),
  total_amount_bdt  NUMERIC(12, 2) NOT NULL,
  approved_by       UUID REFERENCES users(id),
  status            budget_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expenditures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id     UUID NOT NULL REFERENCES budgets(id),
  amount_bdt    NUMERIC(12, 2) NOT NULL,
  category      TEXT,
  description   TEXT,
  expense_date  DATE NOT NULL,
  added_by      UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MEDIA
-- ─────────────────────────────────────────

CREATE TYPE media_type AS ENUM ('image', 'pdf');

CREATE TABLE media_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  s3_key        TEXT NOT NULL,             -- S3 object key
  url           TEXT NOT NULL,             -- public CDN URL
  media_type    media_type NOT NULL,
  tags          TEXT[] DEFAULT '{}',
  event_id      UUID REFERENCES events(id),
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES users(id),
  action        TEXT NOT NULL,             -- e.g. "MEMBER_APPROVED"
  entity_type   TEXT NOT NULL,             -- e.g. "member"
  entity_id     UUID,
  payload       JSONB,
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES (important for performance)
-- ─────────────────────────────────────────

CREATE INDEX ON members (status);
CREATE INDEX ON members (batch_year);
CREATE INDEX ON events (event_date);
CREATE INDEX ON events (status);
CREATE INDEX ON rsvps (event_id);
CREATE INDEX ON rsvps (member_id);
CREATE INDEX ON candidates (election_id, position);
CREATE INDEX ON votes (election_id, phase);
CREATE INDEX ON notices (published_at DESC);
CREATE INDEX ON audit_logs (logged_at DESC);
CREATE INDEX ON audit_logs (actor_id);
```

---

## 4. Authentication — JWT Flow

### How the frontend works today

1. User submits email + password on `/login`
2. `handleSubmit` in `app/login/page.tsx` calls `authApi.login(email, password)`
3. On success it calls `setStoredUser(user, token)` which writes:
   - `localStorage.setItem("user", JSON.stringify(user))`
   - `localStorage.setItem("access_token", token)`
4. `app/providers.tsx` reads `getStoredUser()` from localStorage on mount → sets React state
5. Every Axios request in `lib/api.ts` automatically attaches `Authorization: Bearer <access_token>`
6. A 401 response automatically clears localStorage and redirects to `/login`

### What the backend must return from `POST /auth/login`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@du.ac.bd",
    "role": "EC_OFFICER",
    "ecRole": "Treasurer"
  }
}
```

> The frontend currently only uses `accessToken` (no refresh token flow). Add refresh token rotation later.

### JWT Payload (what to encode)

```json
{
  "sub": "user-uuid",
  "email": "user@du.ac.bd",
  "role": "EC_OFFICER",
  "ecRole": "Treasurer",
  "iat": 1714000000,
  "exp": 1714086400
}
```

**Recommended expiry:** `access_token` = 24 hours, `refresh_token` = 30 days.

### Backend validation middleware

On every protected endpoint, verify the JWT and check the role:

```python
# FastAPI example
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import jwt, JWTError

security = HTTPBearer()
SECRET_KEY = os.environ["JWT_SECRET"]
ALGORITHM = "HS256"

def get_current_user(token = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(*roles):
    def check(user = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return Depends(check)

# Usage:
@app.post("/members/{id}/approve")
def approve_member(id: str, user = require_role("EC_OFFICER", "PRESIDENT", "SECRETARY", "SYSTEM_ADMIN")):
    ...
```

### Swapping mock auth in the frontend

**`app/login/page.tsx`** — replace `handleSubmit`:

```tsx
// DELETE the MOCK_USERS dict and the setTimeout block.
// Replace the body of handleSubmit with:

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  const errs = validate();
  if (Object.keys(errs).length) { setErrors(errs); return; }
  setErrors({});
  setLoading(true);
  try {
    const result = await authApi.login(email, password);
    setStoredUser(result.user, result.accessToken);
    setUser(result.user);
    toast.success("Welcome back!");
    if (result.user.role === "FACULTY_ADVISOR") router.push("/advisor");
    else if (result.user.role === "SYSTEM_ADMIN") router.push("/admin");
    else if (["EC_OFFICER", "PRESIDENT", "SECRETARY"].includes(result.user.role)) router.push("/ec");
    else router.push("/dashboard");
  } catch (err: any) {
    setErrors({ password: err.detail || "Invalid email or password." });
  } finally {
    setLoading(false);
  }
}
```

Also update `lib/api.ts` — the login response shape needs `user` in addition to `accessToken`:

```ts
// lib/api.ts
export const authApi = {
  login: (email: string, password: string) =>
    post<{ accessToken: string; user: User }>("/auth/login", { email, password }),
  logout: () => post("/auth/logout"),
  me: () => get<User>("/auth/me"),   // add this — useful for session restore
};
```

---

## 5. Complete API Contract

All routes are prefixed with the value of `NEXT_PUBLIC_API_URL` (default `/api/v1`).

### Auth

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/login` | None | `{ email, password }` | `{ accessToken, user }` |
| POST | `/auth/logout` | Bearer | — | `204` |
| GET  | `/auth/me` | Bearer | — | `User` |

### Members

| Method | Path | Auth | Role | Body / Query | Returns |
|---|---|---|---|---|---|
| POST | `/members/apply` | None | — | `MembershipApplication` | `{ memberId }` |
| GET  | `/members` | Bearer | EC+ | `?page&limit&status` | `PaginatedResponse<Member>` |
| GET  | `/members/pending` | Bearer | EC+ | `?page` | `PaginatedResponse<Member>` |
| GET  | `/members/:id` | Bearer | Self or EC+ | — | `Member` |
| PATCH | `/members/:id` | Bearer | Self or EC+ | `{ phone?, ... }` | `Member` |
| POST | `/members/:id/approve` | Bearer | EC+ | — | `Member` |
| POST | `/members/:id/reject` | Bearer | EC+ | `{ reason }` | `Member` |
| POST | `/members/:id/cancel` | Bearer | EC+ | `{ grounds }` | `Member` |

> `MembershipApplication` body:
> ```json
> { "studentId": "21-46558", "fullName": "Ruhan", "batchYear": 2021,
>   "email": "r@du.ac.bd", "password": "secret123",
>   "phone": "01711000000", "constitutionAcknowledged": true }
> ```

### Elections

| Method | Path | Auth | Role | Returns |
|---|---|---|---|---|
| POST | `/elections` | Bearer | PRESIDENT/SECRETARY | `Election` |
| GET  | `/elections` | Bearer | Any | `PaginatedResponse<Election>` |
| GET  | `/elections/:id` | Bearer | Any | `Election` |
| POST | `/elections/:id/open-phase1` | Bearer | PRESIDENT/SECRETARY | `Election` |
| POST | `/elections/:id/close-phase1` | Bearer | PRESIDENT/SECRETARY | `Election` |
| POST | `/elections/:id/open-phase2` | Bearer | PRESIDENT/SECRETARY | `Election` |
| POST | `/elections/:id/close-phase2` | Bearer | PRESIDENT/SECRETARY | `Election` |
| POST | `/elections/:id/candidates` | Bearer | MEMBER | `{ position }` → `Candidate` |
| GET  | `/elections/:id/candidates` | Bearer | Any | `Candidate[]` |
| POST | `/elections/:id/vote` | Bearer | MEMBER | `{ votes: [{ position, candidateId }] }` → `204` |
| GET  | `/elections/:id/results` | Bearer | Any | `{ position: Candidate[] }` |

> **Vote anonymization**: On `close-phase1` and `close-phase2`, your backend should null/delete the `voter_id` column in `vote_receipts` and finalize vote counts on the `candidates` table. The frontend never sends voter identity — only the authenticated JWT establishes who is voting (server-side).

### Events

| Method | Path | Auth | Role | Body | Returns |
|---|---|---|---|---|---|
| POST | `/events` | Bearer | EC+ | `Partial<Event>` | `Event` |
| GET  | `/events` | Bearer | Any | `?page&type&status` | `PaginatedResponse<Event>` |
| GET  | `/events/:id` | Bearer | Any | — | `Event & { userRsvp: boolean, rsvpCount: number }` |
| PATCH | `/events/:id` | Bearer | EC+ | `Partial<Event>` | `Event` |
| POST | `/events/:id/rsvp` | Bearer | MEMBER | — | `Rsvp` |
| DELETE | `/events/:id/rsvp` | Bearer | MEMBER | — | `204` |
| POST | `/events/:id/volunteer-roles` | Bearer | EC+ | `{ roleName, description }` | `VolunteerRole` |
| POST | `/events/:id/volunteer-roles/:roleId/assign` | Bearer | EC+ | `{ memberId }` | `VolunteerRole` |

> `GET /events` should include `userRsvp: boolean` and `rsvpCount: number` fields, resolved server-side from the authenticated user's JWT.

### Notices

| Method | Path | Auth | Role | Body | Returns |
|---|---|---|---|---|---|
| POST | `/notices` | Bearer | EC+ | `{ title, content, noticeType }` | `Notice` |
| GET  | `/notices` | Bearer | Any | `?page&type` | `PaginatedResponse<Notice>` |
| GET  | `/notices/:id` | Bearer | Any | — | `Notice` |

### Finance

| Method | Path | Auth | Role | Body | Returns |
|---|---|---|---|---|---|
| POST | `/finance/budgets` | Bearer | EC+ | `{ termId, eventId?, totalAmountBdt }` | `Budget` |
| GET  | `/finance/budgets` | Bearer | EC+ | `?page&termId` | `PaginatedResponse<Budget>` |
| POST | `/finance/budgets/:id/approve` | Bearer | PRESIDENT/SECRETARY | — | `Budget` |
| POST | `/finance/expenditures` | Bearer | EC+ | `{ budgetId, amountBdt, category, description, expenseDate }` | `Expenditure` |
| GET  | `/finance/expenditures` | Bearer | EC+ | `?budgetId` | `Expenditure[]` |
| GET  | `/finance/reports/term/:termId` | Bearer | EC+/ADVISOR | — | `TermReport` |

### Media

| Method | Path | Auth | Role | Body | Returns |
|---|---|---|---|---|---|
| POST | `/media/upload-url` | Bearer | EC+ | `{ filename, contentType, tags?, eventId? }` | `{ uploadUrl, key }` |
| POST | `/media/confirm` | Bearer | EC+ | `{ key, tags?, eventId? }` | `MediaItem` |
| GET  | `/media` | Bearer | Any | `?page&tags` | `PaginatedResponse<MediaItem>` |
| DELETE | `/media/:id` | Bearer | EC+ | — | `204` |

### Admin

| Method | Path | Auth | Role | Returns |
|---|---|---|---|---|
| GET | `/admin/users` | Bearer | SYSTEM_ADMIN | `User[]` |
| POST | `/admin/users/:id/reset-password` | Bearer | SYSTEM_ADMIN | `204` |
| PATCH | `/admin/users/:id/role` | Bearer | SYSTEM_ADMIN | `{ role }` → `User` |
| GET | `/admin/audit-log` | Bearer | SYSTEM_ADMIN | `PaginatedResponse<AuditLog>` |

### Standard Response Shapes

**Success (single resource):**
```json
{ "data": { ... }, "message": "Optional success message" }
```

**Paginated list:**
```json
{ "data": [...], "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
```

**Error (RFC 7807 Problem Details — already handled in `lib/api.ts`):**
```json
{
  "type": "about:blank",
  "title": "Validation Error",
  "status": 422,
  "detail": "student_id already exists."
}
```

---

## 6. Frontend Integration — File by File

For each file below: delete the mock import, fetch real data, handle loading and error states.

### Pattern (use this everywhere)

```tsx
// At the top of your component, add real state + fetch:
const [data, setData] = useState<YourType[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function load() {
    try {
      const res = await yourApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.detail);
    } finally {
      setLoading(false);
    }
  }
  load();
}, []);

if (loading) return <CardSkeleton />;    // from components/ui/Skeleton.tsx
if (error) return <p className="text-red-500">{error}</p>;
```

---

### `app/register/page.tsx`

```tsx
// Replace the setTimeout block in handleSubmit:
import { membersApi } from "@/lib/api";

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  const errs = validate();
  if (Object.keys(errs).length) { setErrors(errs); return; }
  setLoading(true);
  try {
    await membersApi.apply({
      studentId: form.studentId,
      fullName: form.fullName,
      batchYear: Number(form.batchYear),
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      constitutionAcknowledged: form.constitutionAck,
    });
    setDone(true);
  } catch (err: any) {
    toast.error(err.detail || "Submission failed.");
  } finally {
    setLoading(false);
  }
}
```

---

### `app/events/page.tsx`

```tsx
import { eventsApi } from "@/lib/api";
import { Event } from "@/types";
import { CardSkeleton } from "@/components/ui/Skeleton";

// Replace mockEvents with:
const [events, setEvents] = useState<Event[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  eventsApi.list().then((res: any) => {
    setEvents(res.data);
    setLoading(false);
  });
}, []);

// Replace optimistic RSVP toggle:
async function handleRsvp(event: Event) {
  const wasRsvp = event.userRsvp;
  // optimistic update
  setEvents((prev) => prev.map((e) => e.id === event.id
    ? { ...e, userRsvp: !wasRsvp, rsvpCount: (e.rsvpCount ?? 0) + (wasRsvp ? -1 : 1) }
    : e
  ));
  try {
    if (wasRsvp) await eventsApi.cancelRsvp(event.id);
    else await eventsApi.rsvp(event.id);
  } catch {
    // revert on failure
    setEvents((prev) => prev.map((e) => e.id === event.id
      ? { ...e, userRsvp: wasRsvp, rsvpCount: (e.rsvpCount ?? 0) + (wasRsvp ? 1 : -1) }
      : e
    ));
    toast.error("RSVP action failed.");
  }
}
```

---

### `app/elections/[id]/vote/page.tsx`

```tsx
import { electionsApi } from "@/lib/api";

// Replace submitVotes:
async function submitVotes() {
  setLoading(true);
  try {
    // Build vote payload: [{ position, candidateId }]
    const votePayload = Object.entries(votes).map(([position, candidateId]) => ({
      position,
      candidateId,
    }));
    await electionsApi.vote(id, { votes: votePayload });
    setSubmitted(true);
    toast.success("Your votes have been recorded. Voter identity anonymized.");
  } catch (err: any) {
    toast.error(err.detail || "Vote submission failed.");
  } finally {
    setLoading(false);
    setConfirmOpen(false);
  }
}

// Also fetch real candidates on mount:
const [candidateMap, setCandidateMap] = useState<typeof MOCK_CANDIDATES>(MOCK_CANDIDATES);

useEffect(() => {
  electionsApi.candidates(id).then((candidates: any[]) => {
    const grouped: Record<string, any[]> = {};
    for (const c of candidates) {
      if (!grouped[c.position]) grouped[c.position] = [];
      grouped[c.position].push(c);
    }
    setCandidateMap(grouped);
  });
}, [id]);
```

---

### `app/profile/page.tsx`

```tsx
import { membersApi } from "@/lib/api";
import { authApi } from "@/lib/api";

// On mount, load real member profile:
useEffect(() => {
  authApi.me().then((me) => {
    // me is the full User; separately load member profile
    membersApi.get(me.id).then((member) => {
      setPhone(member.phone ?? "");
    });
  });
}, []);

// Replace handleSave:
async function handleSave(e: React.FormEvent) {
  e.preventDefault();
  setSaving(true);
  try {
    await membersApi.update(member.id, { phone });
    toast.success("Profile updated successfully.");
  } catch (err: any) {
    toast.error(err.detail || "Update failed.");
  } finally {
    setSaving(false);
  }
}
```

---

### `app/ec/members/page.tsx`

```tsx
import { membersApi } from "@/lib/api";

// Replace useState<Member[]>(mockMembers) with a fetch:
useEffect(() => {
  membersApi.list().then((res: any) => setMembers(res.data));
}, []);

// Replace executeAction:
async function executeAction(type: ActionType, member: Member) {
  setLoading(true);
  try {
    if (type === "approve") await membersApi.approve(member.id);
    else if (type === "reject") await membersApi.reject(member.id, "Application rejected by EC.");
    else await membersApi.cancel(member.id, "Membership cancelled by EC.");
    // Re-fetch after action
    const res: any = await membersApi.list();
    setMembers(res.data);
    toast.success(type === "approve" ? `${member.fullName} approved.` : `${member.fullName}'s status updated.`);
  } catch (err: any) {
    toast.error(err.detail || "Action failed.");
  } finally {
    setLoading(false);
    setConfirmAction(null);
  }
}
```

---

### `app/ec/elections/page.tsx`

```tsx
import { electionsApi } from "@/lib/api";

// Fetch current election on mount:
const [electionId, setElectionId] = useState<string>("");
useEffect(() => {
  electionsApi.list().then((res: any) => {
    const active = res.data[0];
    if (active) { setElectionId(active.id); setStatus(active.status); }
  });
}, []);

// Fetch live results:
useEffect(() => {
  if (!electionId) return;
  electionsApi.results(electionId).then((results: any) => {
    setMockResults(results);  // rename MOCK_RESULTS to a state variable
  });
}, [electionId, status]);

// Replace executeTransition:
const transitionFns: Partial<Record<ElectionStatus, (id: string) => Promise<any>>> = {
  DRAFT:       electionsApi.openPhase1,
  PHASE1_OPEN: electionsApi.closePhase1,
  SHORTLISTING: electionsApi.openPhase2,
  PHASE2_OPEN: electionsApi.closePhase2,
};

async function executeTransition() {
  if (!transition || !electionId) return;
  setLoading(true);
  try {
    const fn = transitionFns[status];
    if (fn) { const updated: any = await fn(electionId); setStatus(updated.data.status); }
    toast.success(`Election transitioned to ${transition.next}.`);
  } catch (err: any) {
    toast.error(err.detail || "Transition failed.");
  } finally {
    setLoading(false);
    setConfirmOpen(false);
  }
}
```

---

### `app/ec/finance/page.tsx`

```tsx
import { financeApi } from "@/lib/api";

// Load budgets and expenditures:
useEffect(() => {
  financeApi.listBudgets().then((res: any) => setBudgets(res.data));
  // Load expenditures via your custom endpoint:
  api.get("/finance/expenditures").then((res: any) => setExpenditures(res.data));
}, []);

// Replace createBudget:
async function createBudget(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  try {
    const res: any = await financeApi.createBudget({
      termId: "current-term-id",   // fetch from context or API
      eventId: bForm.eventId || undefined,
      totalAmountBdt: Number(bForm.totalAmountBdt),
    });
    setBudgets((prev) => [...prev, res.data]);
    setBudgetModalOpen(false);
    toast.success("Budget created.");
  } catch (err: any) {
    toast.error(err.detail || "Failed.");
  } finally {
    setLoading(false);
  }
}

// Replace approveBudget:
async function approveBudget() {
  if (!approveTarget) return;
  setLoading(true);
  try {
    await financeApi.approveBudget(approveTarget.id);
    setBudgets((prev) => prev.map((b) => b.id === approveTarget.id ? { ...b, status: "approved" } : b));
    toast.success("Budget approved.");
  } catch (err: any) {
    toast.error(err.detail || "Failed.");
  } finally {
    setLoading(false);
    setApproveTarget(null);
  }
}
```

---

### `app/ec/media/page.tsx`

```tsx
import { mediaApi } from "@/lib/api";

// Load existing gallery:
useEffect(() => {
  mediaApi.list().then((res: any) => setItems(res.data));
}, []);

// Replace handleFiles — real S3 presigned upload:
async function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return;
  setUploading(true);
  const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
  try {
    for (const file of Array.from(files)) {
      // 1. Get presigned URL
      const { uploadUrl, key }: any = await mediaApi.getUploadUrl({
        filename: file.name,
        contentType: file.type,
        tags,
      });
      // 2. Upload directly to S3 (PUT, no auth header)
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      // 3. Confirm with backend
      const confirmed: any = await mediaApi.confirm({ key, tags });
      setItems((prev) => [confirmed.data, ...prev]);
    }
    toast.success(`${files.length} file(s) uploaded.`);
  } catch (err: any) {
    toast.error(err.detail || "Upload failed.");
  } finally {
    setUploading(false);
    setTagInput("");
  }
}
```

---

### `app/advisor/page.tsx` and `app/admin/page.tsx`

These pages can use the same API modules. For the admin audit log:

```tsx
// app/admin/page.tsx
import { api } from "@/lib/api";

useEffect(() => {
  api.get("/admin/audit-log").then((res: any) => setAuditLog(res.data));
  api.get("/admin/users").then((res: any) => setUsers(res.data));
}, []);
```

---

## 7. File Storage for Media Uploads

### AWS S3 Setup

1. **Create an S3 bucket** (e.g. `csedusc-media`)
2. **Set bucket policy** to allow public read on the `media/` prefix (for gallery display)
3. **Create an IAM user** with `s3:PutObject` and `s3:DeleteObject` permissions on that bucket only
4. **Configure CORS on the bucket** to allow PUT from your frontend origin:

```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["PUT"],
  "AllowedOrigins": ["https://yourportal.vercel.app", "http://localhost:3000"],
  "ExposeHeaders": []
}]
```

### Backend presigned URL endpoint

```python
# FastAPI example
import boto3
from botocore.client import Config

s3 = boto3.client("s3",
  aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
  aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
  region_name=os.environ["AWS_REGION"],
  config=Config(signature_version="s3v4"),
)

@app.post("/media/upload-url")
def get_upload_url(body: UploadUrlRequest, user = Depends(require_ec)):
    key = f"media/{uuid4()}/{body.filename}"
    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": "csedusc-media", "Key": key, "ContentType": body.content_type},
        ExpiresIn=300,
    )
    return {"uploadUrl": upload_url, "key": key}

@app.post("/media/confirm")
def confirm_upload(body: ConfirmRequest, user = Depends(require_ec), db = Depends(get_db)):
    public_url = f"https://csedusc-media.s3.amazonaws.com/{body.key}"
    item = MediaItem(s3_key=body.key, url=public_url, tags=body.tags, uploaded_by=user["sub"])
    db.add(item)
    db.commit()
    return {"data": item}
```

### Cheaper alternative: Cloudflare R2

R2 is S3-compatible and has zero egress fees. Use the same boto3 SDK but point to R2's endpoint:

```python
s3 = boto3.client("s3",
  endpoint_url="https://<accountid>.r2.cloudflarestorage.com",
  aws_access_key_id=os.environ["R2_ACCESS_KEY"],
  aws_secret_access_key=os.environ["R2_SECRET_KEY"],
)
```

---

## 8. Email Notifications

The following events should trigger email notifications:

| Event | Recipient | Template |
|---|---|---|
| Membership application submitted | EC Officers | "New application from {name}" |
| Membership approved | Applicant | "Welcome to CSEDU Students' Club" |
| Membership rejected | Applicant | "Application status update" |
| Election Phase 1 opened | All active members | "Voting is now open — cast your vote" |
| Election results published | All members | "EC Election 2026 results" |
| Password reset requested | User | "Reset your password" |
| Budget approved | Requester | "Your budget has been approved" |

### Implementation (FastAPI + fastapi-mail)

```python
# Install: pip install fastapi-mail
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

conf = ConnectionConfig(
    MAIL_USERNAME=os.environ["SMTP_USER"],
    MAIL_PASSWORD=os.environ["SMTP_PASSWORD"],
    MAIL_FROM="noreply@csedu.du.ac.bd",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
)

async def send_welcome_email(to: str, name: str):
    message = MessageSchema(
        subject="Welcome to CSEDU Students' Club",
        recipients=[to],
        body=f"Dear {name},\n\nYour membership has been approved. You can now log in at https://portal.csedu.du.ac.bd",
        subtype="plain",
    )
    await FastMail(conf).send_message(message)
```

Use **background tasks** so emails don't slow down the API response:

```python
from fastapi import BackgroundTasks

@app.post("/members/{id}/approve")
def approve_member(id: str, background_tasks: BackgroundTasks, ...):
    member = db.query(Member).get(id)
    member.status = "ACTIVE"
    db.commit()
    background_tasks.add_task(send_welcome_email, member.user.email, member.full_name)
    return {"data": member}
```

---

## 9. Environment Variables

### Frontend (`.env.local` in `csedu-portal/`)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

That's the only required frontend variable. Everything else is backend-side.

### Backend

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/csedusc

# JWT
JWT_SECRET=your-256-bit-secret-minimum-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AWS S3 / Cloudflare R2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET_NAME=csedusc-media

# Email (SMTP)
SMTP_USER=noreply@csedu.du.ac.bd
SMTP_PASSWORD=...

# CORS
CORS_ORIGINS=https://yourportal.vercel.app,http://localhost:3000

# App
DEBUG=false
```

---

## 10. CORS Configuration

Your backend must allow the frontend origin. **Never use `*` in production.**

```python
# FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
  CORSMiddleware,
  allow_origins=os.environ["CORS_ORIGINS"].split(","),
  allow_credentials=True,
  allow_methods=["GET", "POST", "PATCH", "DELETE", "PUT"],
  allow_headers=["Authorization", "Content-Type"],
)
```

```js
// Express
const cors = require("cors");
app.use(cors({
  origin: process.env.CORS_ORIGINS.split(","),
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
  allowedHeaders: ["Authorization", "Content-Type"],
}));
```

**The S3/R2 bucket also needs CORS** — see Section 7.

---

## 11. Deployment

### Frontend → Vercel (free tier)

```bash
# 1. Push csedu-portal to GitHub
# 2. Import repo at vercel.com
# 3. Set environment variable:
#    NEXT_PUBLIC_API_URL = https://api.yourdomain.com/api/v1
# 4. Deploy (auto on every push to main)
```

### Backend → Railway or Render (free tier available)

**Railway:**
```bash
railway login
railway init
railway up
# Set env vars in Railway dashboard
```

**Render:**
```yaml
# render.yaml
services:
  - type: web
    name: csedusc-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: csedusc-db
          property: connectionString
```

### Database → Supabase or Neon (free tier PostgreSQL)

```bash
# Supabase: create project → get DATABASE_URL from Settings → Database
# Neon: create project → copy connection string

# Run migrations:
alembic upgrade head
# or
psql $DATABASE_URL -f schema.sql
```

### Custom domain

```
portal.csedu.du.ac.bd   →  Vercel (frontend)
api.csedu.du.ac.bd      →  Railway/Render (backend)
```

Point both CNAMEs to the respective hosting providers in your DNS panel (likely managed by DU IT department).

---

## 12. Security Checklist

Before going live, verify every item:

**Authentication**
- [ ] Passwords hashed with bcrypt (cost factor ≥ 12)
- [ ] JWT signed with `HS256` or `RS256`, secret ≥ 32 random bytes
- [ ] Access tokens expire in ≤ 24 hours
- [ ] Refresh tokens stored as hash in DB, not plaintext
- [ ] Logout revokes refresh token in DB

**Authorization**
- [ ] Every API endpoint checks role, not just authentication
- [ ] Student cannot approve their own membership
- [ ] MEMBER cannot access `/ec/*` routes (both frontend guard and backend middleware)
- [ ] FACULTY_ADVISOR has read-only enforced at API level
- [ ] Election vote endpoint checks: member is ACTIVE, election is OPEN, member has not already voted (via `vote_receipts`)

**Voting Integrity**
- [ ] `vote_receipts` table prevents double voting per position per phase
- [ ] Vote counts computed server-side — never trust the client
- [ ] `voter_id` nulled after phase closes (constitutional requirement)
- [ ] Results endpoint returns counts only, never individual vote-to-voter mapping

**Input Validation**
- [ ] Student ID format validated (e.g. `\d{2}-\d{5}`)
- [ ] Batch year range validated (e.g. 2000–2030)
- [ ] Budget amounts are positive numbers
- [ ] SQL injections impossible (use ORM parameterized queries — never raw string interpolation)
- [ ] File uploads: validate MIME type server-side (not just client-side extension check)
- [ ] Max file size enforced server-side (10MB)

**API Security**
- [ ] Rate limiting on `/auth/login` (e.g. 5 attempts per minute per IP)
- [ ] CORS restricted to known origins only
- [ ] `Authorization` header is never logged in plaintext
- [ ] HTTPS enforced everywhere (no HTTP in production)

**Database**
- [ ] Database user has minimum permissions (no `DROP TABLE`, no superuser)
- [ ] Backups enabled (daily minimum)
- [ ] `DATABASE_URL` never committed to git

**Infrastructure**
- [ ] Secrets in environment variables, not hardcoded
- [ ] `.env.local` in `.gitignore`
- [ ] S3 bucket blocks public write — only presigned PUTs allowed
- [ ] Audit log records all EC/Admin actions (auto-insert trigger or middleware)

---

## Quick Reference: Which mock to delete, and what to call instead

| Current mock | File | Replace call |
|---|---|---|
| `MOCK_USERS` dict | `app/login/page.tsx` | `authApi.login(email, password)` |
| `setTimeout` 800ms | `app/login/page.tsx` | Removed (real API has real latency) |
| `mockMembers` | `app/ec/members/page.tsx` | `membersApi.list()` |
| Local `setMembers` mutation | `app/ec/members/page.tsx` | `membersApi.approve/reject/cancel()` then re-fetch |
| Local `status` state | `app/ec/elections/page.tsx` | `electionsApi.openPhase1/closePhase1/…()` |
| `MOCK_RESULTS` | `app/ec/elections/page.tsx` | `electionsApi.results(id)` |
| `mockBudgets/Expenditures` | `app/ec/finance/page.tsx` | `financeApi.listBudgets()` + `/finance/expenditures` |
| `URL.createObjectURL` | `app/ec/media/page.tsx` | S3 presigned PUT → `mediaApi.confirm()` |
| `mockEvents` | `app/events/page.tsx` | `eventsApi.list()` |
| `mockNotices` | `app/notices/page.tsx` | `noticesApi.list()` |
| `mockElection` | `app/elections/page.tsx` | `electionsApi.list()` → first result |
| `mockGallery` | `app/gallery/page.tsx` | `mediaApi.list()` |
| `mockMembers[0]` | `app/profile/page.tsx` | `membersApi.get(user.id)` |
| `"mock-jwt-token"` | `app/login/page.tsx` | Real JWT from login response |
| All advisor mock reads | `app/advisor/page.tsx` | Same API modules, just read-only role |
| `MOCK_USERS/AUDIT` | `app/admin/page.tsx` | `/admin/users` + `/admin/audit-log` |

---

*All API routes, database tables, and frontend touch-points documented above are derived directly from the existing codebase (`lib/api.ts`, `types/index.ts`, all page components). No assumptions about backend implementation — use any stack that serves JSON over HTTP.*
