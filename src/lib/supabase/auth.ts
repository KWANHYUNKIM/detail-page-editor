import { createClient } from './client';

const supabase = () => createClient();

export async function signUp(email: string, password: string, displayName?: string) {
  const { data, error } = await supabase().auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName ?? email },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase().auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase().auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data: { user } } = await supabase().auth.getUser();
  return user;
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase().auth.onAuthStateChange(callback);
}
