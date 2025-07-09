import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
      
      // Handle plan selection from URL (for OAuth redirects)
      if (session?.user) {
        handlePlanFromUrl(session.user.id);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
      
      // Handle plan selection from URL (for OAuth redirects)
      if (session?.user) {
        handlePlanFromUrl(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePlanFromUrl = async (userId: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plan');
    
    if (planId) {
      try {
        // Check if user already has an active subscription
        const { data: existingSubscription } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .limit(1);

        if (!existingSubscription || existingSubscription.length === 0) {
          // Get plan details
          const { data: plan } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', planId)
            .single();

          if (plan) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

            await supabase
              .from('user_subscriptions')
              .insert({
                user_id: userId,
                plan_id: planId,
                status: 'active',
                expires_at: expiresAt.toISOString()
              });
          }
        }

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error handling plan from URL:', error);
      }
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const register = async (email: string, password: string, name: string) => {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });
    if (signUpError) throw signUpError;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};