import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const Card = ({ 
  children, 
  className = '', 
  padding = 'md',
  hover = false,
  onClick
}: CardProps) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  
  const hoverClass = hover ? 'transition-shadow hover:shadow-md' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';
  
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 ${paddingClasses[padding]} ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader = ({ title, subtitle, action, className = '' }: CardHeaderProps) => {
  return (
    <div className={`flex justify-between items-start mb-4 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className = '' }: CardFooterProps) => {
  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
};

export default Card;