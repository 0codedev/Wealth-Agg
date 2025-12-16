import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  subValue?: string;
  subValueColor?: string; // text-green-600, etc.
  icon: LucideIcon;
  iconColor: string; // bg-blue-100 text-blue-600
  isPrivacyMode?: boolean;
  valueClassName?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subValue,
  subValueColor = 'text-slate-500 dark:text-slate-400',
  icon: Icon,
  iconColor,
  isPrivacyMode = false,
  valueClassName = '',
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 flex items-start justify-between transition-all hover:shadow-md hover:dark:border-slate-700">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className={`text-2xl font-bold text-slate-900 dark:text-white tracking-tight ${valueClassName}`}>
          {isPrivacyMode ? '••••••' : value}
        </h3>
        {subValue && (
          <p className={`text-sm font-medium mt-2 ${isPrivacyMode ? 'opacity-0' : ''} ${subValueColor}`}>
            {subValue}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${iconColor} bg-opacity-20 dark:bg-opacity-20`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

export default SummaryCard;