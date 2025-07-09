import React from 'react';
import { useDrop } from 'react-dnd';
import { Lead } from '../../types';
import LeadCard from './LeadCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  leads: Lead[];
  status: string;
  onAddLead: (status: string) => void;
  onMoveLead: (leadId: string, newStatus: string) => void;
  onEditLead: (lead: Lead) => void;
  leadCounts?: Record<string, { activities: number; tags: number }>;
  userSubscription?: any;
  currentLeadCount?: number;
}

const KanbanColumn = ({ 
  title, 
  leads, 
  status, 
  onAddLead, 
  onMoveLead,
  onEditLead,
  leadCounts = {},
  userSubscription,
  currentLeadCount = 0
}: KanbanColumnProps) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'LEAD',
    drop: (item: { id: string }) => {
      onMoveLead(item.id, status);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Calculate total value for this column
  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  
  // Check if user is approaching or at the limit for free plan
  const isFreePlan = userSubscription?.subscription_plans?.type === 'free';
  const leadLimit = userSubscription?.subscription_plans?.extraction_limit || 10;
  const isNearLimit = isFreePlan && currentLeadCount >= leadLimit * 0.8;
  const isAtLimit = isFreePlan && currentLeadCount >= leadLimit;
  
  return (
    <div 
      ref={drop} 
      className={`kanban-column flex flex-col h-full overflow-hidden rounded-lg ${isOver ? 'bg-blue-50' : 'bg-gray-50'}`}
    >
      <div className={`p-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0 ${
        isAtLimit ? 'bg-red-50' : isNearLimit ? 'bg-orange-50' : 'bg-gray-100'
      }`}>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{leads.length} leads</span>
            {isNearLimit && !isAtLimit && (
              <span className="text-orange-600 font-medium">
                • Próximo do limite
              </span>
            )}
            {isAtLimit && (
              <span className="text-red-600 font-medium">
                • Limite atingido
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => onAddLead(status)}
          className={`p-1 rounded-full transition-colors ${
            isAtLimit 
              ? 'text-red-500 hover:text-red-700 hover:bg-red-100' 
              : isNearLimit 
              ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-100' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }`}
          title={
            isAtLimit 
              ? 'Limite de leads atingido - Faça upgrade para adicionar mais' 
              : isNearLimit 
              ? `Atenção: ${currentLeadCount}/${leadLimit} leads (próximo do limite)` 
              : 'Adicionar lead'
          }
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Prominent Value Display */}
      {totalValue > 0 && (
        <div className="px-3 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              R$ {totalValue.toLocaleString('pt-BR', { 
                minimumFractionDigits: 0,
                maximumFractionDigits: 0 
              })}
            </div>
            <div className="text-xs text-blue-100 opacity-90">
              Valor total do pipeline
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {leads.map((lead) => (
          <LeadCard 
            key={lead.id} 
            lead={lead}
            onEdit={onEditLead}
            activitiesCount={leadCounts[lead.id]?.activities || 0}
            tagsCount={leadCounts[lead.id]?.tags || 0}
          />
        ))}
        
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">Nenhum lead</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;