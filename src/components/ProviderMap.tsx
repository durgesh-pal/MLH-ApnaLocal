import React, { useEffect, useState } from 'react';
import { Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { JAUNPUR_CENTER, JAUNPUR_LOCALITIES } from '../lib/localities';

interface Provider {
  id: string;
  businessName: string;
  name: string;
  locality: string;
  category: string;
  price: string;
  rating: number;
}

interface ProviderMapProps {
  providers: Provider[];
  selectedLocality?: string;
}

const ProviderMap: React.FC<ProviderMapProps> = ({ providers, selectedLocality }) => {
  const map = useMap();
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Get coordinates for a provider based on their locality
  const getProviderCoords = (localityName: string) => {
    const loc = JAUNPUR_LOCALITIES.find(l => l.name === localityName);
    if (!loc) return JAUNPUR_CENTER;
    
    // Add a tiny random offset so markers don't overlap perfectly if in same locality
    return {
      lat: loc.lat + (Math.random() - 0.5) * 0.005,
      lng: loc.lng + (Math.random() - 0.5) * 0.005
    };
  };

  useEffect(() => {
    if (!map) return;

    if (selectedLocality) {
      const loc = JAUNPUR_LOCALITIES.find(l => l.name === selectedLocality);
      if (loc) {
        map.panTo({ lat: loc.lat, lng: loc.lng });
        map.setZoom(14);
      }
    } else {
      map.panTo(JAUNPUR_CENTER);
      map.setZoom(12);
    }
  }, [map, selectedLocality]);

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={JAUNPUR_CENTER}
        defaultZoom={12}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      >
        {providers.map((provider) => {
          const coords = getProviderCoords(provider.locality);
          return (
            <AdvancedMarker
              key={provider.id}
              position={coords}
              onClick={() => setSelectedProviderId(provider.id)}
              title={provider.businessName}
            >
              <Pin 
                background={'#0f172a'} 
                glyphColor={'#ffffff'} 
                borderColor={'#1e293b'} 
              />
            </AdvancedMarker>
          );
        })}

        {selectedProviderId && selectedProvider && (
          <InfoWindow
            position={getProviderCoords(selectedProvider.locality)}
            onCloseClick={() => setSelectedProviderId(null)}
          >
            <div className="p-2 max-w-[200px]">
              <h3 className="font-bold text-slate-900 text-sm">{selectedProvider.businessName}</h3>
              <p className="text-slate-500 text-xs mb-2">{selectedProvider.category} · {selectedProvider.locality}</p>
              <div className="flex items-center justify-between">
                <span className="text-slate-900 font-bold text-xs">{selectedProvider.price}</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                  ⭐ {selectedProvider.rating || 'New'}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
};

export default ProviderMap;
