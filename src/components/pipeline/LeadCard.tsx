import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Lead } from '../../types';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { CalendarClock, Phone, Mail, DollarSign, CheckSquare, Tag, User, Link as LinkIcon } from 'lucide-react';
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
    
    if (data) {
      // Transform the data to match the LeadTag interface
      const transformedData = data.map((item: any) => ({
        id: item.id,
        lead_id: item.lead_id,
        tag_id: item.tag_id,
        tag: {
          id: item.tag?.id || '',
          name: item.tag?.name || ''
        }
      }));
      setLeadTags(transformedData);
    }
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

        {/* Social Media Links */}
        {(lead.website || lead.instagram || lead.facebook) && (
          <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-gray-100">
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800"
                title="Website"
              >
                <LinkIcon size={14} />
              </a>
            )}
            {lead.instagram && (
              <a
                href={lead.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-pink-600 hover:text-pink-800"
                title="Instagram"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
            {lead.facebook && (
              <a
                href={lead.facebook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800"
                title="Facebook"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}
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