import { createClient } from '@supabase/supabase-js';

// Supabase client (reusing existing credentials)
const supabaseUrl = 'https://sobtfbplbpvfqeubjxex.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvYnRmYnBsYnB2ZnFldWJqeGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDgzMDYsImV4cCI6MjA3NDcyNDMwNn0.ewfxDwlapmRpfyvYD3ALb-WyL12ty1eP8nzKyrc66ho';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Send OTP to email
 */
export async function sendOtp(email: string): Promise<{ error: string | null }> {
    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true, // Auto-register new users
            },
        });

        if (error) {
            console.error('Error sending OTP:', error);
            return { error: error.message };
        }

        return { error: null };
    } catch (err: any) {
        console.error('Unexpected error sending OTP:', err);
        return { error: err.message || 'Failed to send OTP' };
    }
}

/**
 * Verify OTP
 */
export async function verifyOtp(email: string, token: string): Promise<{ session: any; error: string | null }> {
    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });

        if (error) {
            console.error('Error verifying OTP:', error);
            return { session: null, error: error.message };
        }

        return { session: data.session, error: null };
    } catch (err: any) {
        console.error('Unexpected error verifying OTP:', err);
        return { session: null, error: err.message || 'Failed to verify OTP' };
    }
}

/**
 * Check if user is currently authenticated
 */
export async function getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/**
 * Sign out
 */
export async function signOut() {
    await supabase.auth.signOut();
}
