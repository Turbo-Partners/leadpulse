// Lead model
export interface Lead {
  id: string;
  companyname: string;
  contactname: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  value?: number;
  createddate: number;
  nextactivity?: string;
  jobtitle?: string;
  notes?: string;
  source_id?: string;
  responsible: string;
  user_id?: string; // Add user_id for data isolation
  owner_id?: string; // Add owner_id for lead ownership
  group_id?: string; // Add group_id for group association
  assigned_to?: string; // Add assigned_to for task assignment
}

// Cadence models
export interface CadenceStep {
  day: number;
  type: string;
  subject: string;
  completed: boolean;
  sentCount: number;
  responseCount: number;
}

export interface Cadence {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'paused';
  duration: number;
  steps: CadenceStep[];
}

// User model
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Activity Types
export type ActivityType = 'follow_up' | 'email' | 'meeting' | 'call' | 'task';