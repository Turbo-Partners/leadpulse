import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../components/dashboard/MetricCard';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Users, Target, Calendar, Phone, DollarSign, ChevronRight, BarChart, Clock, Mail, MessageSquare, Crown, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Activity {
  id: string;
  type: string;
  title: string;
  scheduled_for: string;
  lead: {
    companyname: string;
  };
}

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    newLeadsThisWeek: 0,
    totalValue: 0,
    leadsByStage: {} as Record<string, number>,
    responseRate: 0,
    meetings: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMetrics();
      fetchRecentActivities();
      fetchUserSubscription();
      fetchMonthlyUsage();
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
    }
  };

  const fetchMonthlyUsage = async () => {
    if (!user) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    try {
      const { data, error } = await supabase
        .from('scraping_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('month', startOfMonth.toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setMonthlyUsage(data[0].count ?? 0);
      } else {
        setMonthlyUsage(0);
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
      setMonthlyUsage(0);
    }
  };

  const fetchMetrics = async () => {
    if (!user) return;

    try {
      // Fetch user's leads only
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

      // Calculate metrics
      const totalLeads = leads?.length || 0;
      const newLeadsThisWeek = leads?.filter(lead => lead.createddate > weekAgo).length || 0;
      const totalValue = leads?.reduce((acc, lead) => acc + (lead.value || 0), 0) || 0;
      
      // Calculate leads by stage
      const leadsByStage = leads?.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Fetch user's activities for meetings count
      const { data: activities } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('created_by', user.id)
        .eq('type', 'meeting')
        .gte('scheduled_for', new Date(weekAgo).toISOString());

      setMetrics({
        totalLeads,
        newLeadsThisWeek,
        totalValue,
        leadsByStage,
        responseRate: 35, // This would need to be calculated based on actual response data
        meetings: activities?.length || 0
      });

    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select(`
          id,
          type,
          title,
          scheduled_for,
          lead:leads(companyname)
        `)
        .eq('created_by', user.id)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(5);

      if (error) throw error;

      setRecentActivities(data || []);
    } catch (err) {
      console.error('Error fetching recent activities:', err);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail size={16} className="text-blue-500" />;
      case 'call':
        return <Phone size={16} className="text-green-500" />;
      case 'meeting':
        return <Calendar size={16} className="text-purple-500" />;
      case 'follow_up':
        return <Clock size={16} className="text-orange-500" />;
      default:
        return <MessageSquare size={16} className="text-gray-500" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
  
  const stages = {
    leads: 'Leads',
    prospected: 'Prospectado',
    contacted: 'Em Conversa',
    proposal: 'Proposta',
    closed: 'Fechado',
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel</h1>
        <p className="text-gray-500">Bem-vindo de volta! Aqui está o que está acontecendo com seus leads.</p>
      </div>

      {/* Subscription Status Alert */}
      {!userSubscription && (
        <Card className="p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Nenhuma assinatura ativa
              </h3>
              <p className="text-sm text-red-700">
                Você precisa de uma assinatura para usar todas as funcionalidades.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/register')}
              className="bg-red-600 hover:bg-red-700"
            >
              Ver Planos
            </Button>
          </div>
        </Card>
      )}

      <div className="grid-dashboard">
        <MetricCard 
          title="Total de Leads" 
          value={metrics.totalLeads} 
          icon={<Users size={20} className="text-blue-600" />}
          change={15}
          changePeriod="vs semana anterior"
        /> 
        <MetricCard 
          title="Valor do Pipeline" 
          value={`R$ ${metrics.totalValue.toLocaleString()}`} 
          icon={<DollarSign size={20} className="text-amber-600" />}
          change={22}
          changePeriod="vs semana anterior"
        />
        {userSubscription && (
          <MetricCard 
            title="Extrações Usadas" 
            value={`${monthlyUsage}/${userSubscription.subscription_plans.extraction_limit}`} 
            icon={<Target size={20} className="text-green-600" />}
            className="border-l-4 border-blue-500"
          />
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Saúde do Pipeline" subtitle="Leads atuais por estágio" />
          <div className="mt-4">
            <div className="space-y-4">
              {Object.entries(stages).map(([key, label]) => {
                const count = metrics.leadsByStage[key] || 0;
                const percentage = metrics.totalLeads > 0 ? (count / metrics.totalLeads) * 100 : 0;
                
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span className="text-gray-500">{count} leads</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Atividades Recentes</h3>
              <p className="text-sm text-gray-500">Próximas 5 atividades</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              <>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.lead?.companyname}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(activity.scheduled_for)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/activities')}
                    rightIcon={<ChevronRight size={16} />}
                  >
                    Ver todas
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Nenhuma atividade agendada
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;