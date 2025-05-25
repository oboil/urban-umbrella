export interface BuildingInfo {
  id: string;
  name: string;
  displayName: string;
}

export const buildingNames: BuildingInfo[] = [
  { id: 'seongho', name: '성호관', displayName: '성호관' },
  { id: 'paldal', name: '팔달관', displayName: '팔달관' },
  { id: 'dasan', name: '다산관', displayName: '다산관' }
];

export const getBuildingName = (buildingId: string): string => {
  const building = buildingNames.find(b => b.id === buildingId);
  return building ? building.name : '강의실';
};

export const getBuildingDisplayName = (buildingId: string): string => {
  const building = buildingNames.find(b => b.id === buildingId);
  return building ? building.displayName : '전체';
};

export const getAllBuildingNames = () => buildingNames.map(b => b.name);

export const getAllBuildingIds = () => buildingNames.map(b => b.id);