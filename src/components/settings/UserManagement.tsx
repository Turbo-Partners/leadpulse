import React, { useState, useEffect } from 'react';
import { Search, Plus, Mail, User, Crown, Users, Trash2, Edit2, Check, X, AlertCircle, UserPlus, Lock, Eye, EyeOff } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  admin_user_id: string;
  created_at: string;
  updated_at: string;
}

interface GroupCollaborator {
  id: string;
  group_id: string;
  user_id?: string;
  email: string;
  role: 'admin' | 'collaborator';
  status: 'pending' | 'active' | 'inactive';
  invited_by: string;
  invited_at: string;
  joined_at?: string;
  user?: {
    id: string;
    email: string;
    user_metadata: {
      name?: string;
    };
  };
}

const UserManagement = () => {
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [collaborators, setCollaborators] = useState<GroupCollaborator[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'collaborator' as 'admin' | 'collaborator'
  });
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchCollaborators(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchUserGroups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_groups')
        .select('*')
        .eq('admin_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserGroups(data || []);
      
      // Select first group by default
      if (data && data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0]);
      }
    } catch (err) {
      console.error('Error fetching user groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborators = async (groupId: string) => {
    try {
      const { data: collaboratorsData, error: collaboratorsError } = await supabase
        .from('group_collaborators')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (collaboratorsError) throw collaboratorsError;

      setCollaborators(collaboratorsData || []);
    } catch (err) {
      console.error('Error fetching collaborators:', err);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setUserForm(prev => ({ ...prev, password }));
  };

  const handleCreateUser = async () => {
    if (!selectedGroup || !userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim() || !user) return;

    setIsCreatingUser(true);

    try {
      // Check if user already exists in the group using maybeSingle()
      const { data: existingCollaborator, error: checkError } = await supabase
        .from('group_collaborators')
        .select('id')
        .eq('group_id', selectedGroup.id)
        .eq('email', userForm.email.trim().toLowerCase())
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingCollaborator) {
        alert('Este usuário já faz parte deste grupo.');
        setIsCreatingUser(false);
        return;
      }

      // Get the current session to include the auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Call the edge function to create the user
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userForm.email.trim().toLowerCase(),
          password: userForm.password,
          name: userForm.name.trim(),
          groupId: selectedGroup.id,
          role: userForm.role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar usuário');
      }

      const result = await response.json();

      // Fetch updated collaborators list
      await fetchCollaborators(selectedGroup.id);
      setUserForm({ name: '', email: '', password: '', role: 'collaborator' });
      setShowAddUserModal(false);

      alert(`Usuário criado com sucesso!\n\nCredenciais:\nE-mail: ${userForm.email}\nSenha: ${userForm.password}\n\nCompartilhe essas informações com o usuário.`);
    } catch (err) {
      console.error('Error creating user:', err);
      alert(`Erro ao criar usuário: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupForm.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('user_groups')
        .insert({
          name: groupForm.name.trim(),
          description: groupForm.description.trim() || null,
          admin_user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setUserGroups([data, ...userGroups]);
      setGroupForm({ name: '', description: '' });
      setShowGroupModal(false);
      
      if (!selectedGroup) {
        setSelectedGroup(data);
      }
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !groupForm.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('user_groups')
        .update({
          name: groupForm.name.trim(),
          description: groupForm.description.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingGroup.id)
        .eq('admin_user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      setUserGroups(userGroups.map(group => 
        group.id === editingGroup.id ? data : group
      ));
      
      if (selectedGroup?.id === editingGroup.id) {
        setSelectedGroup(data);
      }

      setEditingGroup(null);
      setGroupForm({ name: '', description: '' });
      setShowGroupModal(false);
    } catch (err) {
      console.error('Error updating group:', err);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return;

    const confirmDelete = window.confirm('Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', groupId)
        .eq('admin_user_id', user.id);

      if (error) throw error;

      setUserGroups(userGroups.filter(group => group.id !== groupId));
      
      if (selectedGroup?.id === groupId) {
        const remainingGroups = userGroups.filter(group => group.id !== groupId);
        setSelectedGroup(remainingGroups.length > 0 ? remainingGroups[0] : null);
      }
    } catch (err) {
      console.error('Error deleting group:', err);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    const confirmRemove = window.confirm('Tem certeza que deseja remover este colaborador?');
    if (!confirmRemove) return;

    try {
      const { error } = await supabase
        .from('group_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      setCollaborators(collaborators.filter(collab => collab.id !== collaboratorId));
    } catch (err) {
      console.error('Error removing collaborator:', err);
    }
  };

  const handleUpdateCollaboratorRole = async (collaboratorId: string, newRole: 'admin' | 'collaborator') => {
    try {
      const { data, error } = await supabase
        .from('group_collaborators')
        .update({ role: newRole })
        .eq('id', collaboratorId)
        .select()
        .single();

      if (error) throw error;

      // Fetch updated collaborators list
      if (selectedGroup) {
        await fetchCollaborators(selectedGroup.id);
      }
    } catch (err) {
      console.error('Error updating collaborator role:', err);
    }
  };

  const openEditGroup = (group: UserGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || ''
    });
    setShowGroupModal(true);
  };

  const openNewGroup = () => {
    setEditingGroup(null);
    setGroupForm({ name: '', description: '' });
    setShowGroupModal(true);
  };

  const openAddUser = () => {
    setUserForm({ name: '', email: '', password: '', role: 'collaborator' });
    setShowPassword(false);
    setShowAddUserModal(true);
  };

  const filteredCollaborators = collaborators.filter(collaborator =>
    collaborator.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collaborator.user?.user_metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Ativo</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      case 'inactive':
        return <Badge variant="default">Inativo</Badge>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger">Administrador</Badge>;
      case 'collaborator':
        return <Badge variant="info">Colaborador</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gerenciamento de Usuários</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie grupos e colaboradores da sua organização
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={openNewGroup}
            leftIcon={<Plus size={16} />}
          >
            Novo Grupo
          </Button>
          {selectedGroup && (
            <Button
              onClick={openAddUser}
              leftIcon={<UserPlus size={16} />}
            >
              Adicionar Usuário
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Groups Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Grupos</h3>
            
            <div className="space-y-2">
              {userGroups.map((group) => (
                <div
                  key={group.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedGroup?.id === group.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {group.name}
                      </p>
                      {group.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditGroup(group);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit2 size={14} />
                      </button>
                      {userGroups.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {userGroups.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Nenhum grupo encontrado
                </p>
                <Button
                  size="sm"
                  onClick={openNewGroup}
                  className="mt-3"
                  leftIcon={<Plus size={16} />}
                >
                  Criar Primeiro Grupo
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Collaborators List */}
        <div className="lg:col-span-3">
          {selectedGroup ? (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Colaboradores - {selectedGroup.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {collaborators.length} colaboradores
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Input
                    placeholder="Buscar colaboradores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search size={16} className="text-gray-400" />}
                    className="w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Função
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Adicionado em
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCollaborators.map((collaborator) => (
                      <tr key={collaborator.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar 
                              name={collaborator.user?.user_metadata?.name || collaborator.email}
                              size="sm"
                              className="mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {collaborator.user?.user_metadata?.name || 'Usuário'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {collaborator.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getRoleBadge(collaborator.role)}
                            {collaborator.role === 'collaborator' && (
                              <button
                                onClick={() => handleUpdateCollaboratorRole(collaborator.id, 'admin')}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                title="Promover para Admin"
                              >
                                <Crown size={14} />
                              </button>
                            )}
                            {collaborator.role === 'admin' && (
                              <button
                                onClick={() => handleUpdateCollaboratorRole(collaborator.id, 'collaborator')}
                                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                                title="Rebaixar para Colaborador"
                              >
                                <User size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(collaborator.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(collaborator.invited_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredCollaborators.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      Nenhum colaborador encontrado
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'Tente ajustar o termo de busca' : 'Comece adicionando colaboradores para este grupo'}
                    </p>
                    {!searchQuery && (
                      <Button
                        size="sm"
                        onClick={openAddUser}
                        className="mt-3"
                        leftIcon={<UserPlus size={16} />}
                      >
                        Adicionar Primeiro Colaborador
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <Users className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Selecione um grupo
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Escolha um grupo na barra lateral para gerenciar seus colaboradores
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowAddUserModal(false)}></div>
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Adicionar Usuário
                </h3>
                <button 
                  onClick={() => setShowAddUserModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <Input
                  label="Nome Completo"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: João Silva"
                  leftIcon={<User size={18} className="text-gray-400" />}
                  fullWidth
                  required
                />

                <Input
                  label="E-mail"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@exemplo.com"
                  leftIcon={<Mail size={18} className="text-gray-400" />}
                  fullWidth
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Digite uma senha segura"
                      className="w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="px-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Mínimo 6 caracteres
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={generatePassword}
                      className="text-xs"
                    >
                      Gerar Senha
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Função
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'collaborator' }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="collaborator">Colaborador</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {userForm.role === 'admin' 
                      ? 'Administradores podem gerenciar usuários e ter acesso total'
                      : 'Colaboradores têm acesso total exceto gerenciamento de usuários'
                    }
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium">Importante:</p>
                      <p>Anote as credenciais de acesso para compartilhar com o usuário após a criação da conta.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim() || isCreatingUser}
                  isLoading={isCreatingUser}
                  leftIcon={<UserPlus size={16} />}
                >
                  Criar Usuário
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowGroupModal(false)}></div>
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
                </h3>
                <button 
                  onClick={() => setShowGroupModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <Input
                  label="Nome do Grupo"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Equipe de Vendas"
                  leftIcon={<Users size={18} className="text-gray-400" />}
                  fullWidth
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o propósito deste grupo..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowGroupModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                  disabled={!groupForm.name.trim()}
                  leftIcon={editingGroup ? <Edit2 size={16} /> : <Plus size={16} />}
                >
                  {editingGroup ? 'Salvar' : 'Criar Grupo'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;