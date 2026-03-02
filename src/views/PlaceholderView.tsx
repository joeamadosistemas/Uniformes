import React from 'react';
import { Construction } from 'lucide-react';

interface Props {
  title: string;
}

export const PlaceholderView: React.FC<Props> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <Construction size={48} className="text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md">
        Este módulo está atualmente em desenvolvimento e estará disponível em breve.
      </p>
    </div>
  );
};
