import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader } from '../components/ui/Card';
import UserManagement from '../components/settings/UserManagement';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useUserRole } from '../hooks/useUserRole';
import { supabase } from '../lib/supabase';
import { Mail, User, Lock, Building, Users, Bell, Shield, Check, AlertCircle, Palette, Sun, Moon, Monitor } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { hasUserManagementAccess } = useUserRole();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    jobTitle: '',
    company: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    cnpj: '',
    phone: '',
    address: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    activityReminders: true,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.user_metadata?.name || '',
        email: user.email || '',
        jobTitle: user.user_metadata?.job_title || '',
        company: user.user_metadata?.company || '',
      });
    }
  }, [user]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: profileForm.email,
        data: {
          name: profileForm.name,
          job_title: profileForm.jobTitle,
          company: profileForm.company,
        }
      });

      if (error) throw error;

      showMessage('success', 'Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Error updating profile:', err);
      showMessage('error', 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'As senhas não coincidem.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      showMessage('success', 'Senha atualizada com sucesso!');
    } catch (err) {
      console.error('Error updating password:', err);
      showMessage('error', 'Erro ao atualizar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          company_name: companyForm.companyName,
          cnpj: companyForm.cnpj,
          company_phone: companyForm.phone,
          company_address: companyForm.address,
        }
      });

      if (error) throw error;

      showMessage('success', 'Informações da empresa atualizadas com sucesso!');
    } catch (err) {
      console.error('Error updating company info:', err);
      showMessage('error', 'Erro ao atualizar informações da empresa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          notification_settings: notificationSettings,
        }
      });

      if (error) throw error;

      showMessage('success', 'Preferências de notificação atualizadas com sucesso!');
    } catch (err) {
      console.error('Error updating notification settings:', err);
      showMessage('error', 'Erro ao atualizar preferências de notificação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    showMessage('success', `Tema ${newTheme === 'light' ? 'claro' : 'escuro'} aplicado com sucesso!`);
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'company', label: 'Empresa', icon: Building },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    ...(hasUserManagementAccess() ? [{ id: 'users', label: 'Usuários', icon: Users }] : []),
    // { id: 'notifications', label: 'Notificações', icon: Bell }, 
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie suas configurações de conta e preferências</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <Check size={20} className="mr-2" />
          ) : (
            <AlertCircle size={20} className="mr-2" />
          )}
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 flex-shrink-0">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                  >
                    <Icon 
                      size={18} 
                      className={`mr-3 ${
                        activeTab === tab.id ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                      }`} 
                    />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader title="Informações do Perfil" subtitle="Atualize suas informações pessoais" />
              
              <form className="mt-6 space-y-6" onSubmit={handleProfileSubmit}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    label="Nome completo"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    leftIcon={<User size={18} className="text-gray-400" />}
                    fullWidth
                    required
                  />
                  
                  <Input
                    label="Endereço de e-mail"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    leftIcon={<Mail size={18} className="text-gray-400" />}
                    fullWidth
                    required
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    label="Cargo"
                    name="jobTitle"
                    value={profileForm.jobTitle}
                    onChange={handleProfileChange}
                    fullWidth
                  />
                  
                  <Input
                    label="Empresa"
                    name="company"
                    value={profileForm.company}
                    onChange={handleProfileChange}
                    leftIcon={<Building size={18} className="text-gray-400" />}
                    fullWidth
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    isLoading={loading}
                    disabled={loading}
                  >
                    Salvar alterações
                  </Button>
                </div>
              </form>
            </Card>
          )}
          
          {activeTab === 'security' && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader title="Senha e Segurança" subtitle="Atualize sua senha e configurações de segurança" />
              
              <form className="mt-6 space-y-6" onSubmit={handlePasswordSubmit}>
                <Input
                  label="Senha atual"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  leftIcon={<Lock size={18} className="text-gray-400" />}
                  fullWidth
                  required
                />
                
                <Input
                  label="Nova senha"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  leftIcon={<Lock size={18} className="text-gray-400" />}
                  fullWidth
                  required
                  helperText="A senha deve ter pelo menos 6 caracteres"
                />
                
                <Input
                  label="Confirmar nova senha"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  leftIcon={<Lock size={18} className="text-gray-400" />}
                  fullWidth
                  required
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    isLoading={loading}
                    disabled={loading}
                  >
                    Atualizar senha
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'company' && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader title="Informações da Empresa" subtitle="Configure os dados da sua empresa" />
              
              <form className="mt-6 space-y-6" onSubmit={handleCompanySubmit}>
                <Input
                  label="Nome da empresa"
                  name="companyName"
                  value={companyForm.companyName}
                  onChange={handleCompanyChange}
                  leftIcon={<Building size={18} className="text-gray-400" />}
                  fullWidth
                />
                
                <Input
                  label="CNPJ"
                  name="cnpj"
                  value={companyForm.cnpj}
                  onChange={handleCompanyChange}
                  fullWidth
                />
                
                <Input
                  label="Telefone"
                  name="phone"
                  value={companyForm.phone}
                  onChange={handleCompanyChange}
                  fullWidth
                />
                
                <Input
                  label="Endereço"
                  name="address"
                  value={companyForm.address}
                  onChange={handleCompanyChange}
                  fullWidth
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    isLoading={loading}
                    disabled={loading}
                  >
                    Salvar informações
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader title="Aparência" subtitle="Personalize a aparência da interface" />
              
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Tema da Interface</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Escolha entre o tema claro ou escuro para personalizar sua experiência
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Light Theme Option */}
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        theme === 'light'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          <Sun size={20} />
                        </div>
                        <div className="text-left">
                          <h5 className="font-medium text-gray-900 dark:text-white">Tema Claro</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Interface clara e limpa</p>
                        </div>
                      </div>
                      {theme === 'light' && (
                        <div className="absolute top-2 right-2">
                          <Check size={16} className="text-blue-600" />
                        </div>
                      )}
                    </button>

                    {/* Dark Theme Option */}
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          theme === 'dark' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          <Moon size={20} />
                        </div>
                        <div className="text-left">
                          <h5 className="font-medium text-gray-900 dark:text-white">Tema Escuro</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Reduz o cansaço visual</p>
                        </div>
                      </div>
                      {theme === 'dark' && (
                        <div className="absolute top-2 right-2">
                          <Check size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Monitor size={16} />
                    <span>O tema será aplicado imediatamente e salvo automaticamente</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'users' && hasUserManagementAccess() && (
            <UserManagement />
          )}

          {/* {activeTab === 'notifications' && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader title="Preferências de Notificação" subtitle="Configure como você deseja receber notificações" />
              
              <form className="mt-6 space-y-6" onSubmit={handleNotificationSubmit}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notificações por e-mail</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receba atualizações importantes por e-mail</p>
                    </div>
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notificações push</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receba notificações no navegador</p>
                    </div>
                    <input
                      type="checkbox"
                      name="pushNotifications"
                      checked={notificationSettings.pushNotifications}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Lembretes de atividades</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Seja notificado sobre atividades pendentes</p>
                    </div>
                    <input
                      type="checkbox"
                      name="activityReminders"
                      checked={notificationSettings.activityReminders}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    isLoading={loading}
                    disabled={loading}
                  >
                    Salvar preferências
                  </Button>
                </div>
              </form>
            </Card>
          )} */} 
        </div>
      </div>
    </div>
  );
};

export default Settings;