import React from 'react';
import Card, { CardHeader } from '../ui/Card';
import Badge from '../ui/Badge';
import { Mail, Clock, Check, X } from 'lucide-react';
import { Cadence, CadenceStep } from '../../types';

interface CadenceCardProps {
  cadence: Cadence;
  onEdit: (id: string) => void;
}

const CadenceCard = ({ cadence, onEdit }: CadenceCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'paused':
        return <Badge variant="warning">Paused</Badge>;
      default:
        return null;
    }
  };
  
  const totalSent = cadence.steps.reduce((acc, step) => acc + (step.sentCount || 0), 0);
  const totalResponses = cadence.steps.reduce((acc, step) => acc + (step.responseCount || 0), 0);
  const responseRate = totalSent ? Math.round((totalResponses / totalSent) * 100) : 0;
  
  return (
    <Card hover onClick={() => onEdit(cadence.id)}>
      <CardHeader 
        title={cadence.name} 
        subtitle={`${cadence.steps.length} steps`}
        action={getStatusBadge(cadence.status)}
      />
      
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <div className="flex items-center text-gray-500">
            <Mail size={16} className="mr-1" />
            <span>{totalSent} sent</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Clock size={16} className="mr-1" />
            <span>{cadence.duration} days</span>
          </div>
          <div className="flex items-center text-gray-500">
            <span>{responseRate}% response</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {cadence.steps.slice(0, 3).map((step, index) => (
            <CadenceStepItem key={index} step={step} index={index} />
          ))}
          
          {cadence.steps.length > 3 && (
            <div className="text-xs text-center text-gray-500 pt-1">
              +{cadence.steps.length - 3} more steps
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

interface CadenceStepItemProps {
  step: CadenceStep;
  index: number;
}

const CadenceStepItem = ({ step, index }: CadenceStepItemProps) => {
  return (
    <div className="flex items-center text-xs p-2 bg-gray-50 rounded">
      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-700">{step.subject}</div>
        <div className="text-gray-500">Day {step.day}: {step.type}</div>
      </div>
      <div className="ml-2">
        {step.completed ? (
          <Check size={14} className="text-green-500" />
        ) : (
          <Clock size={14} className="text-gray-400" />
        )}
      </div>
    </div>
  );
};

export default CadenceCard;