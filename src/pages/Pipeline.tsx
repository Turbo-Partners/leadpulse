import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Search, Plus, Filter, Upload, UserPlus, Settings, X, Calendar, Flag, LayoutGrid, List, Building, User, Mail, Phone, DollarSign, Clock, Tag, CheckSquare, AlertTriangle, Crown, Info } from 'lucide-react';
import Button from '../components/ui/Button';
import KanbanColumn from '../components/pipeline/KanbanColumn';
import LeadModal from '../components/pipeline/LeadModal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface FilterState {
  priority: string[];
  dateOrder: 'asc' | 'desc' | '';
}

type ViewMode = 'kanban' | 'list';

const Pipeline = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [leadCounts, setLeadCounts] = useState<Record<string, { activities: number; tags: number }>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filters, setFilters] = useState<FilterState>({
    priority: [],
    dateOrder: ''
  });
  const [leadCount, setLeadCount] = useState(0);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [showLeadLimitModal, setShowLeadLimitModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchLeads();
      fetchLeadCounts();
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
        setUserSubscription(data[0]);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const fetchLeads = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('createddate', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return;
    }

    setLeads(data || []);
    setLeadCount(data?.length || 0);
  };

  const fetchLeadCounts = async () => {
    if (!user) return;

    try {
      // Fetch activities count for each lead
      const { data: activitiesData } = await supabase
        .from('lead_activities')
        .select('lead_id')
        .eq('created_by', user.id);

      // Fetch tags count for each lead
      const { data: tagsData } = await supabase
        .from('lead_tags_relation')
        .select('lead_id');

      // Count activities per lead
      const activitiesCounts: Record<string, number> = {};
      activitiesData?.forEach(activity => {
        activitiesCounts[activity.lead_id] = (activitiesCounts[activity.lead_id] || 0) + 1;
      });

      // Count tags per lead
      const tagsCounts: Record<string, number> = {};
      tagsData?.forEach(tag => {
        tagsCounts[tag.lead_id] = (tagsCounts[tag.lead_id] || 0) + 1;
      });

      // Combine counts
      const combinedCounts: Record<string, { activities: number; tags: number }> = {};
      const allLeadIds = new Set([...Object.keys(activitiesCounts), ...Object.keys(tagsCounts)]);
      
      allLeadIds.forEach(leadId => {
        combinedCounts[leadId] = {
          activities: activitiesCounts[leadId] || 0,
          tags: tagsCounts[leadId] || 0
        };
      });

      setLeadCounts(combinedCounts);
    } catch (err) {
      console.error('Error fetching lead counts:', err);
    }
  };

  const applyFilters = (leadsToFilter: Lead[]) => {
    let filtered = [...leadsToFilter];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(lead => 
        lead.companyname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.contactname.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(lead => 
        filters.priority.includes(lead.priority)
      );
    }

    // Apply date ordering
    if (filters.dateOrder) {
      filtered.sort((a, b) => {
        if (filters.dateOrder === 'asc') {
          return a.createddate - b.createddate;
        } else {
          return b.createddate - a.createddate;
        }
      });
    }

    return filtered;
  };

  const filteredLeads = applyFilters(leads);

  const getLeadsByStatus = (status: string) => {
    return filteredLeads
      .filter(lead => lead.status === status);
  };

  const handleMoveLead = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await supabase
        .from('lead_history')
        .insert({
          lead_id: leadId,
          event_type: 'status_change',
          description: `Lead movido para ${getStatusLabel(newStatus)}`,
          created_by: user?.id
        });

      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
    } catch (err) {
      console.error('Error updating lead status:', err);
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

  const handleAddLead = (status: string) => {
    // Check lead limit for free plan
    if (userSubscription?.subscription_plans.type === 'free' && leadCount >= 10) {
      setShowLeadLimitModal(true);
      return;
    }

    const newLead: Partial<Lead> = {
      companyname: '',
      contactname: '',
      email: '',
      status,
      priority: 'medium',
      createddate: Date.now(),
      responsible: user?.user_metadata?.name || 'Unknown',
      user_id: user?.id,
    };
    
    setSelectedLead(newLead as Lead);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
      setLeadCount(prev => prev - 1);
      fetchLeadCounts();
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  const handleSaveLead = async (updatedLead: Lead) => {
    try {
      const leadToSave = {
        ...updatedLead,
        responsible: user?.user_metadata?.name || 'Unknown',
        user_id: user?.id,
        // Set owner_id to current user if not set and user is creating a new lead
        owner_id: updatedLead.owner_id || (updatedLead.id ? updatedLead.owner_id : user?.id),
      };

      if (!leadToSave.id) {
        const { data, error } = await supabase
          .from('leads')
          .insert(leadToSave)
          .select()
          .single();

        if (error) throw error;

        await supabase
          .from('lead_history')
          .insert({
            lead_id: data.id,
            event_type: 'lead_created',
            description: `Lead criado na etapa ${getStatusLabel(data.status)}`,
            created_by: user?.id
          });

        setLeads(prevLeads => [data, ...prevLeads]);
        setLeadCount(prev => prev + 1); // Increment count for new lead
      } else {
        const { error } = await supabase
          .from('leads')
          .update(leadToSave)
          .eq('id', leadToSave.id)
          .or(`user_id.eq.${user?.id},owner_id.eq.${user?.id}`);

        if (error) throw error;

        await supabase
          .from('lead_history')
          .insert({
            lead_id: leadToSave.id,
            event_type: 'lead_updated',
            description: 'Informações do lead atualizadas',
            created_by: user?.id
          });

        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === leadToSave.id ? leadToSave : lead
          )
        );
      }
      
      // Refresh counts after saving
      fetchLeadCounts();
    } catch (err) {
      console.error('Error saving lead:', err);
      throw err;
    }
  };

  const handlePriorityFilter = (priority: string) => {
    setFilters(prev => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter(p => p !== priority)
        : [...prev.priority, priority]
    }));
  };

  const handleDateOrderChange = (order: 'asc' | 'desc' | '') => {
    setFilters(prev => ({
      ...prev,
      dateOrder: order
    }));
  };

  const clearFilters = () => {
    setFilters({
      priority: [],
      dateOrder: ''
    });
  };

  const hasActiveFilters = filters.priority.length > 0 || filters.dateOrder !== '';

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa'
    };
    return labels[priority] || priority;
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const columnStatuses = [
    { id: 'leads', label: 'Leads' },
    { id: 'prospected', label: 'Prospectado' },
    { id: 'contacted', label: 'Em Conversa' },
    { id: 'proposal', label: 'Proposta' },
    { id: 'closed', label: 'Fechado' },
  ];

  // List View Component
  const ListView = () => (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contato
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prioridade
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Atividades
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLeads.map((lead) => (
              <tr 
                key={lead.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleEditLead(lead)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Avatar name={lead.companyname} size="sm" className="bg-blue-100" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{lead.companyname}</div>
                      <div className="text-sm text-gray-500">{lead.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{lead.contactname}</div>
                  <div className="text-sm text-gray-500">{lead.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getStatusLabel(lead.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getPriorityBadge(lead.priority)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.value ? `R$ ${lead.value.toLocaleString()}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    {leadCounts[lead.id]?.activities > 0 && (
                      <div className="flex items-center text-xs text-blue-600">
                        <CheckSquare size={14} className="mr-1" />
                        <span>{leadCounts[lead.id].activities}</span>
                      </div>
                    )}
                    {leadCounts[lead.id]?.tags > 0 && (
                      <div className="flex items-center text-xs text-green-600">
                        <Tag size={14} className="mr-1" />
                        <span>{leadCounts[lead.id].tags}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(lead.createddate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lead encontrado</h3>
              <p className="text-gray-500">
                {searchQuery || hasActiveFilters 
                  ? 'Tente ajustar os filtros ou termo de busca'
                  : 'Comece adicionando seu primeiro lead'
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
            <p className="text-gray-500">Gerencie seus leads através do processo de vendas</p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              leftIcon={<Settings size={16} />}
            >
              Ajustes
            </Button>
            
            <div className="relative">
              <Button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-[#CBFF2E] text-gray-900 hover:bg-[#b8e629]"
              >
                CRIAR
              </Button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleAddLead('leads');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                    >
                      <UserPlus size={16} className="mr-2" />
                      Adicionar Lead
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/import-settings');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                    >
                      <Upload size={16} className="mr-2" />
                      Importar Planilha
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plan Information */}
        {userSubscription && (
          <div className={`mt-4 p-4 rounded-lg border ${
            userSubscription.subscription_plans.type === 'free' 
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
              : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userSubscription.subscription_plans.type === 'free' 
                      ? 'bg-blue-100' 
                      : 'bg-green-100'
                  }`}>
                    {userSubscription.subscription_plans.type === 'free' ? (
                      <Info className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Crown className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {userSubscription.subscription_plans.type === 'free' ? 'Plano Gratuito' : userSubscription.subscription_plans.name}
                  </h3>
                  <p className={`text-sm ${
                    userSubscription.subscription_plans.type === 'free' 
                      ? 'text-blue-700' 
                      : 'text-green-700'
                  }`}>
                    {userSubscription.subscription_plans.type === 'free' 
                      ? `Você está usando ${leadCount} de ${userSubscription.subscription_plans.extraction_limit} leads disponíveis`
                      : 'Leads ilimitados no pipeline'
                    }
                  </p>
                </div>
              </div>
              
              {userSubscription.subscription_plans.type === 'free' && (
                <>
                  {/* Progress Bar */}
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-blue-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          leadCount >= userSubscription.subscription_plans.extraction_limit 
                            ? 'bg-red-500' 
                            : leadCount >= userSubscription.subscription_plans.extraction_limit * 0.8 
                            ? 'bg-orange-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${Math.min((leadCount / userSubscription.subscription_plans.extraction_limit) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-blue-900">
                      {leadCount}/{userSubscription.subscription_plans.extraction_limit}
                    </span>
                  </div>
                  
                  {leadCount >= userSubscription.subscription_plans.extraction_limit * 0.8 && (
                    <Button
                      size="sm"
                      onClick={() => navigate('/register')}
                      leftIcon={<Crown size={14} />}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    >
                      Fazer Upgrade
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar leads..."
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
          
          <div className="relative">
            <Button 
              variant={hasActiveFilters ? "primary" : "outline"}
              leftIcon={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtrar {hasActiveFilters && `(${filters.priority.length + (filters.dateOrder ? 1 : 0)})`}
            </Button>

            {showFilters && (
              <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Priority Filter */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Flag size={16} className="text-gray-500 mr-2" />
                      <label className="text-sm font-medium text-gray-700">
                        Prioridade
                      </label>
                    </div>
                    <div className="space-y-2">
                      {['high', 'medium', 'low'].map((priority) => (
                        <label key={priority} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.priority.includes(priority)}
                            onChange={() => handlePriorityFilter(priority)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {getPriorityLabel(priority)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Order Filter */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Calendar size={16} className="text-gray-500 mr-2" />
                      <label className="text-sm font-medium text-gray-700">
                        Ordenar por Data de Criação
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="dateOrder"
                          checked={filters.dateOrder === 'desc'}
                          onChange={() => handleDateOrderChange('desc')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Mais recentes primeiro
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="dateOrder"
                          checked={filters.dateOrder === 'asc'}
                          onChange={() => handleDateOrderChange('asc')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Mais antigos primeiro
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="dateOrder"
                          checked={filters.dateOrder === ''}
                          onChange={() => handleDateOrderChange('')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Sem ordenação
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                    >
                      Limpar Filtros
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowFilters(false)}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.priority.map((priority) => (
              <span
                key={priority}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                Prioridade: {getPriorityLabel(priority)}
                <button
                  onClick={() => handlePriorityFilter(priority)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            {filters.dateOrder && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Data: {filters.dateOrder === 'desc' ? 'Mais recentes' : 'Mais antigos'}
                <button
                  onClick={() => handleDateOrderChange('')}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'kanban' ? (
        <DndProvider backend={HTML5Backend}>
          <div className="flex-1 min-h-0">
            <div className="h-full kanban-container">
              {columnStatuses.map((column) => (
                <KanbanColumn
                  key={column.id}
                  title={column.label}
                  leads={getLeadsByStatus(column.id)}
                  status={column.id}
                  onAddLead={handleAddLead}
                  onMoveLead={handleMoveLead}
                  onEditLead={handleEditLead}
                  leadCounts={leadCounts}
                  userSubscription={userSubscription}
                  currentLeadCount={leadCount}
                />
              ))}
            </div>
          </div>
        </DndProvider>
      ) : (
        <div className="flex-1">
          <ListView />
        </div>
      )}

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          isOpen={true}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
        />
      )}

      {/* Lead Limit Modal */}
      {showLeadLimitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowLeadLimitModal(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Limite de Leads Atingido
                </h3>
                <p className="text-gray-600 mb-4">
                  Você atingiu o limite de {userSubscription?.subscription_plans.extraction_limit || 10} leads do plano gratuito.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-900 mb-2">Benefícios do Plano Mensal:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li className="flex items-center">
                      <CheckSquare size={14} className="mr-2 text-blue-600" />
                      Leads ilimitados no pipeline
                    </li>
                    <li className="flex items-center">
                      <CheckSquare size={14} className="mr-2 text-blue-600" />
                      100 extrações por mês no Scrapping Map
                    </li>
                    <li className="flex items-center">
                      <CheckSquare size={14} className="mr-2 text-blue-600" />
                      Acesso completo a todas as funcionalidades
                    </li>
                    <li className="flex items-center">
                      <CheckSquare size={14} className="mr-2 text-blue-600" />
                      Suporte prioritário
                    </li>
                  </ul>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowLeadLimitModal(false)}
                    fullWidth
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    fullWidth
                    leftIcon={<Crown size={16} />}
                  >
                    Fazer Upgrade
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;