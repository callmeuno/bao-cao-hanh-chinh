export type UserRole = 'admin' | 'manager' | 'staff';

export interface DepartmentInfo {
  id: string;
  code: string;
  name: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  department_id: string | null;
  department: DepartmentInfo | null;
  created_at?: string;
  updated_at?: string;
}

export type ProfileResult =
  | {
      status: 'authenticated';
      profile: UserProfile;
    }
  | {
      status: 'unauthorized';
      reason: 'no_profile' | 'inactive';
      profile: null;
    }
  | {
      status: 'unauthenticated';
      profile: null;
    };
