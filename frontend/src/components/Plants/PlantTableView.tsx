import React from 'react';
import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Box, Chip, IconButton, Tooltip } from '@mui/material';
import { Droplet, AlarmClock, Camera as CameraIcon } from 'lucide-react';
import { Plant } from '../../types';

interface PlantTableViewProps {
  plants: Plant[];
  onViewDetails: (id: number) => void;
  onWater: (id: number) => void;
  onSnooze: (id: number) => void;
  onUpload: (id: number) => void;
  isProcessing: boolean;
}

const PlantTableView: React.FC<PlantTableViewProps> = ({
  plants,
  onViewDetails,
  onWater,
  onSnooze,
  onUpload,
  isProcessing,
}) => {
  return (
    <TableContainer component={Paper} elevation={1}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell width={50}>#</TableCell>
            <TableCell width={60}>Img</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Next Water</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {plants.map((plant) => (
            <TableRow 
              key={plant.id} hover id={`plant-${plant.id}`} 
              onClick={() => onViewDetails(plant.id)} 
              sx={{ cursor: 'pointer' }}
            >
              <TableCell>{plant.id}</TableCell>
              <TableCell>
                {plant.imagePath ? (
                  <Box
                    component="img"
                    src={`/uploads/thumb_${plant.imagePath}`}
                    sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', transform: `rotate(${plant.rotation || 0}deg)` }}
                    alt={plant.name}
                  />
                ) : <Box sx={{ width: 40, height: 40, bgcolor: '#eee', borderRadius: 1 }} />}
              </TableCell>
              <TableCell sx={{ fontWeight: 500 }}>{plant.name}</TableCell>
              <TableCell>{plant.plantType?.name}</TableCell>
              <TableCell>{plant.location}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip
                    label={plant.plantStatus}
                    size="small"
                    color={plant.plantStatus === 'Needs Attention' || plant.plantStatus === 'Water Overdue' ? 'warning' : 'success'}
                    variant="outlined"
                  />
                  <Chip
                    label={plant.currentStage}
                    size="small"
                    color={plant.currentStage === 'Propagating' ? 'secondary' : 'default'}
                    variant="filled"
                  />
                </Box>
              </TableCell>
              <TableCell>
                {plant.nextWaterDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: new Date(plant.nextWaterDate) <= new Date() ? 'error.main' : 'inherit' }}>
                    <Droplet size={12} />
                    {new Date(plant.nextWaterDate).toLocaleDateString()}
                  </Box>
                )}
              </TableCell>
              <TableCell align="right">
                <IconButton 
                  size="small" 
                  onClick={(e) => {e.stopPropagation(); onWater(plant.id)}}
                  disabled={isProcessing}
                >
                  <Droplet size={16} />
                </IconButton>
                <Tooltip title="Snooze 1 Day">
                  <IconButton 
                    size="small" 
                    onClick={(e) => {e.stopPropagation(); onSnooze(plant.id)}}
                    disabled={isProcessing}
                  >
                    <AlarmClock size={16} />
                  </IconButton>
                </Tooltip>
                <IconButton 
                  size="small" 
                  onClick={(e) => {e.stopPropagation(); onUpload(plant.id)}}
                  disabled={isProcessing}
                >
                  <CameraIcon size={16} />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PlantTableView;
