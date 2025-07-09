import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UserRole {
  isAdmin: boolean;
  isCollaborator: boolean;
  groups: Array<{
    id: string;
    name: string;
    role: 'admin' | 'collaborator';
    status: 'active' | 'pending' | 'inactive';
  }>;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>({
    isAdmin: false,
    isCollaborator: false,
    groups: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setUserRole({ isAdmin: false, isCollaborator: false, groups: [] });
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;

    try {
      // Check if user is admin of any group
      const { data: adminGroups, error: adminError } = await supabase
        .from('user_groups')
        .select('id, name')
        .eq('admin_user_id', user.id);

      if (adminError) throw adminError;

      // Check if user is collaborator in any group
      const { data: collaboratorGroups, error: collabError } = await supabase
        .from('group_collaborators')
        .select(`
          role,
          status,
          user_groups!inner(id, name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (collabError) throw collabError;

      const groups = [
        ...(adminGroups || []).map(group => ({
          id: group.id,
          name: group.name,
          role: 'admin' as const,
          status: 'active' as const
        })),
        ...(collaboratorGroups || []).map(collab => ({
          id: collab.user_groups.id,
          name: collab.user_groups.name,
          role: collab.role as 'admin' | 'collaborator',
          status: collab.status as 'active' | 'pending' | 'inactive'
        }))
      ];

      const isAdmin = (adminGroups?.length || 0) > 0;
      const isCollaborator = (collaboratorGroups?.length || 0) > 0;

      setUserRole({
        isAdmin,
        isCollaborator,
        groups
      });
    } catch (err) {
      console.error('Error fetching user role:', err);
      setUserRole({ isAdmin: false, isCollaborator: false, groups: [] });
    } finally {
      setLoading(false);
    }
  };

  const hasUserManagementAccess = () => {
    // Only admins (group owners) can manage users
    return userRole.isAdmin;
  };

  const canAccessFeature = (feature: string) => {
    // All authenticated users can access all features except user management
    if (feature === 'user-management') {
      return hasUserManagementAccess();
    }
    
    // All other features are accessible to both admins and collaborators
    return userRole.isAdmin || userRole.isCollaborator || true; // true for backward compatibility
  };

  return {
    userRole,
    loading,
    hasUserManagementAccess,
    canAccessFeature,
    refetch: fetchUserRole
  };
};