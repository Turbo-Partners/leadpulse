import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Check, Crown, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'trial' | 'monthly';
  price: number;
  extraction_limit: number;
  duration_days: number;
  features: string[];
}

const Register = () => {
  const [step, setStep] = useState(1); // 1: Plan selection, 2: Account creation
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setStep(2);
  };

  const createUserSubscription = async (userId: string) => {
    if (!selectedPlan) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + selectedPlan.duration_days);

    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: selectedPlan.id,
        status: 'active',
        expires_at: expiresAt.toISOString()
      });

    if (error) throw error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name);
      
      // Get the user after registration
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && selectedPlan) {
        await createUserSubscription(user.id);
      }

      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Falha ao criar conta. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="h-12 w-12 bg-blue-500 rounded-md flex items-center justify-center text-white text-xl font-bold">
                LP
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Escolha seu plano
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Comece gratuitamente ou escolha o plano mensal para recursos ilimitados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative p-8 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                  plan.type === 'free' 
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
                    : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                {plan.type === 'free' && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">
                    Recomendado
                  </div>
                )}

                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    plan.type === 'free' ? 'bg-green-100 dark:bg-green-800' : 'bg-blue-100 dark:bg-blue-800'
                  }`}>
                    {plan.type === 'free' ? (
                      <Check className={`w-8 h-8 ${plan.type === 'free' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                    ) : (
                      <Crown className={`w-8 h-8 ${plan.type === 'trial' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>

                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">Grátis</span>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          R$ {plan.price}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">/mês</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className={`text-sm font-medium ${
                      plan.type === 'free' ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'
                    }`}>
                      {plan.extraction_limit.toLocaleString()} extrações {plan.type === 'free' ? 'de degustação' : 'por mês'}
                    </div>

                    <ul className="space-y-3 text-left">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                            plan.type === 'free' ? 'text-green-500 dark:text-green-400' : 'text-blue-500 dark:text-blue-400'
                          }`} />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => handlePlanSelect(plan)}
                    fullWidth
                    className={
                      plan.type === 'free'
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700'
                    }
                  >
                    {plan.type === 'free' ? 'Começar Gratuitamente' : 'Escolher Plano Mensal'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              Já tem uma conta? Entre aqui
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 bg-blue-500 rounded-md flex items-center justify-center text-white text-xl font-bold">
              LP
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Crie sua conta
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Plano selecionado: <span className="font-medium text-blue-600 dark:text-blue-400">{selectedPlan?.name}</span>
            </p>
            <button
              onClick={() => setStep(1)}
              className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              Alterar plano
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Nome completo"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User size={18} className="text-gray-400 dark:text-gray-500" />}
              fullWidth
            />
            
            <Input
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} className="text-gray-400 dark:text-gray-500" />}
              fullWidth
            />

            <Input
              label="Senha"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} className="text-gray-400 dark:text-gray-500" />}
              fullWidth
              helperText="A senha deve ter pelo menos 6 caracteres"
            />

            <Input
              label="Confirmar senha"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={18} className="text-gray-400 dark:text-gray-500" />}
              fullWidth
            />

            <Button
              type="submit"
              isLoading={loading}
              fullWidth
              rightIcon={<ArrowRight size={16} />}
            >
              Criar conta
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              Já tem uma conta? Entre aqui
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;