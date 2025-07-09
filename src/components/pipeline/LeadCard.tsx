import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Lead } from '../../types';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { CalendarClock, Phone, Mail, DollarSign, CheckSquare, Tag, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  activitiesCount?: number;
  tagsCount?: number;
}

interface Activity {
  id: string;
  title: string;
}

interface LeadTag {
  tag: {
    name: string;
  };
}

interface LeadOwner {
  id: string;
  name: string;
  email: string;
}
const LeadCard = ({ lead, onEdit, activitiesCount = 0, tagsCount = 0 }: LeadCardProps) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leadTags, setLeadTags] = useState<LeadTag[]>([]);
  const [leadOwner, setLeadOwner] = useState<LeadOwner | null>(null);
  const [showActivitiesTooltip, setShowActivitiesTooltip] = useState(false);
  const [showTagsTooltip, setShowTagsTooltip] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'LEAD',
    item: { id: lead.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  useEffect(() => {
    if (activitiesCount > 0) {
      fetchActivities();
    }
    if (tagsCount > 0) {
      fetchLeadTags();
    }
    if (lead.owner_id) {
      fetchLeadOwner();
    }
  }, [activitiesCount, tagsCount, lead.id]);

  const fetchActivities = async () => {
    if (!lead.id || !user) return;
    
    const { data } = await supabase
      .from('lead_activities')
      .select('id, title')
      .eq('lead_id', lead.id)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setActivities(data);
  };

  const fetchLeadTags = async () => {
    if (!lead.id) return;
    
    const { data } = await supabase
      .from('lead_tags_relation')
      .select(`
        tag:lead_tags(name)
      `)
      .eq('lead_id', lead.id);
    
    if (data) setLeadTags(data);
  };

  const fetchLeadOwner = async () => {
    if (!lead.owner_id) return;
    
    const { data } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', lead.owner_id)
      .maybeSingle();
    
    if (data) setLeadOwner(data);
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
  
  return (
    <div
      ref={drag}
      onClick={() => onEdit(lead)}
      className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 transition cursor-pointer hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <Avatar name={lead.companyname} size="sm" className="bg-blue-100" />
          <div className="ml-2">
            <h4 className="text-sm font-medium text-gray-900">{lead.companyname}</h4>
            <p className="text-xs text-gray-500">{lead.contactname}</p>
          </div>
        </div>
        <div>
          {getPriorityBadge(lead.priority)}
        </div>
      </div>
      
      {lead.value && (
        <div className="mb-2 flex items-center text-sm text-gray-600">
          <DollarSign size={14} className="mr-1 text-gray-400" />
          <span>R$ {lead.value.toLocaleString()}</span>
        </div>
      )}
      
      <div className="space-y-1 mt-2">
        {/* Owner Information */}
        {leadOwner && (
          <div className="flex items-center text-xs text-gray-500">
            <User size={14} className="mr-1 text-blue-400" />
            <span>Proprietário: {leadOwner.name || leadOwner.email}</span>
          </div>
        )}
        
        {lead.nextactivity && (
          <div className="flex items-center text-xs text-gray-500">
            <CalendarClock size={14} className="mr-1 text-gray-400" />
            <span>{lead.nextactivity}</span>
          </div>
        )}
        
        <div className="flex items-center text-xs text-gray-500">
          <Mail size={14} className="mr-1 text-gray-400" />
          <span>{lead.email}</span>
        </div>
        
        {lead.phone && (
          <div className="flex items-center text-xs text-gray-500">
            <Phone size={14} className="mr-1 text-gray-400" />
            <span>{lead.phone}</span>
          </div>
        )}
      </div>

      {/* Counters for Activities and Tags */}
      {(activitiesCount > 0 || tagsCount > 0) && (
        <div className="flex items-center justify-start mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            {activitiesCount > 0 && (
              <div 
                className="relative flex items-center text-xs text-gray-500 cursor-help"
                onMouseEnter={() => setShowActivitiesTooltip(true)}
                onMouseLeave={() => setShowActivitiesTooltip(false)}
              >
                <CheckSquare size={14} className="mr-1 text-blue-500" />
                <span className="font-medium">{activitiesCount}</span>
                
                {/* Activities Tooltip */}
                {showActivitiesTooltip && activities.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 z-50 bg-gray-900 text-white text-xs rounded-md py-2 px-3 shadow-lg min-w-max max-w-xs">
                    <div className="font-medium mb-1">Atividades:</div>
                    {activities.map((activity, index) => (
                      <div key={activity.id} className="truncate">
                        • {activity.title}
                      </div>
                    ))}
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            )}
            
            {tagsCount > 0 && (
              <div 
                className="relative flex items-center text-xs text-gray-500 cursor-help"
                onMouseEnter={() => setShowTagsTooltip(true)}
                onMouseLeave={() => setShowTagsTooltip(false)}
              >
                <Tag size={14} className="mr-1 text-green-500" />
                <span className="font-medium">{tagsCount}</span>
                
                {/* Tags Tooltip */}
                {showTagsTooltip && leadTags.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 z-50 bg-gray-900 text-white text-xs rounded-md py-2 px-3 shadow-lg min-w-max max-w-xs">
                    <div className="font-medium mb-1">Tags:</div>
                    {leadTags.map((leadTag, index) => (
                      <div key={index} className="truncate">
                        • {leadTag.tag.name}
                      </div>
                    ))}
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadCard;