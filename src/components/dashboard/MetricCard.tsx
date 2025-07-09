import React from 'react';
import Card from '../ui/Card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  changePeriod?: string;
  className?: string;
}

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  change, 
  changePeriod = 'vs last week', 
  className = '' 
}: MetricCardProps) => {
  const isPositiveChange = change && change > 0;
  const isNegativeChange = change && change < 0;
  
  return (
    <Card className={`h-full ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          
          {change !== undefined && (
            <div className="mt-2 flex items-center text-sm">
              {isPositiveChange && (
                <span className="text-green-600 flex items-center">
                  <ArrowUpIcon size={16} className="mr-1" />
                  {Math.abs(change)}%
                </span>
              )}
              {isNegativeChange && (
                <span className="text-red-600 flex items-center">
                  <ArrowDownIcon size={16} className="mr-1" />
                  {Math.abs(change)}%
                </span>
              )}
              {change === 0 && (
                <span className="text-gray-500">No change</span>
              )}
              <span className="ml-1 text-gray-500">
                {changePeriod}
              </span>
            </div>
          )}
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default MetricCard;