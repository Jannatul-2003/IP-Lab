import { Member, Event, Notice, Election, Budget, MediaItem, Expenditure } from "@/types";

export const mockMembers: Member[] = [
  {
    id: "m1",
    userId: "u1",
    studentId: "21-46521",
    fullName: "Jannatul Ferdousi",
    batchYear: 2021,
    phone: "01711000001",
    status: "ACTIVE",
    joinedDate: "2022-01-15",
    createdAt: "2022-01-10T00:00:00Z",
  },
  {
    id: "m2",
    userId: "u2",
    studentId: "21-46534",
    fullName: "Md Saif Mahamud",
    batchYear: 2021,
    phone: "01711000002",
    status: "ACTIVE",
    joinedDate: "2022-01-15",
    createdAt: "2022-01-10T00:00:00Z",
  },
  {
    id: "m3",
    userId: "u3",
    studentId: "21-46558",
    fullName: "Rezaunnabi Ruhan",
    batchYear: 2021,
    phone: "01711000003",
    status: "ACTIVE",
    joinedDate: "2022-01-15",
    createdAt: "2022-01-10T00:00:00Z",
  },
  {
    id: "m4",
    userId: "u4",
    studentId: "21-46562",
    fullName: "Mohammad Sajid Al Rafi Hasan",
    batchYear: 2021,
    phone: "01711000004",
    status: "PENDING",
    createdAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "m5",
    userId: "u5",
    studentId: "22-47001",
    fullName: "Fatema Akter",
    batchYear: 2022,
    status: "ACTIVE",
    joinedDate: "2023-02-10",
    createdAt: "2023-02-05T00:00:00Z",
  },
];

export const mockEvents: Event[] = [
  {
    id: "e1",
    title: "Annual Programming Contest 2026",
    eventType: "general",
    eventDate: "2026-05-15T10:00:00Z",
    venue: "CSEDU Seminar Room",
    capacity: 100,
    rsvpDeadline: "2026-05-10T23:59:00Z",
    description:
      "The annual intra-departmental programming contest. Open to all CSEDU students. Compete in teams of 2-3 members.",
    status: "PUBLISHED",
    createdAt: "2026-04-01T00:00:00Z",
    rsvpCount: 67,
    userRsvp: false,
  },
  {
    id: "e2",
    title: "Tech Talk: Machine Learning in Production",
    eventType: "seminar",
    eventDate: "2026-04-30T14:00:00Z",
    venue: "Room 301, CSEDU Building",
    capacity: 60,
    rsvpDeadline: "2026-04-28T23:59:00Z",
    description:
      "Industry experts discuss real-world ML deployment challenges, MLOps pipelines, and model monitoring.",
    status: "PUBLISHED",
    createdAt: "2026-04-10T00:00:00Z",
    rsvpCount: 55,
    userRsvp: true,
  },
  {
    id: "e3",
    title: "Web Dev Workshop: Next.js 14",
    eventType: "workshop",
    eventDate: "2026-05-05T09:00:00Z",
    venue: "Lab 205, CSEDU",
    capacity: 40,
    rsvpDeadline: "2026-05-03T23:59:00Z",
    description:
      "Hands-on workshop covering Next.js 14 App Router, Server Components, and full-stack deployment.",
    status: "PUBLISHED",
    createdAt: "2026-04-15T00:00:00Z",
    rsvpCount: 40,
    userRsvp: false,
  },
  {
    id: "e4",
    title: "CSE Sports Carnival 2026",
    eventType: "carnival",
    eventDate: "2026-06-01T08:00:00Z",
    venue: "DU Sports Complex",
    capacity: 200,
    rsvpDeadline: "2026-05-28T23:59:00Z",
    description:
      "Annual sports carnival featuring cricket, football, badminton, and indoor games.",
    status: "PUBLISHED",
    createdAt: "2026-04-20T00:00:00Z",
    rsvpCount: 120,
    userRsvp: false,
  },
];

export const mockNotices: Notice[] = [
  {
    id: "n1",
    title: "Executive Committee Election 2026 — Announcement",
    content:
      "The CSEDU Students' Club is pleased to announce the commencement of the EC Election 2026. Phase 1 voting will begin on May 1, 2026. All active members are eligible to vote. Candidate registration is open until April 28, 2026.",
    noticeType: "Election",
    authorRole: "SECRETARY",
    publishedAt: "2026-04-20T10:00:00Z",
  },
  {
    id: "n2",
    title: "Annual Programming Contest — Registration Open",
    content:
      "Registration for the Annual Programming Contest 2026 is now open. Teams of 2-3 members can register through the Events section. Last date: May 10, 2026.",
    noticeType: "General",
    authorRole: "EC_OFFICER",
    publishedAt: "2026-04-18T09:00:00Z",
  },
  {
    id: "n3",
    title: "Membership Fee for Term 8 — Due Date",
    content:
      "Members are reminded that the membership fee for Term 8 (2026) is due by April 30, 2026. Please contact the Treasurer for payment. Late payments will incur a processing fee.",
    noticeType: "Policy",
    authorRole: "PRESIDENT",
    publishedAt: "2026-04-15T14:00:00Z",
  },
  {
    id: "n4",
    title: "Club Constitution Update — Ratified",
    content:
      "The updated CSEDU Students' Club Constitution has been ratified by the General Assembly. Key changes include updated election procedures and expanded volunteer roles. A copy is available at the club office.",
    noticeType: "Policy",
    authorRole: "PRESIDENT",
    publishedAt: "2026-04-10T11:00:00Z",
  },
];

export const mockElection: Election = {
  id: "el1",
  termId: "t8",
  phase1Start: "2026-05-01T00:00:00Z",
  phase1End: "2026-05-07T23:59:00Z",
  phase2Start: "2026-05-10T00:00:00Z",
  phase2End: "2026-05-14T23:59:00Z",
  shortlistN: 3,
  status: "PHASE1_OPEN",
};

export const mockBudgets: Budget[] = [
  {
    id: "b1",
    termId: "t8",
    totalAmountBdt: 150000,
    status: "approved",
  },
  {
    id: "b2",
    termId: "t8",
    eventId: "e1",
    totalAmountBdt: 25000,
    status: "approved",
  },
  {
    id: "b3",
    termId: "t8",
    eventId: "e2",
    totalAmountBdt: 10000,
    status: "pending",
  },
];

export const mockExpenditures: Expenditure[] = [
  {
    id: "ex1",
    budgetId: "b1",
    amountBdt: 5000,
    category: "Stationery",
    description: "Office supplies for term",
    expenseDate: "2026-04-05",
    createdAt: "2026-04-05T00:00:00Z",
  },
  {
    id: "ex2",
    budgetId: "b2",
    amountBdt: 12000,
    category: "Refreshments",
    description: "Food and beverages for contest",
    expenseDate: "2026-04-12",
    createdAt: "2026-04-12T00:00:00Z",
  },
  {
    id: "ex3",
    budgetId: "b1",
    amountBdt: 8500,
    category: "Printing",
    description: "Banners and certificates",
    expenseDate: "2026-04-18",
    createdAt: "2026-04-18T00:00:00Z",
  },
];

export const mockGallery: MediaItem[] = [
  {
    id: "img1",
    url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
    mediaType: "image",
    tags: ["seminar", "2025"],
    eventId: "e2",
    createdAt: "2026-03-15T00:00:00Z",
  },
  {
    id: "img2",
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800",
    mediaType: "image",
    tags: ["workshop", "2025"],
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "img3",
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    mediaType: "image",
    tags: ["carnival", "sports"],
    createdAt: "2026-02-20T00:00:00Z",
  },
  {
    id: "img4",
    url: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=800",
    mediaType: "image",
    tags: ["programming", "contest"],
    createdAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "img5",
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
    mediaType: "image",
    tags: ["teamwork"],
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "img6",
    url: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800",
    mediaType: "image",
    tags: ["meeting", "ec"],
    createdAt: "2026-01-10T00:00:00Z",
  },
];

export const mockStats = {
  totalMembers: 312,
  activeEvents: 4,
  totalEvents: 48,
  currentTerm: 8,
  completedElections: 7,
};
