import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { JAUNPUR_LOCALITIES } from '../lib/localities';

interface LocationPickerProps {
  selectedLocality: string;
  onLocalityChange: (locality: string) => void;
  className?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  selectedLocality, 
  onLocalityChange,
  className = ""
}) => {
  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white cursor-pointer hover:bg-white/20 transition-all group">
        <MapPin size={18} className="text-slate-200 group-hover:text-white" />
        <select
          value={selectedLocality}
          onChange={(e) => onLocalityChange(e.target.value)}
          className="appearance-none bg-transparent border-none text-white font-medium focus:ring-0 cursor-pointer pr-6"
        >
          <option value="" className="text-slate-900">All of Jaunpur</option>
          {JAUNPUR_LOCALITIES.map((locality) => (
            <option key={locality.name} value={locality.name} className="text-slate-900">
              {locality.name}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 pointer-events-none text-slate-200" />
      </div>
    </div>
  );
};

export default LocationPicker;
