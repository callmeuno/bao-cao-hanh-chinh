import { createClient } from './supabase/server';
import type { ProfileResult, UserProfile, DepartmentInfo, UserRole } from '../types/auth';

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    return null;
  }
}

export async function getCurrentProfile(): Promise<ProfileResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { status: 'unauthenticated', profile: null };
  }

  try {
    const supabase = await createClient();

    // Use maybeSingle() so missing rows return data: null instead of an error
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        is_active,
        department_id,
        departments (
          id,
          code,
          name
        )
      `)
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile from public.profiles:', error.message);
      return {
        status: 'unauthorized',
        reason: 'no_profile',
        profile: null,
      };
    }

    if (!data) {
      return {
        status: 'unauthorized',
        reason: 'no_profile',
        profile: null,
      };
    }

    if (!data.is_active) {
      return {
        status: 'unauthorized',
        reason: 'inactive',
        profile: null,
      };
    }

    const deptRaw = data.departments as unknown;
    let department: DepartmentInfo | null = null;

    if (deptRaw && typeof deptRaw === 'object') {
      if (Array.isArray(deptRaw)) {
        department = (deptRaw[0] as DepartmentInfo) ?? null;
      } else {
        department = deptRaw as DepartmentInfo;
      }
    }

    const profile: UserProfile = {
      id: data.id,
      full_name: data.full_name,
      role: data.role as UserRole,
      is_active: data.is_active,
      department_id: data.department_id,
      department,
    };

    return {
      status: 'authenticated',
      profile,
    };
  } catch (err) {
    console.error('Unexpected error in getCurrentProfile:', err);
    return {
      status: 'unauthorized',
      reason: 'no_profile',
      profile: null,
    };
  }
}
