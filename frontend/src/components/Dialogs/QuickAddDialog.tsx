import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Autocomplete, Box, Typography, IconButton, Button
} from '@mui/material';
import { X, Sparkles, Camera as CameraIcon } from 'lucide-react';
import { Plant, PlantType } from '../../types';

interface QuickAddDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (plant: Partial<Plant>, file: File | null) => void;
  onIdentify: (file: File) => Promise<any>;
  plantTypes: PlantType[];
  locations: string[];
  isProcessing: boolean;
}

const QuickAddDialog: React.FC<QuickAddDialogProps> = ({
  open,
  onClose,
  onAdd,
  onIdentify,
  plantTypes,
  locations,
  isProcessing
}) => {
  const [newPlant, setNewPlant] = useState<Partial<Plant>>({ 
    name: '', wateringFrequencyDays: 7, location: '',
    goodForTerrariums: false, currentStage: 'Active',
    plantStatus: 'Healthy'
  });
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);

  const handleAdd = () => {
    onAdd(newPlant, initialFile);
  };

  const handleIdentifyClick = async () => {
    if (!initialFile) return;
    setIsIdentifying(true);
    try {
      const result = await onIdentify(initialFile);
      if (result) {
        setNewPlant(prev => ({
          ...prev,
          name: result.name || prev.name,
          wateringFrequencyDays: result.wateringFrequencyDays || prev.wateringFrequencyDays,
          plantType: {
            name: result.commonName || result.name,
            scientificName: result.scientificName,
            petToxicity: result.petToxicity,
            careInstructions: result.careInstructions,
            propagationInstructions: result.propagationInstructions,
            defaultWateringFrequencyDays: result.wateringFrequencyDays
          } as any
        }));
      }
    } finally {
      setIsIdentifying(false);
    }
  };

  const resetAndClose = () => {
    setNewPlant({ 
      name: '', wateringFrequencyDays: 7, location: '',
      goodForTerrariums: false, currentStage: 'Active',
      plantStatus: 'Healthy'
    });
    setInitialFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={resetAndClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 'bold' }}>Quick Add Plant</DialogTitle>
      <DialogContent>
        <TextField 
          fullWidth label="Name" sx={{ mt: 1 }} 
          value={newPlant.name} 
          onChange={(e) => setNewPlant({...newPlant, name: e.target.value})} 
          size="small" 
        />
        <Autocomplete 
          sx={{ mt: 2 }}
          freeSolo
          forcePopupIcon
          options={plantTypes} 
          getOptionLabel={(o) => {
            if (typeof o === 'string') return o;
            return o.name || '';
          }} 
          value={newPlant.plantType || null}
          onChange={(_, n) => {
            let val: any = n;
            if (typeof n === 'string') {
              val = { name: n };
            }
            setNewPlant({
              ...newPlant, 
              plantType: val || undefined,
              wateringFrequencyDays: val?.defaultWateringFrequencyDays || 7
            });
          }}
          renderInput={(p) => <TextField {...p} label="Plant Type" size="small" />} 
        />
        <Autocomplete 
          freeSolo 
          options={locations} 
          value={newPlant.location} 
          onInputChange={(_, n) => setNewPlant({...newPlant, location: n})} 
          renderInput={(p) => <TextField {...p} label="Location" fullWidth sx={{ mt: 2 }} size="small" />} 
        />
        
        <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2, textAlign: 'center' }}>
          {initialFile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>{initialFile.name}</Typography>
                <IconButton size="small" color="error" onClick={() => setInitialFile(null)}><X size={14} /></IconButton>
              </Box>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<Sparkles size={16} />}
                onClick={handleIdentifyClick}
                disabled={isIdentifying || isProcessing}
              >
                {isIdentifying ? 'Identifying...' : 'Identify with AI'}
              </Button>
            </Box>
          ) : (
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<CameraIcon size={16} />} 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e: any) => setInitialFile(e.target.files[0]);
                input.click();
              }}
            >
              Attach Initial Photo
            </Button>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={resetAndClose} color="inherit">Cancel</Button>
        <Button onClick={handleAdd} variant="contained" disabled={isProcessing || isIdentifying}>
          {isProcessing ? 'Adding...' : 'Add Plant'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickAddDialog;
