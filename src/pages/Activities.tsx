import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, Calendar, Mail, Phone, MessageSquare, LayoutGrid, List, Building, User, DollarSign, CheckSquare, Tag, AlertTriangle, Check } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import LeadModal from '../components/pipeline/LeadModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Lead } from '../types';

interface Activity {
  id: string;
  lead_id: string;
  type: string;
  title: string;
  description?: string;
  scheduled_for: string;
  created_at: string;
  completed?: boolean;
  completed_at?: string;
  lead: {
    id: string;
    companyname: string;
    contactname: string;
    email: string;
    phone?: string;
    status: string;
    priority: string;
    value?: number;
    user_id: string;
    createddate: number;
    responsible: string;
    jobtitle?: string;
    notes?: string;
    whatsapp?: string;
    nextactivity?: string;
    source_id?: string;
    group_id?: string;
    assigned_to?: string;
  };
}

type ViewMode = 'kanban' | 'list';
type ActivityStatus = 'overdue' | 'today' | 'this_week' | 'future' | 'completed';

const Activities = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select(`
          *,
          lead:leads(*)
        `)
        .eq('created_by', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;

      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
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

  const getActivityStatus = (activity: Activity): ActivityStatus => {
    // If activity is completed, return completed status
    if (activity.completed) {
      return 'completed';
    }

    const now = new Date();
    const activityDate = new Date(activity.scheduled_for);
    
    // Reset time to compare only dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
    
    if (activityDay < today) {
      return 'overdue';
    } else if (activityDay.getTime() === today.getTime()) {
      return 'today';
    } else {
      // Check if it's within this week (next 7 days)
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      
      if (activityDay <= weekFromNow) {
        return 'this_week';
      } else {
        return 'future';
      }
    }
  };

  const getActivitiesByStatus = (status: ActivityStatus) => {
    return filteredActivities.filter(activity => getActivityStatus(activity) === status);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date: string) => {
    const activityDate = new Date(date);
    const today = new Date();
    
    if (activityDate.toDateString() === today.toDateString()) {
      return activityDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return activityDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="danger">Alta</Badge>;
      case 'medium':
        return <Badge variant="warning">Média</Badge>;
      case 'low':
        return <Badge variant="info">Baixa</Badge>;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'leads': 'Leads',
      'prospected': 'Prospectado',
      'contacted': 'Em Conversa',
      'proposal': 'Proposta',
      'closed': 'Fechado'
    };
    return statusLabels[status] || status;
  };

  const handleActivityClick = (activity: Activity) => {
    // Convert activity.lead to Lead type and open modal
    const lead: Lead = {
      id: activity.lead.id,
      companyname: activity.lead.companyname,
      contactname: activity.lead.contactname,
      email: activity.lead.email,
      phone: activity.lead.phone,
      status: activity.lead.status,
      priority: activity.lead.priority as 'high' | 'medium' | 'low',
      value: activity.lead.value,
      createddate: activity.lead.createddate,
      responsible: activity.lead.responsible,
      jobtitle: activity.lead.jobtitle,
      notes: activity.lead.notes,
      whatsapp: activity.lead.whatsapp,
      nextactivity: activity.lead.nextactivity,
      source_id: activity.lead.source_id,
      user_id: activity.lead.user_id,
      group_id: activity.lead.group_id,
      assigned_to: activity.lead.assigned_to
    };
    
    setSelectedLead(lead);
  };

  const handleCompleteActivity = async (activity: Activity, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent opening the lead modal
    }

    if (!user) return;

    try {
      // Mark activity as completed
      const { error: updateError } = await supabase
        .from('lead_activities')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', activity.id)
        .eq('created_by', user.id);

      if (updateError) throw updateError;

      // Add to lead history
      await supabase
        .from('lead_history')
        .insert({
          lead_id: activity.lead_id,
          event_type: 'activity_completed',
          description: `Atividade concluída: ${activity.title}`,
          created_by: user.id
        });

      // Update local state
      setActivities(activities.map(act => 
        act.id === activity.id 
          ? { ...act, completed: true, completed_at: new Date().toISOString() }
          : act
      ));

    } catch (err) {
      console.error('Error completing activity:', err);
    }
  };

  const handleSaveLead = async (updatedLead: Lead) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(updatedLead)
        .eq('id', updatedLead.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Refresh activities to get updated lead data
      fetchActivities();
    } catch (err) {
      console.error('Error saving lead:', err);
      throw err;
    }
  };

  const handleDeleteLead = (leadId: string) => {
    // Remove activities related to deleted lead
    setActivities(activities.filter(activity => activity.lead_id !== leadId));
  };

  const filteredActivities = activities.filter(activity => 
    activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.lead?.companyname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columnStatuses = [
    { id: 'overdue', label: 'Atrasadas', color: 'bg-red-50 border-red-200' },
    { id: 'today', label: 'Hoje', color: 'bg-blue-50 border-blue-200' },
    { id: 'this_week', label: 'Esta Semana', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'future', label: 'Futuro', color: 'bg-gray-50 border-gray-200' },
    { id: 'completed', label: 'Concluído', color: 'bg-green-50 border-green-200' },
  ];

  // Activity Card Component
  const ActivityCard = ({ activity }: { activity: Activity }) => {
    const status = getActivityStatus(activity);
    const isOverdue = status === 'overdue';
    const isCompleted = activity.completed;
    
    return (
      <div 
        onClick={() => handleActivityClick(activity)}
        className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 transition cursor-pointer hover:shadow-md ${
          isOverdue && !isCompleted ? 'border-l-4 border-l-red-500' : ''
        } ${isCompleted ? 'opacity-75' : ''}`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isCompleted ? 'bg-green-100' :
              isOverdue ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {isCompleted ? (
                <Check size={16} className="text-green-600" />
              ) : (
                getActivityIcon(activity.type)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium truncate ${
                isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
              }`}>
                {activity.title}
              </p>
              <p className="text-xs text-gray-500">
                {activity.lead?.companyname}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 flex-shrink-0">
            {isOverdue && !isCompleted && (
              <AlertTriangle size={16} className="text-red-500" />
            )}
            {!isCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleCompleteActivity(activity, e)}
                className="h-6 w-6 p-0 border-green-300 text-green-600 hover:bg-green-50"
                title="Marcar como completo"
              >
                <Check size={12} />
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatDateShort(activity.scheduled_for)}</span>
            <span className="capitalize">{activity.type}</span>
          </div>
          
          {activity.description && (
            <p className={`text-xs line-clamp-2 ${
              isCompleted ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {activity.description}
            </p>
          )}

          {isCompleted && activity.completed_at && (
            <p className="text-xs text-green-600">
              Concluída em {formatDateShort(activity.completed_at)}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Kanban Column Component
  const KanbanColumn = ({ status, title, color }: { status: ActivityStatus; title: string; color: string }) => {
    const columnActivities = getActivitiesByStatus(status);
    
    return (
      <div className={`flex flex-col h-full overflow-hidden rounded-lg ${color} min-w-0`} style={{ flex: '0 0 280px' }}>
        <div className="p-3 flex items-center justify-between bg-white bg-opacity-50 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{columnActivities.length} atividades</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
          {columnActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
          
          {columnActivities.length === 0 && (
            <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm text-gray-500">Nenhuma atividade</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // List View Component
  const ListView = () => (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Atividade
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prioridade
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data/Hora
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredActivities.map((activity) => {
              const status = getActivityStatus(activity);
              const isOverdue = status === 'overdue';
              const isCompleted = activity.completed;
              
              return (
                <tr 
                  key={activity.id} 
                  className={`hover:bg-gray-50 cursor-pointer ${
                    isOverdue && !isCompleted ? 'bg-red-50' : ''
                  } ${isCompleted ? 'opacity-75' : ''}`}
                  onClick={() => handleActivityClick(activity)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                        isCompleted ? 'bg-green-100' :
                        isOverdue ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {isCompleted ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          getActivityIcon(activity.type)
                        )}
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${
                          isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          {activity.title}
                        </div>
                        {activity.description && (
                          <div className={`text-sm truncate max-w-xs ${
                            isCompleted ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {activity.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar name={activity.lead?.companyname} size="sm" className="bg-blue-100 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{activity.lead?.companyname}</div>
                        <div className="text-sm text-gray-500">{activity.lead?.contactname}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                      {activity.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {isOverdue && !isCompleted && <AlertTriangle size={16} className="text-red-500" />}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        status === 'completed' ? 'bg-green-100 text-green-800' :
                        status === 'overdue' ? 'bg-red-100 text-red-800' :
                        status === 'today' ? 'bg-blue-100 text-blue-800' :
                        status === 'this_week' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {status === 'completed' ? 'Concluída' :
                         status === 'overdue' ? 'Atrasada' :
                         status === 'today' ? 'Hoje' :
                         status === 'this_week' ? 'Esta Semana' :
                         'Futuro'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPriorityBadge(activity.lead?.priority)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(activity.scheduled_for)}
                    {isCompleted && activity.completed_at && (
                      <div className="text-xs text-green-600">
                        Concluída: {formatDate(activity.completed_at)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleCompleteActivity(activity, e)}
                        className="border-green-300 text-green-600 hover:bg-green-50"
                        leftIcon={<Check size={14} />}
                      >
                        Concluir
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredActivities.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Tente ajustar o termo de busca'
                  : 'Você não tem atividades agendadas'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
        <p className="text-gray-500">Gerencie todas as atividades dos seus leads</p>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar atividades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} className="text-gray-400" />}
            fullWidth
          />
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid size={16} />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List size={16} />
            <span>Lista</span>
          </button>
        </div>
        
        <Button 
          variant="outline" 
          leftIcon={<Filter size={16} />}
        >
          Filtrar
        </Button>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 min-h-0">
          <div className="h-full flex gap-4 overflow-x-auto pb-4">
            {columnStatuses.map((column) => (
              <KanbanColumn
                key={column.id}
                status={column.id as ActivityStatus}
                title={column.label}
                color={column.color}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <ListView />
        </div>
      )}

      {/* Lead Modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          isOpen={true}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
        />
      )}
    </div>
  );
};

export default Activities;