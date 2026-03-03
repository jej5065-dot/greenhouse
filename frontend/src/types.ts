export interface PlantType {
  id: number;
  name: string;
  scientificName: string;
  otherNames: string;
  petToxicity: string;
  careInstructions: string;
  propagationInstructions: string;
  defaultWateringFrequencyDays: number;
  exampleImagePath?: string;
}

export interface PlantImage {
  id: number;
  imagePath: string;
  label: string;
  rotation: number;
}

export interface PlantUpdate {
  id: number;
  date: string;
  notes: string;
  images: PlantImage[];
}

export interface Plant {
  id: number;
  guid: string;
  name: string;
  plantType?: PlantType;
  currentStage: string;
  plantStatus: string;
  nextWaterDate: string;
  lastWateredDate: string;
  location: string;
  imagePath: string;
  goodForTerrariums: boolean;
  wateringFrequencyDays: number;
  price?: number;
  originalPurchasePrice?: number;
  soldDate?: string;
  totalPropagationTime?: string;
  parent?: { id: number; name: string; guid: string };
  children?: { id: number; name: string; guid: string }[];
  updates: PlantUpdate[];
  rotation?: number;
}

export interface PlantSummary {
  totalPlants: number;
  needsAttention: number;
  propagating: number;
  readyToSell: number;
  needsWatering: number;
  distinctLocations: number;
  totalEstimatedValue: number;
}

export type ViewMode = 'gallery' | 'compact' | 'table';

export interface FullImageState {
  images: {
    path: string;
    rotation: number;
    label?: string;
    date?: string;
    notes?: string;
  }[];
  index: number;
}
