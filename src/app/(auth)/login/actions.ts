'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function loginAction(
  email: string,
  password: string,
  callbackUrl: string,
): Promise<{ error: string } | undefined> {
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: callbackUrl,
    })
    // signIn throws NEXT_REDIRECT on success — code below never runs
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Invalid email or password. Please try again.' }
    }
    // Re-throw redirect — Next.js handles it
    throw error
  }
}
