export type PoultryType = 'poulet' | 'caille' | 'pigeon' | 'lapin' | null;

export interface Chicken {
  id: string;
  count: string | number;
  femaleCount?: string | number;
  breed?: string;
  arrivalDate?: string;
  startDate?: string;
  date?: string;
  status: 'active' | 'sold' | 'dead';
  poultryType?: PoultryType;
  updatedAt?: number;
}

export interface EggRecord {
  id: string;
  date: string;
  quantity: number;
  notes: string;
  poultryType?: PoultryType;
  poultryBreed?: string;
  updatedAt?: number;
}

export interface FeedEntry {
  id: string;
  date: string;
  type: 'achat' | 'utilisation';
  quantity: number;
  feedType: string;
  notes: string;
  poultryType?: PoultryType;
  poultryBreed?: string;
  updatedAt?: number;
}

export interface HealthRecord {
  id: string;
  date: string;
  type: 'Vaccin' | 'Traitement' | 'Prévention';
  title: string;
  target: string;
  status: 'Complété' | 'En attente';
  poultryType?: PoultryType;
  poultryBreed?: string;
  updatedAt?: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  batchId?: string;
  batchName?: string;
  updatedAt?: number;
}

export type UserRole = 'admin' | 'owner' | 'manager' | 'worker';

export interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  date: number;
  read: boolean;
  category: 'eggs' | 'feed' | 'health' | 'hatch' | 'finance';
  actionUrl?: string;
}
