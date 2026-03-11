import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Autocomplete, Box, Typography, IconButton, Button, Collapse,
  Tooltip, useTheme, useMediaQuery
} from '@mui/material';
import { X, Sparkles, Camera as CameraIcon, HelpCircle, RotateCw } from 'lucide-react';
import { Plant, PlantType } from '../../types';

interface QuickAddDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (plant: Partial<Plant>, file: File | null) => void;
  onIdentify: (file: File, name?: string) => Promise<any>;
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
  const [identifiedType, setIdentifiedType] = useState<string | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionName, setCorrectionName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (open) {
      setNewPlant({ 
        name: '', wateringFrequencyDays: 7, location: '',
        goodForTerrariums: false, currentStage: 'Active',
        plantStatus: 'Healthy'
      });
      setInitialFile(null);
      setIdentifiedType(null);
      setShowCorrection(false);
      setCorrectionName('');
      setIsIdentifying(false);
    }
  }, [open]);

  const handleAdd = () => {
    onAdd(newPlant, initialFile);
  };

  const handleIdentifyClick = async () => {
    if (!initialFile) return;
    setIsIdentifying(true);
    try {
      const result = await onIdentify(initialFile, correctionName || undefined);
      if (result) {
        setIdentifiedType(result.commonName || result.name);
        setShowCorrection(false);
        setCorrectionName('');
        setNewPlant(prev => ({
          ...prev,
          name: prev.name && prev.name.trim() !== '' ? prev.name : (result.name || prev.name),
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
    setIdentifiedType(null);
    setShowCorrection(false);
    setCorrectionName('');
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setInitialFile(event.target.files[0]);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={resetAndClose}
      fullWidth
      maxWidth="xs"
      fullScreen={isMobile}
    >
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Quick Add Plant
        {isMobile && (
          <IconButton onClick={resetAndClose} size="small" edge="end">
            <X size={24} />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2, textAlign: 'center', bgcolor: '#fafafa' }}>
          {initialFile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography variant="body2" noWrap sx={{ maxWidth: 150, fontWeight: 500 }}>{initialFile.name}</Typography>
                <IconButton size="small" color="error" onClick={() => { setInitialFile(null); setIdentifiedType(null); }}><X size={14} /></IconButton>
              </Box>
              
              {identifiedType && !showCorrection && (
                <Box sx={{ bgcolor: 'success.light', color: 'success.contrastText', px: 2, py: 1, borderRadius: 2, width: '100%' }}>
                  <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>AI identified this as:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{identifiedType}</Typography>
                  <Button 
                    size="small" color="inherit" 
                    sx={{ mt: 0.5, fontSize: '0.65rem', textTransform: 'none' }}
                    onClick={() => setShowCorrection(true)}
                  >
                    Wrong plant?
                  </Button>
                </Box>
              )}

              <Collapse in={!identifiedType || showCorrection} sx={{ width: '100%' }}>
                {showCorrection && (
                  <TextField
                    fullWidth size="small" label="What plant is this?"
                    placeholder="e.g. Pothos N'Joy"
                    value={correctionName}
                    onChange={(e) => setCorrectionName(e.target.value)}
                    sx={{ mb: 2, bgcolor: 'white' }}
                  />
                )}
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  startIcon={showCorrection ? <RotateCw size={16} /> : <Sparkles size={16} />}
                  onClick={handleIdentifyClick}
                  disabled={isIdentifying || isProcessing}
                >
                  {isIdentifying ? 'Identifying...' : (showCorrection ? 'Re-Identify' : 'Identify with AI')}
                </Button>
              </Collapse>
            </Box>
          ) : (
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<CameraIcon size={16} />} 
              onClick={() => fileInputRef.current?.click()}
            >
              Attach Initial Photo
            </Button>
          )}
        </Box>

        <TextField 
          fullWidth label="Name" sx={{ mb: 2 }} 
          value={newPlant.name} 
          onChange={(e) => setNewPlant({...newPlant, name: e.target.value})} 
          size="small" 
        />
        <Autocomplete 
          sx={{ mb: 2 }}
          freeSolo
          forcePopupIcon
          options={plantTypes} 
          getOptionLabel={(o) => {
            if (typeof o === 'string') return o;
            return o.name || '';
          }} 
          value={newPlant.plantType || null}
          onInputChange={(_, n) => {
            if (!n) {
              setNewPlant({ ...newPlant, plantType: undefined });
              return;
            }
            // Check if this name matches an existing type
            const existing = plantTypes.find(t => t.name?.toLowerCase() === n.toLowerCase());
            if (existing) {
              setNewPlant({
                ...newPlant,
                plantType: existing,
                wateringFrequencyDays: existing.defaultWateringFrequencyDays || 7
              });
            } else {
              setNewPlant({
                ...newPlant,
                plantType: { name: n } as any
              });
            }
          }}
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
          renderInput={(p) => (
            <TextField 
              {...p} label="Plant Type" size="small" 
              InputProps={{
                ...p.InputProps,
                endAdornment: (
                  <React.Fragment>
                    <Tooltip title="AI will provide care instructions if you identify the plant or select a known type.">
                      <HelpCircle size={14} style={{ marginRight: 8, color: '#999' }} />
                    </Tooltip>
                    {p.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )} 
        />
        <Autocomplete 
          freeSolo 
          options={locations} 
          value={newPlant.location} 
          onInputChange={(_, n) => setNewPlant({...newPlant, location: n})} 
          renderInput={(p) => <TextField {...p} label="Location" fullWidth size="small" />} 
        />
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
