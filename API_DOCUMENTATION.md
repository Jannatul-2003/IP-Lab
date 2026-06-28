# CSEDU Portal API Documentation

## Base URL
```
Production: https://csedu.du.ac.bd/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication

All endpoints (except `/auth/login` and `/auth/signup`) require JWT authentication.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

The token can be passed via:
1. `Authorization: Bearer <token>` header (preferred)
2. `auth_token` HTTP-only cookie (for browser requests)

---

## Authentication Endpoints

### 1. User Registration
**POST** `/auth/signup`

Request body:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "studentId": "2024-001",
  "batchYear": 2024,
  "phone": "01712345678",
  "constitutionAcknowledged": true
}
```

Response (201):
```json
{
  "message": "User registered successfully",
  "userId": "uuid",
  "memberId": "uuid"
}
```

### 2. User Login
**POST** `/auth/login`

Request body:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Response (200):
```json
{
  "message": "Login successful",
  "accessToken": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "MEMBER",
    "member": {
      "id": "uuid",
      "full_name": "John Doe",
      "student_id": "2024-001",
      "batch_year": 2024,
      "phone": "01712345678",
      "status": "PENDING"
    }
  }
}
```

### 3. User Logout
**POST** `/auth/logout`

Requires authentication.

Response (200):
```json
{
  "message": "Logged out successfully"
}
```

---

## Member Endpoints

### 1. Get User Profile
**GET** `/members/profile`

Requires authentication.

Response (200):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "full_name": "John Doe",
  "student_id": "2024-001",
  "batch_year": 2024,
  "phone": "01712345678",
  "status": "ACTIVE",
  "constitution_acknowledged": true,
  "joined_date": "2024-01-15",
  "user": {
    "email": "user@example.com",
    "role": "MEMBER",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### 2. Update User Profile
**PUT** `/members/profile`

Requires authentication.

Request body (at least one field required):
```json
{
  "fullName": "John Updated",
  "phone": "01987654321"
}
```

Response (200):
```json
{
  "message": "Profile updated successfully",
  "member": { /* updated member data */ }
}
```

### 3. List Members
**GET** `/members/list`

Requires authentication with EC_ROLES or FACULTY_ADVISOR.

Query parameters:
- `limit` (default: 10)
- `skip` (default: 0)
- `status` (ACTIVE, PENDING, SUSPENDED, etc.)
- `batchYear` (integer)
- `search` (search by name or student ID)

Response (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "student_id": "2024-001",
      "batch_year": 2024,
      "status": "ACTIVE",
      "user": {
        "email": "user@example.com",
        "role": "MEMBER"
      }
    }
  ],
  "pagination": {
    "limit": 10,
    "skip": 0,
    "total": 50
  }
}
```

---

## Elections Endpoints

### 1. List Elections
**GET** `/elections`

Query parameters:
- `limit` (default: 10)
- `skip` (default: 0)
- `status` (DRAFT, ACTIVE, COMPLETED, etc.)

Response (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "term_id": "uuid",
      "phase1_start": "2024-02-01T00:00:00Z",
      "phase1_end": "2024-02-15T23:59:59Z",
      "phase2_start": "2024-03-01T00:00:00Z",
      "phase2_end": "2024-03-15T23:59:59Z",
      "shortlist_n": 3,
      "status": "ACTIVE",
      "term": {
        "id": "uuid",
        "term_number": 1,
        "start_date": "2024-01-01"
      },
      "_count": {
        "candidates": 12,
        "votes": 250
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

### 2. Create Election
**POST** `/elections`

Requires EC_ROLES.

Request body:
```json
{
  "termId": "uuid",
  "phase1Start": "2024-02-01T00:00:00Z",
  "phase1End": "2024-02-15T23:59:59Z",
  "phase2Start": "2024-03-01T00:00:00Z",
  "phase2End": "2024-03-15T23:59:59Z",
  "shortlistN": 3
}
```

Response (201):
```json
{
  "id": "uuid",
  "term_id": "uuid",
  "phase1_start": "2024-02-01T00:00:00Z",
  "status": "DRAFT"
}
```

### 3. Get Election Details
**GET** `/elections/{id}`

Response (200):
```json
{
  "id": "uuid",
  "term_id": "uuid",
  "phase1_start": "2024-02-01T00:00:00Z",
  "candidates": [
    {
      "id": "uuid",
      "position": "President",
      "phase1_votes": 45,
      "phase2_votes": 52,
      "shortlisted": true,
      "winner": true,
      "member": {
        "id": "uuid",
        "full_name": "Jane Doe",
        "student_id": "2024-002"
      }
    }
  ],
  "_count": {
    "votes": 250
  }
}
```

### 4. List Candidates
**GET** `/elections/{id}/candidates`

Response (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "election_id": "uuid",
      "member_id": "uuid",
      "position": "President",
      "phase1_votes": 45,
      "phase2_votes": 52,
      "shortlisted": true,
      "winner": true,
      "member": {
        "id": "uuid",
        "full_name": "Jane Doe",
        "student_id": "2024-002",
        "batch_year": 2024
      }
    }
  ]
}
```

### 5. Add Candidate
**POST** `/elections/{id}/candidates`

Requires EC_ROLES.

Request body:
```json
{
  "memberId": "uuid",
  "position": "President"
}
```

Response (201):
```json
{
  "id": "uuid",
  "election_id": "uuid",
  "member_id": "uuid",
  "position": "President",
  "phase1_votes": 0,
  "phase2_votes": 0
}
```

### 6. Cast Vote
**POST** `/elections/{id}/vote`

Requires authentication.

Request body:
```json
{
  "candidateId": "uuid",
  "position": "President",
  "phase": "phase1"
}
```

Response (201):
```json
{
  "message": "Vote recorded successfully",
  "vote": {
    "id": "uuid",
    "election_id": "uuid",
    "voter_id": "uuid",
    "candidate_id": "uuid",
    "position": "President",
    "phase": "phase1",
    "cast_at": "2024-02-05T10:30:00Z"
  }
}
```

### 7. Get Voting Status
**GET** `/elections/{id}/vote`

Requires authentication.

Response (200):
```json
{
  "votedFor": [
    {
      "position": "President",
      "phase": "phase1"
    }
  ],
  "positions": ["President-phase1"]
}
```

---

## Events Endpoints

### 1. List Events
**GET** `/events`

Query parameters:
- `limit` (default: 10)
- `skip` (default: 0)
- `status` (DRAFT, PUBLISHED, COMPLETED, CANCELLED)
- `eventType` (workshop, seminar, carnival, sports, general)

Response (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Programming Workshop",
      "event_type": "workshop",
      "event_date": "2024-02-20T14:00:00Z",
      "venue": "Lab Room 101",
      "capacity": 50,
      "description": "Learn advanced programming",
      "status": "PUBLISHED",
      "rsvp_deadline": "2024-02-19T23:59:59Z",
      "_count": {
        "event_rsvp": 35
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

### 2. Create Event
**POST** `/events`

Requires EC_ROLES.

Request body:
```json
{
  "title": "Programming Workshop",
  "eventType": "workshop",
  "eventDate": "2024-02-20T14:00:00Z",
  "venue": "Lab Room 101",
  "capacity": 50,
  "rsvpDeadline": "2024-02-19T23:59:59Z",
  "description": "Learn advanced programming",
  "status": "DRAFT"
}
```

Response (201):
```json
{
  "id": "uuid",
  "title": "Programming Workshop",
  "event_type": "workshop",
  "event_date": "2024-02-20T14:00:00Z",
  "capacity": 50,
  "status": "DRAFT"
}
```

### 3. Get Event Details
**GET** `/events/{id}`

Response (200):
```json
{
  "id": "uuid",
  "title": "Programming Workshop",
  "event_type": "workshop",
  "event_date": "2024-02-20T14:00:00Z",
  "venue": "Lab Room 101",
  "capacity": 50,
  "description": "Learn advanced programming",
  "status": "PUBLISHED",
  "rsvp_deadline": "2024-02-19T23:59:59Z",
  "media": [],
  "_count": {
    "event_rsvp": 35,
    "volunteer_roles": 3
  }
}
```

### 4. Update Event
**PUT** `/events/{id}`

Requires EC_ROLES.

Request body (partial update):
```json
{
  "title": "Advanced Programming Workshop",
  "status": "PUBLISHED"
}
```

### 5. Delete Event
**DELETE** `/events/{id}`

Requires EC_ROLES.

Response (200):
```json
{
  "message": "Event deleted successfully"
}
```

### 6. RSVP to Event
**POST** `/events/{id}/rsvp`

Requires authentication.

Response (201):
```json
{
  "message": "RSVP recorded successfully",
  "rsvp": {
    "id": "uuid",
    "event_id": "uuid",
    "member_id": "uuid",
    "status": "active",
    "event": {
      "title": "Programming Workshop"
    },
    "member": {
      "full_name": "John Doe"
    }
  }
}
```

### 7. Cancel RSVP
**DELETE** `/events/{id}/rsvp`

Requires authentication.

Response (200):
```json
{
  "message": "RSVP cancelled successfully"
}
```

### 8. Get Event RSVPs
**GET** `/events/{id}/rsvp`

Response (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "member_id": "uuid",
      "member": {
        "id": "uuid",
        "full_name": "John Doe",
        "student_id": "2024-001",
        "batch_year": 2024
      }
    }
  ],
  "count": 35
}
```

### 9. List Volunteer Roles
**GET** `/events/{id}/volunteer-roles`

Response (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "role_name": "Event Coordinator",
      "description": "Coordinate event activities",
      "status": "open",
      "assigned_member": null
    }
  ]
}
```

### 10. Create Volunteer Role
**POST** `/events/{id}/volunteer-roles`

Requires EC_ROLES.

Request body:
```json
{
  "roleName": "Event Coordinator",
  "description": "Coordinate event activities",
  "status": "open"
}
```

---

## Finance Endpoints

### 1. List Budgets
**GET** `/finance/budgets`

Requires EC_ROLES or FACULTY_ADVISOR.

Query parameters:
- `termId` (filter by term)
- `status` (pending, approved, rejected)
- `limit` (default: 10)
- `skip` (default: 0)

Response (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "term_id": "uuid",
      "total_amount_bdt": 50000,
      "status": "approved",
      "approved_by": "uuid",
      "notes": "Annual event budget",
      "term": {
        "id": "uuid",
        "term_number": 1,
        "start_date": "2024-01-01"
      },
      "event": {
        "id": "uuid",
        "title": "Annual Carnival",
        "event_date": "2024-03-15T14:00:00Z"
      },
      "expenditures": [
        {
          "id": "uuid",
          "amount_bdt": 15000,
          "category": "Decorations",
          "description": "Balloons and banners"
        }
      ]
    }
  ],
  "pagination": { /* ... */ }
}
```

### 2. Create Budget
**POST** `/finance/budgets`

Requires EC_ROLES.

Request body:
```json
{
  "termId": "uuid",
  "totalAmountBdt": 50000,
  "eventId": "uuid",
  "notes": "Annual event budget"
}
```

Response (201):
```json
{
  "id": "uuid",
  "term_id": "uuid",
  "total_amount_bdt": 50000,
  "status": "pending"
}
```

### 3. Get Budget Details
**GET** `/finance/budgets/{id}`

Requires EC_ROLES or FACULTY_ADVISOR.

Response (200):
```json
{
  "id": "uuid",
  "term_id": "uuid",
  "total_amount_bdt": 50000,
  "status": "approved",
  "totalExpended": 25000,
  "remaining": 25000,
  "expenditures": [ /* ... */ ]
}
```

### 4. Update Budget
**PUT** `/finance/budgets/{id}`

Requires EC_ROLES.

Request body:
```json
{
  "totalAmountBdt": 55000,
  "status": "approved",
  "notes": "Updated budget allocation"
}
```

### 5. List Expenditures
**GET** `/finance/expenditures`

Requires EC_ROLES or FACULTY_ADVISOR.

Query parameters:
- `budgetId` (filter by budget)
- `category` (Decorations, Catering, Transportation, etc.)
- `limit` (default: 10)
- `skip` (default: 0)

Response (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "budget_id": "uuid",
      "amount_bdt": 15000,
      "category": "Decorations",
      "description": "Balloons and banners",
      "expense_date": "2024-02-10",
      "added_by": "uuid",
      "budget": {
        "id": "uuid",
        "total_amount_bdt": 50000,
        "term": {
          "term_number": 1
        }
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

### 6. Create Expenditure
**POST** `/finance/expenditures`

Requires EC_ROLES.

Request body:
```json
{
  "budgetId": "uuid",
  "amountBdt": 15000,
  "category": "Decorations",
  "description": "Balloons and banners",
  "expenseDate": "2024-02-10"
}
```

Response (201):
```json
{
  "id": "uuid",
  "budget_id": "uuid",
  "amount_bdt": 15000,
  "category": "Decorations",
  "expense_date": "2024-02-10"
}
```

---

## Notices Endpoints

### 1. List Notices
**GET** `/notices`

Query parameters:
- `noticeType` (announcement, urgent, event, general)
- `limit` (default: 10)
- `skip` (default: 0)

Response (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Election Schedule",
      "content": "Phase 1 voting starts...",
      "notice_type": "announcement",
      "author_id": "uuid",
      "author_role": "PRESIDENT",
      "published_at": "2024-02-01T10:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

### 2. Create Notice
**POST** `/notices`

Requires EC_ROLES.

Request body:
```json
{
  "title": "Election Schedule",
  "content": "Phase 1 voting starts on February 5th",
  "noticeType": "announcement"
}
```

Response (201):
```json
{
  "id": "uuid",
  "title": "Election Schedule",
  "notice_type": "announcement",
  "published_at": "2024-02-01T10:00:00Z"
}
```

---

## Meetings Endpoints

### 1. List Meetings
**GET** `/meetings`

Query parameters:
- `status` (upcoming, ongoing, completed, cancelled)
- `limit` (default: 10)
- `skip` (default: 0)

Response (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "EC Monthly Meeting",
      "agenda": "Discuss upcoming events",
      "scheduled_at": "2024-02-15T14:00:00Z",
      "venue": "Meeting Room 101",
      "called_by": "President",
      "status": "upcoming",
      "_count": {
        "attendance": 8
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

### 2. Create Meeting
**POST** `/meetings`

Requires EC_ROLES.

Request body:
```json
{
  "title": "EC Monthly Meeting",
  "agenda": "Discuss upcoming events",
  "scheduledAt": "2024-02-15T14:00:00Z",
  "venue": "Meeting Room 101",
  "calledBy": "President",
  "status": "upcoming"
}
```

Response (201):
```json
{
  "id": "uuid",
  "title": "EC Monthly Meeting",
  "scheduled_at": "2024-02-15T14:00:00Z",
  "status": "upcoming"
}
```

### 3. Get Meeting Details
**GET** `/meetings/{id}`

Response (200):
```json
{
  "id": "uuid",
  "title": "EC Monthly Meeting",
  "agenda": "Discuss upcoming events",
  "scheduled_at": "2024-02-15T14:00:00Z",
  "venue": "Meeting Room 101",
  "called_by": "President",
  "status": "upcoming",
  "attendance": [
    {
      "id": "uuid",
      "meeting_id": "uuid",
      "member_id": "uuid",
      "present": true,
      "member": {
        "id": "uuid",
        "full_name": "John Doe",
        "student_id": "2024-001"
      }
    }
  ]
}
```

### 4. Update Meeting
**PUT** `/meetings/{id}`

Requires EC_ROLES.

Request body:
```json
{
  "status": "completed",
  "minutesUrl": "https://docs.google.com/..."
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description",
  "status": 400
}
```

### Common Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

---

## Roles & Permissions

### Available Roles
- `GUEST` - No access to protected endpoints
- `MEMBER` - Can view public content, RSVP to events, vote in elections
- `VOLUNTEER` - Can volunteer for events
- `EC_OFFICER` - Can create/edit events, elections, budgets
- `SECRETARY` - Can manage meetings and notices
- `PRESIDENT` - Full access (EC level)
- `FACULTY_ADVISOR` - Can view finances and member lists
- `SYSTEM_ADMIN` - Full system access

### EC_ROLES
`EC_OFFICER`, `SECRETARY`, `PRESIDENT`, `FACULTY_ADVISOR`, `SYSTEM_ADMIN`

### Protected Endpoint Requirements
- **Create/Update/Delete** elections, events, budgets: `EC_ROLES`
- **List** members, budgets, expenditures: `EC_ROLES` or `FACULTY_ADVISOR`
- **Create** notices, meetings: `EC_ROLES`
- **Vote**, **RSVP**, **Update profile**: Authenticated user (any role)

---

## Rate Limiting

Currently not implemented. Coming soon.

---

## Pagination

All list endpoints support pagination:

Query parameters:
- `limit` - Number of items per page (default: 10, max: 100)
- `skip` - Number of items to skip (default: 0)

Response format:
```json
{
  "data": [ /* ... */ ],
  "pagination": {
    "limit": 10,
    "skip": 0,
    "total": 250
  }
}
```

---

## Testing with cURL

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get profile (replace TOKEN with actual token)
curl -X GET http://localhost:8000/api/v1/members/profile \
  -H "Authorization: Bearer TOKEN"

# Create event
curl -X POST http://localhost:8000/api/v1/events \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Workshop",
    "eventType": "workshop",
    "eventDate": "2024-02-20T14:00:00Z",
    "venue": "Lab 101",
    "capacity": 50
  }'
```

---

## WebSocket & Real-time (Future)

Not yet implemented. Coming soon.

---

## Support

For issues or questions, contact the development team.
