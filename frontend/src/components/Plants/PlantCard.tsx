import React from 'react';
import { Card, Box, IconButton, CardContent, Typography, Tooltip, Chip, CardActions } from '@mui/material';
import { Search, MapPin, Droplet, AlarmClock, Scissors, Camera, Skull } from 'lucide-react';
import { Plant } from '../../types';
import { getToxicityColor } from '../../utils/formatUtils';

interface PlantCardProps {
  plant: Plant;
  onViewDetails: (id: number) => void;
  onOpenGallery: (plant: Plant, path: string) => void;
  onWater: (id: number) => void;
  onSnooze: (id: number) => void;
  onPropagate: (id: number) => void;
  onUpload: (id: number) => void;
  isProcessing: boolean;
}

const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  onViewDetails,
  onOpenGallery,
  onWater,
  onSnooze,
  onPropagate,
  onUpload,
  isProcessing,
}) => {
  const toxicityColor = getToxicityColor(plant.plantType?.petToxicity);

  return (
    <Card sx={{ height: '100%', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
      <Box sx={{ height: 180, bgcolor: '#e0e0e0', position: 'relative', overflow: 'hidden' }}>
        {plant.imagePath ? (
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={`/uploads/thumb_${plant.imagePath}?t=${new Date().getTime()}`}
              alt={plant.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'pointer',
                transform: `rotate(${plant.rotation || 0}deg)`
              }}
              onClick={() => onOpenGallery(plant, plant.imagePath)}
            />
            <IconButton
              size="small"
              sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'white' } }}
              onClick={() => onOpenGallery(plant, plant.imagePath)}
            >
              <Search size={14} />
            </IconButton>
          </Box>
        ) : (
          <Box 
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }} 
            onClick={() => onViewDetails(plant.id)}
          >
            <Box component="span" sx={{ color: '#999' }}>
               {/* Icon placeholder since we can't easily import ImageIcon here without more thought, 
                   but let's just use what's available */}
               <Camera size={40} />
            </Box>
            <Typography variant="caption" color="textSecondary">No Photo</Typography>
          </Box>
        )}
        {plant.goodForTerrariums && (
          <Chip label="Terrarium" size="small" color="secondary" sx={{ position: 'absolute', top: 8, right: 8, height: 20, fontSize: '0.65rem' }} />
        )}
        <Box
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'pointer' }}
          onClick={(e) => { if (e.target === e.currentTarget) onViewDetails(plant.id); }}
        />
      </Box>
      <CardContent sx={{ pb: 1 }} onClick={() => onViewDetails(plant.id)} style={{ cursor: 'pointer' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
            #{plant.id} • {plant.plantType?.name || 'Unknown Type'}
          </Typography>
          {toxicityColor && (
            <Tooltip title={`Toxicity: ${plant.plantType?.petToxicity}`}>
              <Box component="span" sx={{ display: 'flex' }}><Skull size={14} color={toxicityColor} /></Box>
            </Tooltip>
          )}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {plant.name}
        </Typography>
        {plant.plantType?.scientificName && (
          <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', display: 'block', mb: 1 }}>
            {plant.plantType.scientificName}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <MapPin size={14} />
          <Typography variant="body2" color="textSecondary">{plant.location || 'Unknown'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Droplet size={14} color={plant.plantStatus === 'Needs Attention' || plant.plantStatus === 'Water Overdue' ? '#ed6c02' : '#2e7d32'} />
          <Typography variant="body2" sx={{ fontWeight: 500, color: plant.plantStatus === 'Needs Attention' || plant.plantStatus === 'Water Overdue' ? 'warning.main' : 'text.primary' }}>
            Next: {plant.nextWaterDate ? new Date(plant.nextWaterDate).toLocaleDateString() : 'TBD'}
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
        <Box>
          <Tooltip title="Water Now"><IconButton size="small" color="primary" onClick={(e) => {e.stopPropagation(); onWater(plant.id)}} disabled={isProcessing}><Droplet size={18} /></IconButton></Tooltip>
          <Tooltip title="Snooze 1 Day"><IconButton size="small" color="info" onClick={(e) => {e.stopPropagation(); onSnooze(plant.id)}} disabled={isProcessing}><AlarmClock size={18} /></IconButton></Tooltip>
          <Tooltip title="Propagate"><IconButton size="small" color="secondary" onClick={(e) => {e.stopPropagation(); onPropagate(plant.id)}} disabled={isProcessing}><Scissors size={18} /></IconButton></Tooltip>
        </Box>
        <IconButton size="small" onClick={(e) => {e.stopPropagation(); onUpload(plant.id)}} disabled={isProcessing}><Camera size={18} /></IconButton>
      </CardActions>
    </Card>
  );
};

export default PlantCard;
