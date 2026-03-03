import { useState, useCallback } from 'react';
import { plantApi } from '../api/plantApi';
import { Plant, PlantUpdate } from '../types';

export const usePlantActions = (
  refreshPlants: (searchTerm?: string) => Promise<void>,
  refreshSummary: () => Promise<void>,
  refreshLocations?: () => Promise<void>,
  searchTerm = ''
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = useCallback(async (action: () => Promise<any>, successCallback?: () => void) => {
    setIsProcessing(true);
    try {
      await action();
      await refreshPlants(searchTerm);
      await refreshSummary();
      if (refreshLocations) await refreshLocations();
      if (successCallback) successCallback();
    } catch (error) {
      console.error('Action failed', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [refreshPlants, refreshSummary, refreshLocations, searchTerm]);

  const waterPlant = useCallback((id: number, successCallback?: () => void) => 
    handleAction(() => plantApi.waterPlant(id), successCallback), 
  [handleAction]);

  const snoozePlant = useCallback((id: number, successCallback?: () => void) => 
    handleAction(() => plantApi.snoozePlant(id), successCallback), 
  [handleAction]);

  const propagatePlant = useCallback((id: number, successCallback?: () => void) => 
    handleAction(() => plantApi.propagatePlant(id), successCallback), 
  [handleAction]);

  const deletePlant = useCallback((id: number, successCallback?: () => void) => 
    handleAction(() => plantApi.deletePlant(id), successCallback), 
  [handleAction]);

  const updatePlant = useCallback((id: number, plantData: Partial<Plant>, successCallback?: () => void) => 
    handleAction(() => plantApi.updatePlant(id, plantData), successCallback), 
  [handleAction]);

  const addPlant = useCallback(async (plantData: Partial<Plant>, initialFile: File | null, successCallback?: (createdPlant: Plant) => void) => {
    setIsProcessing(true);
    try {
      const response = await plantApi.addPlant(plantData);
      const createdPlant = response.data;
      
      if (initialFile) {
        const date = new Date().toISOString().split('T')[0];
        const updateRes = await plantApi.addUpdate(createdPlant.id, { date, notes: 'Initial photo' });
        const formData = new FormData();
        formData.append('file', initialFile);
        await plantApi.uploadImage(updateRes.data.id, formData);
      }

      await refreshPlants(searchTerm);
      await refreshSummary();
      if (refreshLocations) await refreshLocations();
      if (successCallback) successCallback(createdPlant);
    } catch (error) {
      console.error('Add plant failed', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [refreshPlants, refreshSummary, refreshLocations, searchTerm]);

  return {
    isProcessing,
    waterPlant,
    snoozePlant,
    propagatePlant,
    deletePlant,
    updatePlant,
    addPlant
  };
};
