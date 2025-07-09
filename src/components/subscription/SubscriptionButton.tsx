import React, { useState, useEffect } from 'react';
import { Crown, Clock, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  expires_at: string;
  subscription_plans: {
    name: string;
    type: string;
    extraction_limit: number;
  };
}

const SubscriptionButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserSubscription();
    }
  }, [user]);

  const fetchUserSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            type,
            extraction_limit
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const subscription = data[0];
        
        // Check if subscription is expired
        if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
          await supabase
            .from('user_subscriptions')
            .update({ status: 'expired' })
            .eq('id', subscription.id);
          
          setUserSubscription(null);
        } else {
          setUserSubscription(subscription);
        }
      } else {
        setUserSubscription(null);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setUserSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = () => {
    if (!userSubscription?.expires_at) return null;
    const expiryDate = new Date(userSubscription.expires_at);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isTrialExpiringSoon = () => {
    if (!userSubscription || userSubscription.subscription_plans.type !== 'free') return false;
    const daysLeft = getDaysUntilExpiry();
    return daysLeft !== null && daysLeft <= 2;
  };

  const handleUpgrade = () => {
    navigate('/register');
  };

  if (loading) return null;

  // No subscription - show upgrade button
  if (!userSubscription) {
    return (
      <Button
        size="sm"
        onClick={handleUpgrade}
        leftIcon={<Crown size={16} />}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        Assinar
      </Button>
    );
  }

  // Free subscription
  if (userSubscription.subscription_plans.type === 'free') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleUpgrade}
        leftIcon={<Crown size={16} />}
        className="border-green-300 text-green-700 hover:bg-green-50"
      >
        Plano Gratuito
      </Button>
    );
  }

  // Monthly subscription - show status
  return (
    <div className="flex items-center space-x-2 text-sm">
      <Crown size={16} className="text-blue-600" />
      <span className="text-gray-700 font-medium">Plano Mensal</span>
    </div>
  );
};

export default SubscriptionButton;