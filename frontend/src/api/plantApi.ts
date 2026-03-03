import axios from 'axios';
import { Plant, PlantSummary, PlantType, PlantUpdate } from '../types';

export const plantApi = {
  fetchPlants: (search = '') => axios.get<Plant[]>(`/api/plants${search ? `?search=${search}` : ''}`),
  fetchPlantDetails: (id: number) => axios.get<Plant>(`/api/plants/${id}`),
  fetchLocations: () => axios.get<string[]>('/api/plants/locations'),
  fetchSummary: () => axios.get<PlantSummary>('/api/plants/summary'),
  fetchPlantTypes: () => axios.get<PlantType[]>('/api/plant-types'),
  
  addPlant: (plantData: Partial<Plant>) => axios.post<Plant>('/api/plants', plantData),
  updatePlant: (id: number, plantData: Partial<Plant>) => axios.put(`/api/plants/${id}`, plantData),
  deletePlant: (id: number) => axios.delete(`/api/plants/${id}`),
  
  waterPlant: (id: number) => axios.post(`/api/plants/${id}/water`),
  snoozePlant: (id: number) => axios.post(`/api/plants/${id}/snooze`),
  propagatePlant: (id: number) => axios.post(`/api/plants/${id}/propagate`),
  
  addUpdate: (plantId: number, update: Partial<PlantUpdate>) => axios.post<PlantUpdate>(`/api/plants/${plantId}/updates`, update),
  updateUpdate: (updateId: number, update: Partial<PlantUpdate>) => axios.put(`/api/plants/updates/${updateId}`, update),
  deleteUpdate: (updateId: number) => axios.delete(`/api/plants/updates/${updateId}`),
  
  uploadImage: (updateId: number, formData: FormData) => axios.post(`/api/plants/updates/${updateId}/images`, formData),
  deleteImage: (imageId: number) => axios.delete(`/api/plants/images/${imageId}`),
  updateImageLabel: (imageId: number, label: string) => axios.put(`/api/plants/images/${imageId}/label`, label, {
    headers: { 'Content-Type': 'text/plain' }
  }),
  rotateImage: (imageId: number, rotation: number) => axios.put(`/api/plants/images/${imageId}/rotation`, rotation, {
    headers: { 'Content-Type': 'application/json' }
  }),
  rotateMainImage: (plantId: number, rotation: number) => axios.put(`/api/plants/${plantId}/rotation`, rotation, {
    headers: { 'Content-Type': 'application/json' }
  }),
  setCoverPhoto: (plantId: number, imageId: number) => axios.post(`/api/plants/${plantId}/cover/${imageId}`),
  
  importPlantTypes: (formData: FormData) => axios.post('/api/plant-types/import', formData),
};
