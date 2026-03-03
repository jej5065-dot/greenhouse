import { useState, useEffect, useCallback } from 'react';
import { Plant, PlantSummary, PlantType } from '../types';
import { plantApi } from '../api/plantApi';

export const usePlants = (initialSearchTerm = '', sortBy = 'nextWaterDate') => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantTypes, setPlantTypes] = useState<PlantType[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [summary, setSummary] = useState<PlantSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlants = useCallback(async (search = '') => {
    setIsLoading(true);
    try {
      const res = await plantApi.fetchPlants(search);
      let data = res.data;
      
      data.sort((a: any, b: any) => {
        if (!a[sortBy]) return 1;
        if (!b[sortBy]) return -1;
        return a[sortBy] > b[sortBy] ? 1 : -1;
      });

      setPlants(data);
    } catch (err) {
      setError('Failed to fetch plants');
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await plantApi.fetchLocations();
      setLocations(res.data);
    } catch (err) {
      console.error('Failed to fetch locations', err);
    }
  }, []);

  const fetchPlantTypes = useCallback(async () => {
    try {
      const res = await plantApi.fetchPlantTypes();
      setPlantTypes(res.data);
    } catch (err) {
      console.error('Failed to fetch plant types', err);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await plantApi.fetchSummary();
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch summary', err);
    }
  }, []);

  const refreshAll = useCallback(async (searchTerm = '') => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchPlants(searchTerm),
        fetchLocations(),
        fetchPlantTypes(),
        fetchSummary()
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlants, fetchLocations, fetchPlantTypes, fetchSummary]);

  useEffect(() => {
    refreshAll(initialSearchTerm);
    
    const interval = setInterval(() => {
      fetchPlants(initialSearchTerm);
      fetchSummary();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [sortBy, initialSearchTerm, refreshAll, fetchPlants, fetchSummary]);

  return {
    plants,
    plantTypes,
    locations,
    summary,
    isLoading,
    error,
    refreshAll,
    fetchPlants,
    fetchSummary,
    fetchLocations,
    fetchPlantTypes
  };
};
