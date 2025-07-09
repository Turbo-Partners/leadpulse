import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Falha ao fazer login. Verifique suas credenciais.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 bg-blue-500 rounded-md flex items-center justify-center text-white text-xl font-bold">
              LP
            </div>
          </div>
          
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Entrar no LeadPulse
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Gerencie seus leads e aumente suas conversões
          </p>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
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
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                  Esqueceu sua senha?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              fullWidth
              rightIcon={<ArrowRight size={16} />}
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/register" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              Criar uma conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;