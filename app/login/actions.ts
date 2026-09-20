'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { getCurrentProfile } from '../../lib/auth';

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function login(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Vui lòng nhập đầy đủ email và mật khẩu.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { error: 'Email hoặc mật khẩu không chính xác.' };
  }

  // Check profile status
  const profileResult = await getCurrentProfile();

  if (profileResult.status === 'unauthorized') {
    redirect('/unauthorized');
  }

  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
