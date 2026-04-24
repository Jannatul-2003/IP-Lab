# CSEDU Students' Club Portal

Production-grade Next.js 14 frontend for the **CSEDU Students' Club** (Department of Computer Science and Engineering, University of Dhaka). Built from the SDD with full role-based access control, EN/Bangla i18n, Framer Motion animations, and a mock data layer ready for real API integration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom design tokens |
| Animation | Framer Motion |
| HTTP client | Axios |
| Icons | Lucide React |
| Fonts | Playfair Display · DM Sans · Noto Sans Bengali |

---

## Getting Started

```bash
cd csedu-portal
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts

Log in at `/login` with any of these mock accounts:

| Email | Password | Role |
|---|---|---|
| `member@csedu.du.ac.bd` | `member123` | MEMBER |
| `ec@csedu.du.ac.bd` | `ec123` | EC_OFFICER |
| `president@csedu.du.ac.bd` | `pres123` | PRESIDENT |
| `advisor@csedu.du.ac.bd` | `advisor123` | FACULTY_ADVISOR |
| `admin@csedu.du.ac.bd` | `admin123` | SYSTEM_ADMIN |

---

## Project Structure

```
csedu-portal/
├── app/
│   ├── layout.tsx          # Root layout — Providers, Toaster, metadata
│   ├── globals.css         # Design system CSS variables + @layer components
│   ├── providers.tsx       # AuthContext + LangContext (combined)
│   ├── page.tsx            # Landing page (parallax hero, features, events preview)
│   ├── about/              # Mission, values, history, EC positions
│   ├── events/             # Events listing + detail + RSVP
│   ├── gallery/            # Masonry gallery + lightbox
│   ├── notices/            # Notices with accordion + timeline
│   ├── login/              # Mock auth login
│   ├── register/           # Membership application form
│   ├── dashboard/          # Member dashboard (stats, RSVP list, notices)
│   ├── profile/            # Member profile view + edit phone
│   ├── elections/          # Election status timeline + voting
│   │   └── [id]/vote/      # Multi-step position voting flow
│   ├── ec/                 # EC Panel (EC_OFFICER+ only)
│   │   ├── members/        # Member management (approve/reject/cancel)
│   │   ├── elections/      # Election phase control + live results
│   │   ├── finance/        # Budget + expenditure management
│   │   └── media/          # Gallery upload + management
│   ├── advisor/            # Faculty Advisor read-only dashboard
│   └── admin/              # System Admin panel (users + audit log)
├── components/
│   ├── layout/             # Navbar, Footer, PageLayout
│   ├── shared/             # ConfirmDialog, RoleBadge
│   └── ui/                 # Button, Badge, Modal, Toaster, FormField, Skeleton, Table
├── i18n/                   # en.ts, bn.ts, index.ts
├── lib/
│   ├── api.ts              # Axios instance + all API modules
│   ├── auth.ts             # Auth helpers (role level, JWT utils)
│   ├── mockData.ts         # Mock data (members, events, notices, election, finance, gallery)
│   └── utils.ts            # cn, formatDate, formatCurrency, getInitials, timeAgo …
└── types/
    └── index.ts            # All TypeScript interfaces
```

---

## Design System

### Colors

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#1F3864` | Headings, body text |
| `--accent` | `#2E75B6` | CTAs, links, active states |
| `--surface` | `#D6E4F0` | Cards, subtle backgrounds |
| `--gold` | `#C9A84C` | Special highlights |

### Typography

- **Headings** → Playfair Display (`.font-heading`)
- **Body** → DM Sans (`.font-body`)
- **Bangla text** → Noto Sans Bengali (auto-applied when `lang === "bn"`)

### Custom Classes (globals.css)

```css
.card           /* white card with shadow */
.btn-primary    /* accent filled button */
.btn-outline    /* accent outlined button */
.badge          /* small label chip */
.glass          /* frosted glass surface */
.bg-hero        /* brand gradient background */
.section-title  /* page section heading */
.skeleton       /* shimmer loading placeholder */
```

---

## Role-Based Access

| Role | Access |
|---|---|
| `GUEST` | Public pages (home, about, events, gallery, notices) |
| `MEMBER` | + dashboard, profile, elections, RSVP |
| `VOLUNTEER` | + volunteer assignment visibility |
| `EC_OFFICER` | + `/ec` panel (members, finance, media) |
| `SECRETARY` | + election phase control |
| `PRESIDENT` | + budget approval, election control |
| `FACULTY_ADVISOR` | `/advisor` read-only dashboard |
| `SYSTEM_ADMIN` | `/admin` full access |

Role hierarchy is enforced via `hasRole()` in `lib/auth.ts` using `ROLE_LEVEL` map. Frontend gates use `can(role)` from `useAuthContext()`.

---

## i18n

Toggle between English and Bangla via the globe icon in the Navbar. The active language is stored in localStorage and applied via `useLang()` from `app/providers.tsx`.

Translation files: `i18n/en.ts` and `i18n/bn.ts`.

To add a new key:

```ts
// i18n/en.ts
export const en = {
  mySection: {
    myKey: "English text",
  },
};

// i18n/bn.ts
export const bn = {
  mySection: {
    myKey: "বাংলা টেক্সট",
  },
};
```

Use in components:

```ts
const { t } = useLang();
t("mySection.myKey");
```

---

## Backend Integration Guide

### 1. Set the API base URL

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.csedu.du.ac.bd/api/v1
```

### 2. Update `lib/api.ts`

The Axios instance reads `process.env.NEXT_PUBLIC_API_BASE_URL`. JWT tokens are automatically injected via request interceptor. 401 responses redirect to `/login`.

### 3. Replace mock data with real API calls

Each page currently imports from `lib/mockData.ts`. Replace with API module calls:

```ts
// Before (mock):
import { mockMembers } from "@/lib/mockData";

// After (real API):
import { membersApi } from "@/lib/api";
const members = await membersApi.list();
```

Use React `useState` + `useEffect` (or React Query / SWR) for data fetching with loading states. `components/ui/Skeleton.tsx` provides `CardSkeleton`, `TableSkeleton`, `ProfileSkeleton` for loading states.

### 4. Auth token flow

After successful login from `authApi.login()`, store the returned JWT:

```ts
import { setStoredUser } from "@/lib/auth";
const { user, tokens } = await authApi.login(credentials);
setStoredUser(user);
localStorage.setItem("access_token", tokens.accessToken);
localStorage.setItem("refresh_token", tokens.refreshToken);
```

The Axios interceptor in `lib/api.ts` picks up `access_token` from localStorage automatically.

### 5. File uploads (Media)

Use the presigned URL flow already implemented in `lib/api.ts`:

```ts
const { uploadUrl, key } = await mediaApi.getUploadUrl(filename, contentType);
await fetch(uploadUrl, { method: "PUT", body: file });
await mediaApi.confirm(key, tags, eventId);
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | No | `/api/v1` | Backend API base URL |

---

## Available Scripts

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## Key Pages Quick Reference

| Route | Auth | Description |
|---|---|---|
| `/` | Public | Cinematic landing page |
| `/about` | Public | Mission, values, history |
| `/events` | Public | Event listing + RSVP |
| `/events/[id]` | Public | Event detail |
| `/gallery` | Public | Masonry gallery + lightbox |
| `/notices` | Public | Notices with accordion |
| `/login` | Public | Login (mock auth) |
| `/register` | Public | Membership application |
| `/dashboard` | Member | Member dashboard |
| `/profile` | Member | Profile view + edit |
| `/elections` | Member | Election status + vote CTA |
| `/elections/[id]/vote` | Member | Multi-step voting |
| `/ec` | EC Officer | EC management overview |
| `/ec/members` | EC Officer | Member approvals |
| `/ec/elections` | President/Secretary | Election phase control |
| `/ec/finance` | EC Officer | Budget + expenditure |
| `/ec/media` | EC Officer | Media upload + gallery |
| `/advisor` | Faculty Advisor | Read-only overview |
| `/admin` | System Admin | Full admin panel |

---

## Accessibility

- Semantic HTML throughout (nav, main, section, article, footer)
- `aria-label` on icon-only buttons
- Focus-trapped modals with Escape key close
- Color contrast meets WCAG 2.1 AA for all text on white/surface backgrounds
- Responsive from 320px mobile to 1440px+ desktop

---

*CSEDU Students' Club Portal — Term 8 · University of Dhaka*
