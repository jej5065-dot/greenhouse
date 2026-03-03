import React from 'react';
import { Grid, Card, Box, Typography } from '@mui/material';
import { Image as ImageIcon } from 'lucide-react';
import { Plant } from '../../types';

interface PlantCompactViewProps {
  plants: Plant[];
  onViewDetails: (id: number) => void;
}

const PlantCompactView: React.FC<PlantCompactViewProps> = ({
  plants,
  onViewDetails,
}) => {
  return (
    <Grid container spacing={1}>
      {plants.map((plant) => (
        <Grid item xs={4} sm={3} md={2} key={plant.id} id={`plant-${plant.id}`}>
          <Card 
            sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }} 
            onClick={() => onViewDetails(plant.id)}
          >
            <Box sx={{ pt: '100%', position: 'relative', bgcolor: '#eee' }}>
              {plant.imagePath ? (
                <img 
                  src={`/uploads/thumb_${plant.imagePath}`}
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    transform: `rotate(${plant.rotation || 0}deg)` 
                  }}
                  alt={plant.name}
                />
              ) : (
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <ImageIcon size={24} color="#999" />
                </Box>
              )}
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', p: 0.5 }}>
                 <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{plant.name}</Typography>
                 <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>#{plant.id}</Typography>
              </Box>
              {(plant.plantStatus === 'Needs Attention' || plant.plantStatus === 'Water Overdue') && (
                <Box sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'warning.main', borderRadius: '50%', width: 8, height: 8 }} />
              )}
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default PlantCompactView;
