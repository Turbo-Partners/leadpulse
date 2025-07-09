import React from 'react';
import { CadenceStep } from '../../types';
import { Mail, Phone, Linkedin, Calendar, Clock } from 'lucide-react';

interface CadenceScheduleProps {
  steps: CadenceStep[];
}

const CadenceSchedule = ({ steps }: CadenceScheduleProps) => {
  // Sort steps by day
  const sortedSteps = [...steps].sort((a, b) => a.day - b.day);
  
  const getStepIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail size={16} className="text-blue-500" />;
      case 'call':
        return <Phone size={16} className="text-green-500" />;
      case 'linkedin':
        return <Linkedin size={16} className="text-blue-600" />;
      case 'meeting':
        return <Calendar size={16} className="text-purple-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };
  
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      <div className="space-y-6">
        {sortedSteps.map((step, index) => (
          <div key={index} className="relative flex items-start">
            <div className={`absolute left-4 w-0.5 h-full ${index === 0 ? 'top-0' : '-top-6'} ${step.completed ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
            
            <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step.completed 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : 'bg-white border-gray-300 text-gray-500'
            }`}>
              {step.completed ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              ) : (
                getStepIcon(step.type)
              )}
            </div>
            
            <div className="ml-4 min-w-0 flex-1 pt-1.5">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-gray-900">
                  Day {step.day}: {step.type}
                </p>
                {step.completed && (
                  <p className="text-xs text-gray-500">
                    {step.sentCount} sent
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500">{step.subject}</p>
              
              {step.responseCount > 0 && (
                <p className="mt-1 text-xs text-green-600">
                  {step.responseCount} responses ({Math.round((step.responseCount / step.sentCount) * 100)}% rate)
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CadenceSchedule;