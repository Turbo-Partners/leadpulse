import React, { useState, useRef, useEffect } from 'react';
import { Lead } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useUserRole } from '../../hooks/useUserRole';
import { 
  X, Building, User, Mail, Phone, DollarSign, Calendar, 
  MapPin, FileText, Clock, Tag, Link as LinkIcon, MessageSquare, 
  Plus, Paperclip, Calendar as CalendarIcon, Mail as MailIcon,
  Phone as PhoneIcon, MessageSquare as MessageSquareIcon,
  Trash2, Check, Edit2, Layers, Save
} from 'lucide-react';

interface LeadModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
  onDelete?: (leadId: string) => void;
}

interface Tag {
  id: string;
  name: string;
}

interface LeadTag {
  id: string;
  lead_id: string;
  tag_id: string;
  tag: {
    id: string;
    name: string;
  };
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  scheduled_for?: string;
  created_at: string;
  completed?: boolean;
}

interface Document {
  id: string;
  name: string;
  file_size: number;
  content_type: string;
  uploaded_at: string;
}

interface HistoryEvent {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: string;
}
const ACTIVITY_TYPES = [
  { id: 'follow_up', label: 'Follow Up', icon: PhoneIcon },
  { id: 'email', label: 'Email', icon: MailIcon },
  { id: 'meeting', label: 'Reunião', icon: CalendarIcon },
  { id: 'call', label: 'Ligação', icon: PhoneIcon },
  { id: 'task', label: 'Tarefa', icon: Clock }
];

const PIPELINE_STAGES = [
  { id: 'leads', label: 'Leads' },
  { id: 'prospected', label: 'Prospectado' },
  { id: 'contacted', label: 'Em Conversa' },
  { id: 'proposal', label: 'Proposta' },
  { id: 'closed', label: 'Fechado' }
];

const LeadModal = ({ lead, isOpen, onClose, onSave, onDelete }: LeadModalProps) => {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState<Lead>(lead);
  const [tags, setTags] = useState<Tag[]>([]);
  const [leadTags, setLeadTags] = useState<LeadTag[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [newActivity, setNewActivity] = useState({
    type: '',
    title: '',
    description: '',
    scheduled_for: ''
  });
  const [observations, setObservations] = useState('');
  const [isSavingObservation, setIsSavingObservation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTags();
    if (userRole.isAdmin) {
      fetchGroupMembers();
    }
    
    if (lead.id) {
      fetchLeadTags();
      fetchActivities();
      fetchDocuments();
      fetchHistory();
      // Load existing observations from lead notes
      setObservations(lead.notes || '');
    } else {
      setLeadTags([]);
      setActivities([]);
      setDocuments([]);
      setHistory([]);
      setObservations('');
    }
  }, [lead.id]);

  const fetchTags = async () => {
    const { data } = await supabase.from('lead_tags').select('*').order('name');
    if (data) setTags(data);
  };

  const fetchGroupMembers = async () => {
    if (!user || !userRole.isAdmin) return;

    try {
      // Get all group members (admin + collaborators)
      const adminGroups = userRole.groups.filter(g => g.role === 'admin');
      if (adminGroups.length === 0) return;

      // For now, get members from the first admin group
      const groupId = adminGroups[0].id;

      // Get group collaborators
      const { data: collaborators } = await supabase
        .from('group_collaborators')
        .select(`
          user_id,
          email,
          role,
          users!inner(id, name, email)
        `)
        .eq('group_id', groupId)
        .eq('status', 'active');

      // Get group admin
      const { data: adminData } = await supabase
        .from('user_groups')
        .select(`
          admin_user_id,
          users!inner(id, name, email)
        `)
        .eq('id', groupId)
        .single();

      const members: GroupMember[] = [];

      // Add admin
      if (adminData?.users) {
        members.push({
          id: adminData.users.id,
          name: adminData.users.name || adminData.users.email,
          email: adminData.users.email,
          role: 'admin'
        });
      }

      // Add collaborators
      if (collaborators) {
        collaborators.forEach(collab => {
          if (collab.users) {
            members.push({
              id: collab.users.id,
              name: collab.users.name || collab.users.email,
              email: collab.users.email,
              role: collab.role
            });
          }
        });
      }

      setGroupMembers(members);
    } catch (err) {
      console.error('Error fetching group members:', err);
    }
  };
  const fetchLeadTags = async () => {
    if (!lead.id) return;
    const { data } = await supabase
      .from('lead_tags_relation')
      .select(`
        id,
        lead_id,
        tag_id,
        tag:lead_tags(id, name)
      `)
      .eq('lead_id', lead.id);
    if (data) setLeadTags(data);
  };

  const fetchActivities = async () => {
    if (!lead.id) return;
    const { data } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false });
    if (data) setActivities(data);
  };

  const fetchDocuments = async () => {
    if (!lead.id) return;
    const { data } = await supabase
      .from('lead_documents')
      .select('*')
      .eq('lead_id', lead.id)
      .order('uploaded_at', { ascending: false });
    if (data) setDocuments(data);
  };

  const fetchHistory = async () => {
    if (!lead.id) return;
    const { data } = await supabase
      .from('lead_history')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleSaveObservation = async () => {
    if (!lead.id || !user) return;
    
    setIsSavingObservation(true);
    
    try {
      // Update lead notes
      const { error: updateError } = await supabase
        .from('leads')
        .update({ notes: observations })
        .eq('id', lead.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Add to history if there's content
      if (observations.trim()) {
        await supabase
          .from('lead_history')
          .insert({
            lead_id: lead.id,
            event_type: 'observation_added',
            description: `Observação adicionada: ${observations.substring(0, 100)}${observations.length > 100 ? '...' : ''}`,
            created_by: user.id
          });
      }

      // Update form data
      setFormData(prev => ({ ...prev, notes: observations }));
      
      // Refresh history
      fetchHistory();
      
    } catch (err) {
      console.error('Error saving observation:', err);
    } finally {
      setIsSavingObservation(false);
    }
  };

  // Filter tags based on search query
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
    !leadTags.some(lt => lt.tag_id === tag.id)
  );

  // Check if search query matches any existing tag exactly
  const exactTagMatch = tags.find(tag => 
    tag.name.toLowerCase() === tagSearchQuery.toLowerCase()
  );

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagSearchQuery(value);
    setShowTagSuggestions(value.length > 0);
  };

  const handleTagInputFocus = () => {
    if (tagSearchQuery.length > 0) {
      setShowTagSuggestions(true);
    }
  };

  const handleTagInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowTagSuggestions(false), 200);
  };

  const handleSelectTag = async (tag: Tag) => {
    if (!lead.id) return;

    try {
      const { data: relationData, error } = await supabase
        .from('lead_tags_relation')
        .insert({
          lead_id: lead.id,
          tag_id: tag.id
        })
        .select(`
          id,
          lead_id,
          tag_id,
          tag:lead_tags(id, name)
        `)
        .single();

      if (relationData) {
        setLeadTags([...leadTags, relationData]);
        setTagSearchQuery('');
        setShowTagSuggestions(false);
      }
    } catch (err) {
      console.error('Error adding tag:', err);
    }
  };

  const handleCreateAndSelectTag = async () => {
    if (!tagSearchQuery.trim() || !lead.id || exactTagMatch) return;

    try {
      // Create new tag
      const { data: newTag, error: tagError } = await supabase
        .from('lead_tags')
        .insert({ name: tagSearchQuery.trim() })
        .select()
        .single();

      if (tagError || !newTag) return;

      // Add to tags list
      setTags([...tags, newTag]);

      // Add tag to lead
      const { data: relationData, error: relationError } = await supabase
        .from('lead_tags_relation')
        .insert({
          lead_id: lead.id,
          tag_id: newTag.id
        })
        .select(`
          id,
          lead_id,
          tag_id,
          tag:lead_tags(id, name)
        `)
        .single();

      if (relationData) {
        setLeadTags([...leadTags, relationData]);
        setTagSearchQuery('');
        setShowTagSuggestions(false);
      }
    } catch (err) {
      console.error('Error creating and adding tag:', err);
    }
  };

  const handleRemoveTag = async (leadTagId: string) => {
    const { error } = await supabase
      .from('lead_tags_relation')
      .delete()
      .eq('id', leadTagId);

    if (!error) {
      setLeadTags(leadTags.filter(lt => lt.id !== leadTagId));
    }
  };

  const handleAddActivity = async () => {
    if (!lead.id) return;
    const { data, error } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: lead.id,
        created_by: user?.id,
        ...newActivity
      })
      .select()
      .single();

    if (data) {
      setActivities([data, ...activities]);
      
      // Add to history
      await supabase
        .from('lead_history')
        .insert({
          lead_id: lead.id,
          event_type: 'activity_added',
          description: `Atividade adicionada: ${newActivity.title}`,
          created_by: user?.id
        });

      setShowActivityModal(false);
      setNewActivity({ type: '', title: '', description: '', scheduled_for: '' });
      fetchHistory(); // Refresh history
    }
  };

  const handleEditActivity = async () => {
    if (!editingActivity || !lead.id) return;
    
    const { data, error } = await supabase
      .from('lead_activities')
      .update({
        type: newActivity.type,
        title: newActivity.title,
        description: newActivity.description,
        scheduled_for: newActivity.scheduled_for
      })
      .eq('id', editingActivity.id)
      .select()
      .single();

    if (data) {
      setActivities(activities.map(act => act.id === editingActivity.id ? data : act));
      
      // Add to history
      await supabase
        .from('lead_history')
        .insert({
          lead_id: lead.id,
          event_type: 'activity_updated',
          description: `Atividade atualizada: ${newActivity.title}`,
          created_by: user?.id
        });

      setShowActivityModal(false);
      setEditingActivity(null);
      setNewActivity({ type: '', title: '', description: '', scheduled_for: '' });
      fetchHistory(); // Refresh history
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    const activity = activities.find(act => act.id === activityId);
    const { error } = await supabase
      .from('lead_activities')
      .delete()
      .eq('id', activityId);

    if (!error) {
      setActivities(activities.filter(act => act.id !== activityId));
      
      // Add to history
      if (activity && lead.id) {
        await supabase
          .from('lead_history')
          .insert({
            lead_id: lead.id,
            event_type: 'activity_deleted',
            description: `Atividade removida: ${activity.title}`,
            created_by: user?.id
          });
        fetchHistory(); // Refresh history
      }
    }
  };

  const handleCompleteActivity = async (activity: Activity) => {
    // Add to history
    await supabase
      .from('lead_history')
      .insert({
        lead_id: lead.id,
        event_type: 'activity_completed',
        description: `Atividade concluída: ${activity.title}`,
        created_by: user?.id
      });

    // Delete the activity
    await handleDeleteActivity(activity.id);
    
    // Refresh history
    fetchHistory();
  };

  const handleStageChange = async (newStage: string) => {
    const oldStage = formData.status;
    setFormData(prev => ({ ...prev, status: newStage }));

    // If this is an existing lead, update the database and add history
    if (lead.id) {
      try {
        const { error } = await supabase
          .from('leads')
          .update({ status: newStage })
          .eq('id', lead.id)
          .eq('user_id', user?.id);

        if (error) throw error;

        // Add to history
        await supabase
          .from('lead_history')
          .insert({
            lead_id: lead.id,
            event_type: 'status_change',
            description: `Lead movido de ${getStageLabel(oldStage)} para ${getStageLabel(newStage)}`,
            created_by: user?.id
          });

        fetchHistory(); // Refresh history
      } catch (err) {
        console.error('Error updating lead stage:', err);
        // Revert the change if there was an error
        setFormData(prev => ({ ...prev, status: oldStage }));
      }
    }
  };

  const getStageLabel = (stage: string) => {
    const stageObj = PIPELINE_STAGES.find(s => s.id === stage);
    return stageObj ? stageObj.label : stage;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!lead.id) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${lead.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadData) {
      const { data: docData } = await supabase
        .from('lead_documents')
        .insert({
          lead_id: lead.id,
          name: file.name,
          file_key: filePath,
          file_size: file.size,
          content_type: file.type,
          uploaded_by: user?.id
        })
        .select()
        .single();

      if (docData) {
        setDocuments([docData, ...documents]);
        
        // Add to history
        await supabase
          .from('lead_history')
          .insert({
            lead_id: lead.id,
            event_type: 'document_uploaded',
            description: `Documento enviado: ${file.name}`,
            created_by: user?.id
          });
        fetchHistory(); // Refresh history
      }
    }
  };

  const handleDelete = async () => {
    if (!lead.id) return;
    
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id);

      if (error) throw error;

      onClose();
      if (onDelete) {
        onDelete(lead.id);
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const translateEventType = (eventType: string) => {
    const translations: Record<string, string> = {
      'status_change': 'Mudança de status',
      'lead_updated': 'Lead atualizado',
      'lead_created': 'Lead criado',
      'activity_added': 'Atividade adicionada',
      'activity_updated': 'Atividade atualizada',
      'activity_deleted': 'Atividade removida',
      'activity_completed': 'Atividade concluída',
      'document_uploaded': 'Documento enviado',
      'comment_added': 'Comentário adicionado',
      'observation_added': 'Observação adicionada'
    };
    return translations[eventType] || eventType;
  };

  const openEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setNewActivity({
      type: activity.type,
      title: activity.title,
      description: activity.description || '',
      scheduled_for: activity.scheduled_for || ''
    });
    setShowActivityModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900">{formData.companyname}</h3>
                <p className="text-sm text-gray-500">{getStageLabel(formData.status)}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X size={20} />
            </button>
          </div>

          {/* Pipeline Stage Selector - Moved to top */}
          <div className="px-6 py-4 border-b bg-gray-50">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Etapa do Funil
              </label>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STAGES.map((stage, index) => {
                  const isActive = formData.status === stage.id;
                  const isPassed = PIPELINE_STAGES.findIndex(s => s.id === formData.status) > index;
                  
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => handleStageChange(stage.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : isPassed
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {stage.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Informações Básicas</h4>
                    <div className="space-y-4">
                      <Input
                        label="Empresa"
                        name="companyname"
                        value={formData.companyname}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyname: e.target.value }))}
                        leftIcon={<Building size={18} className="text-gray-400" />}
                        fullWidth
                        required
                      />
                      <Input
                        label="Contato"
                        name="contactname"
                        value={formData.contactname}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactname: e.target.value }))}
                        leftIcon={<User size={18} className="text-gray-400" />}
                        fullWidth
                        required
                      />
                      <Input
                        label="Cargo"
                        name="jobtitle"
                        value={formData.jobtitle || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, jobtitle: e.target.value }))}
                        leftIcon={<User size={18} className="text-gray-400" />}
                        fullWidth
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Contato</h4>
                    <div className="space-y-4">
                      <Input
                        label="E-mail"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        leftIcon={<Mail size={18} className="text-gray-400" />}
                        fullWidth
                        required
                      />
                      <Input
                        label="Telefone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        leftIcon={<Phone size={18} className="text-gray-400" />}
                        mask="(00) 00000-0000"
                        fullWidth
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Redes Sociais</h4>
                    <div className="space-y-4">
                      <Input
                        label="Website"
                        name="website"
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        leftIcon={<LinkIcon size={18} className="text-gray-400" />}
                        fullWidth
                        placeholder="https://www.exemplo.com"
                      />
                      <Input
                        label="Instagram"
                        name="instagram"
                        type="url"
                        value={formData.instagram || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                        leftIcon={<LinkIcon size={18} className="text-gray-400" />}
                        fullWidth
                        placeholder="https://www.instagram.com/empresa"
                      />
                      <Input
                        label="Facebook"
                        name="facebook"
                        type="url"
                        value={formData.facebook || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                        leftIcon={<LinkIcon size={18} className="text-gray-400" />}
                        fullWidth
                        placeholder="https://www.facebook.com/empresa"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Informações da Oportunidade</h4>
                    <div className="space-y-4">
                      <Input
                        label="Valor (R$)"
                        name="value"
                        type="number"
                        value={formData.value || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                        leftIcon={<DollarSign size={18} className="text-gray-400" />}
                        fullWidth
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prioridade
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Lead['priority'] }))}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="low">Baixa</option>
                          <option value="medium">Média</option>
                          <option value="high">Alta</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags
                        </label>
                        <div className="space-y-3">
                          {/* Tag Input with Search */}
                          <div className="relative">
                            <input
                              ref={tagInputRef}
                              type="text"
                              value={tagSearchQuery}
                              onChange={handleTagInputChange}
                              onFocus={handleTagInputFocus}
                              onBlur={handleTagInputBlur}
                              placeholder="Buscar ou criar tag..."
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Tag size={18} className="text-gray-400" />
                            </div>

                            {/* Tag Suggestions Dropdown */}
                            {showTagSuggestions && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredTags.length > 0 && (
                                  <div className="py-1">
                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                                      Tags existentes
                                    </div>
                                    {filteredTags.map(tag => (
                                      <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => handleSelectTag(tag)}
                                        className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2"
                                      >
                                        <Tag size={14} className="text-gray-400" />
                                        <span>{tag.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Create new tag option */}
                                {tagSearchQuery.trim() && !exactTagMatch && (
                                  <div className="py-1 border-t border-gray-200">
                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                                      Criar nova tag
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleCreateAndSelectTag}
                                      className="w-full text-left px-3 py-2 hover:bg-green-50 hover:text-green-700 flex items-center space-x-2"
                                    >
                                      <Plus size={14} className="text-green-500" />
                                      <span>Criar "{tagSearchQuery}"</span>
                                    </button>
                                  </div>
                                )}

                                {filteredTags.length === 0 && tagSearchQuery.trim() && exactTagMatch && (
                                  <div className="px-3 py-2 text-sm text-gray-500">
                                    Tag já existe e está adicionada
                                  </div>
                                )}

                                {filteredTags.length === 0 && !tagSearchQuery.trim() && (
                                  <div className="px-3 py-2 text-sm text-gray-500">
                                    Digite para buscar tags
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Selected Tags */}
                          {leadTags.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500">Tags selecionadas:</p>
                              <div className="flex flex-wrap gap-2">
                                {leadTags.map(leadTag => (
                                  <span
                                    key={leadTag.id}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white"
                                  >
                                    {leadTag.tag.name}
                                    <button
                                      onClick={() => handleRemoveTag(leadTag.id)}
                                      className="ml-1 text-blue-200 hover:text-white"
                                    >
                                      <X size={12} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Observações Box */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-900">Observações</h4>
                      <Button
                        size="sm"
                        onClick={handleSaveObservation}
                        disabled={isSavingObservation || !lead.id}
                        leftIcon={isSavingObservation ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                      >
                        {isSavingObservation ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                    <div>
                      <textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Adicione observações importantes sobre este lead..."
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        As observações serão automaticamente adicionadas ao histórico quando salvas.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Histórico</h4>
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {history.map((event) => (
                        <div key={event.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Clock size={16} className="text-blue-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {translateEventType(event.event_type)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {event.description}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(event.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Atividades</h4>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingActivity(null);
                      setNewActivity({ type: '', title: '', description: '', scheduled_for: '' });
                      setShowActivityModal(true);
                    }}
                    leftIcon={<Plus size={16} />}
                    disabled={!lead.id}
                  >
                    Nova Atividade
                  </Button>
                </div>

                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 bg-white p-3 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          {ACTIVITY_TYPES.find(t => t.id === activity.type)?.icon && (
                            React.createElement(ACTIVITY_TYPES.find(t => t.id === activity.type)!.icon, { size: 16, className: "text-blue-600" })
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-gray-500">
                            {activity.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                          <span>{ACTIVITY_TYPES.find(t => t.id === activity.type)?.label}</span>
                          {activity.scheduled_for && (
                            <>
                              <span>•</span>
                              <span>{formatDate(activity.scheduled_for)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditActivity(activity)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleCompleteActivity(activity)}
                          className="text-gray-400 hover:text-green-600"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Documentos</h4>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<Plus size={16} />}
                      disabled={!lead.id}
                    >
                      Adicionar Documento
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded bg-blue-100 flex items-center justify-center">
                          <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(doc.file_size)} • {formatDate(doc.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const { data } = await supabase.storage
                            .from('documents')
                            .createSignedUrl(doc.file_key, 60);
                          if (data) {
                            window.open(data.signedUrl);
                          }
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between space-x-3 border-t pt-6">
              <div>
                {lead.id && (
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    leftIcon={<Trash2 size={16} />}
                  >
                    Excluir Lead
                  </Button>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    onSave(formData);
                    onClose();
                  }}
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showActivityModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowActivityModal(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, type: e.target.value }))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Selecione um tipo</option>
                    {ACTIVITY_TYPES.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Título"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                />
                {/* Owner Selection - Only for Admins */}
                {userRole.isAdmin && groupMembers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Proprietário do Lead
                    </label>
                    <select
                      value={formData.owner_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, owner_id: e.target.value || undefined }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecionar proprietário</option>
                      {groupMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role === 'admin' ? 'Administrador' : 'Colaborador'})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      O proprietário é responsável por este lead
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={newActivity.description}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <Input
                  label="Data/Hora"
                  type="datetime-local"
                  value={newActivity.scheduled_for}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, scheduled_for: e.target.value }))}
                  fullWidth
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActivityModal(false);
                    setEditingActivity(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={editingActivity ? handleEditActivity : handleAddActivity}
                  disabled={!newActivity.type || !newActivity.title}
                >
                  {editingActivity ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadModal;