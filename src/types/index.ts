// No imports needed for plain interfaces
export type UserRole = "entrepreneur" | "investor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  location?: string;
  isOnline?: boolean;
  walletBalance?: number;
  isTwoFactorEnabled?: boolean;
  createdAt: string;

  // Entrepreneur fields
  startupName?: string;
  pitchSummary?: string;
  fundingNeeded?: string;
  industry?: string;
  foundedYear?: number;
  teamSize?: number;

  // Investor fields
  investmentInterests?: string[];
  investmentStage?: string[];
  portfolioCompanies?: string[];
  totalInvestments?: number;
  minimumInvestment?: string;
  maximumInvestment?: string;
}

export interface Entrepreneur extends User {
  role: "entrepreneur";
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: "investor";
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  partner?: {
    id: string;
    name: string;
    avatarUrl: string;
    isOnline: boolean;
  };
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  partner?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    role: string;
    isOnline?: boolean;
  };
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  investorId: string;
  entrepreneurId: string;
  startTime: string;
  endTime: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  location?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | "message"
    | "collaboration_request"
    | "collaboration_accepted"
    | "meeting_scheduled"
    | "meeting_status";
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: string;
  content: string;
  shared: boolean;
  createdAt: string;
}

export interface Deal {
  id: string;
  investorId: string;
  entrepreneurId: string;
  amount: string;
  equity: string;
  status: "Due Diligence" | "Term Sheet" | "Negotiation" | "Closed" | "Passed";
  stage: string;
  notes?: string;
  createdAt: string;
  lastActivity: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "deposit" | "withdraw" | "transfer";
  amount: number;
  status: "pending" | "completed" | "failed";
  description: string;
  recipientId?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<{ requires2FA?: boolean; tempToken?: string } | void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  setup2FA: () => Promise<void>;
  enable2FA: (otp: string) => Promise<void>;
  disable2FA: () => Promise<void>;
  validate2FALogin: (tempToken: string, otp: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}
