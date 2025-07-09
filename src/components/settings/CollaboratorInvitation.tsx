import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, X, Users, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const CollaboratorInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const inviteId = searchParams.get('invite');
  const token = searchParams.get('token');

  useEffect(() => {
    if (inviteId && user) {
      fetchInvitation();
    }
  }, [inviteId, user]);

  const fetchInvitation = async () => {
    if (!inviteId || !user) return;

    try {
      const { data, error } = await supabase
        .from('group_collaborators')
        .select(`
          *,
          user_groups!inner(name, description)
        `)
        .eq('id', inviteId)
        .eq('email', user.email)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError('Convite não encontrado ou já foi processado.');
      } else {
        setInvitation(data);
      }
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError('Erro ao buscar convite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from('group_collaborators')
        .update({
          user_id: user.id,
          status: 'active',
          joined_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (error) throw error;

      // Redirect to dashboard with success message
      navigate('/', { 
        state: { 
          message: `Você agora faz parte do grupo "${invitation.user_groups.name}"!`,
          type: 'success'
        }
      });
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Erro ao aceitar convite. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!invitation) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from('group_collaborators')
        .update({ status: 'inactive' })
        .eq('id', invitation.id);

      if (error) throw error;

      // Redirect to dashboard
      navigate('/', { 
        state: { 
          message: 'Convite recusado.',
          type: 'info'
        }
      });
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError('Erro ao recusar convite. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Convite Inválido
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Este convite não é válido ou já foi processado.'}
          </p>
          <Button onClick={() => navigate('/')} fullWidth>
            Ir para o Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Convite para Colaboração
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Você foi convidado para fazer parte do grupo{' '}
          <span className="font-medium text-gray-900 dark:text-white">
            "{invitation.user_groups.name}"
          </span>
          {invitation.user_groups.description && (
            <>
              <br />
              <span className="text-sm">
                {invitation.user_groups.description}
              </span>
            </>
          )}
        </p>

        <div className="space-y-2 mb-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <strong>Função:</strong> {invitation.role === 'admin' ? 'Administrador' : 'Colaborador'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <strong>E-mail:</strong> {invitation.email}
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleDeclineInvitation}
            disabled={processing}
            fullWidth
            leftIcon={<X size={16} />}
          >
            Recusar
          </Button>
          <Button
            onClick={handleAcceptInvitation}
            disabled={processing}
            isLoading={processing}
            fullWidth
            leftIcon={<Check size={16} />}
          >
            Aceitar
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Ao aceitar, você terá acesso aos leads e funcionalidades do grupo.
        </p>
      </Card>
    </div>
  );
};

export default CollaboratorInvitation;