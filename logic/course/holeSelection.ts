import { GeoEntity } from '../../types';

export const handleHoleSelection = (
  n: number,
  entities: GeoEntity<any>[],
  mapInstance: any,
  setActiveEntityId: (id: string | null) => void,
  setSelectedHole: (n: number) => void
) => {
  setActiveEntityId(null);
  setSelectedHole(n);
  
  const pin = entities.find(e => {
    const h = e.metadata?.holeNumber ?? (e as any).holeNumber;
    return e.type === 'hole' && h === n;
  });

  if (pin?.location && mapInstance) {
    mapInstance.panTo(pin.location);
    mapInstance.setZoom(19);
  }
};