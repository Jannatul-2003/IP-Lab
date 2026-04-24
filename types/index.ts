export type UserRole =
  | "GUEST"
  | "MEMBER"
  | "VOLUNTEER"
  | "EC_OFFICER"
  | "PRESIDENT"
  | "SECRETARY"
  | "FACULTY_ADVISOR"
  | "SYSTEM_ADMIN";

export type MemberStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
export type ElectionStatus =
  | "DRAFT"
  | "PHASE1_OPEN"
  | "PHASE1_CLOSED"
  | "SHORTLISTING"
  | "PHASE2_OPEN"
  | "COMPLETED";
export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "RSVP_CLOSED"
  | "COMPLETED"
  | "CANCELLED";
export type NoticeType =
  | "General"
  | "Policy"
  | "Membership"
  | "Election"
  | "Event";
export type BudgetStatus = "pending" | "approved" | "rejected";
export type Language = "en" | "bn";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  ecRole?: string | null;
}

export interface Member {
  id: string;
  userId: string;
  studentId: string;
  fullName: string;
  batchYear: number;
  phone?: string;
  status: MemberStatus;
  joinedDate?: string;
  createdAt: string;
  user?: User;
}

export interface CommitteeTerm {
  id: string;
  termNumber: number;
  startDate: string;
  endDate?: string;
  status: "active" | "archived";
}

export interface EcRoleHolder {
  id: string;
  termId: string;
  memberId: string;
  roleTitle: string;
  assignedDate: string;
  member?: Member;
}

export interface Election {
  id: string;
  termId: string;
  phase1Start: string;
  phase1End: string;
  phase2Start?: string;
  phase2End?: string;
  shortlistN: number;
  status: ElectionStatus;
  term?: CommitteeTerm;
}

export interface Candidate {
  id: string;
  electionId: string;
  memberId: string;
  position: string;
  phase1Votes: number;
  phase2Votes: number;
  shortlisted: boolean;
  winner: boolean;
  member?: Member;
}

export interface Vote {
  id: string;
  electionId: string;
  phase: "phase1" | "phase2";
  candidateId: string;
  position: string;
  castAt: string;
}

export interface Event {
  id: string;
  title: string;
  eventType: "workshop" | "seminar" | "carnival" | "sports" | "general";
  eventDate: string;
  venue?: string;
  capacity: number;
  rsvpDeadline?: string;
  description?: string;
  status: EventStatus;
  organizerId?: string;
  createdAt: string;
  rsvpCount?: number;
  userRsvp?: boolean;
}

export interface Rsvp {
  id: string;
  eventId: string;
  memberId: string;
  status: "active" | "cancelled";
  createdAt: string;
}

export interface VolunteerRole {
  id: string;
  eventId: string;
  roleName: string;
  description?: string;
  assignedMemberId?: string;
  status: "open" | "filled";
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  noticeType: NoticeType;
  authorId?: string;
  authorRole?: string;
  publishedAt: string;
}

export interface Budget {
  id: string;
  termId: string;
  eventId?: string;
  totalAmountBdt: number;
  approvedBy?: string;
  status: BudgetStatus;
}

export interface Expenditure {
  id: string;
  budgetId: string;
  amountBdt: number;
  category?: string;
  description?: string;
  expenseDate: string;
  addedBy?: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  url: string;
  mediaType: "image" | "pdf";
  tags?: string[];
  eventId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  loggedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MembershipApplication {
  studentId: string;
  fullName: string;
  batchYear: number;
  phone?: string;
  email: string;
  password: string;
  constitutionAcknowledged: boolean;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export interface NavItem {
  label: string;
  href: string;
  roles?: UserRole[];
  children?: NavItem[];
}
