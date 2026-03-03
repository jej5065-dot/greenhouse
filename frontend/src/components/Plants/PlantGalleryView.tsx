import React from 'react';
import { Grid } from '@mui/material';
import { Plant } from '../../types';
import PlantCard from './PlantCard';

interface PlantGalleryViewProps {
  plants: Plant[];
  onViewDetails: (id: number) => void;
  onOpenGallery: (plant: Plant, path: string) => void;
  onWater: (id: number) => void;
  onSnooze: (id: number) => void;
  onPropagate: (id: number) => void;
  onUpload: (id: number) => void;
  isProcessing: boolean;
}

const PlantGalleryView: React.FC<PlantGalleryViewProps> = ({
  plants,
  ...props
}) => {
  return (
    <Grid container spacing={2}>
      {plants.map((plant) => (
        <Grid item xs={12} sm={6} md={4} key={plant.id} id={`plant-${plant.id}`}>
          <PlantCard plant={plant} {...props} />
        </Grid>
      ))}
    </Grid>
  );
};

export default PlantGalleryView;
