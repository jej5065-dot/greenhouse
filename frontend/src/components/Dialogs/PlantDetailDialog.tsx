import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, 
  IconButton, Tooltip, Tabs, Tab, Grid, TextField, Autocomplete, 
  FormControlLabel, Checkbox, Button, CircularProgress, Divider,
  InputAdornment, Card, CardContent, Chip
} from '@mui/material';
import { 
  Droplet, AlarmClock, Scissors, Trash2, Info, Sprout, History, 
  Settings, DollarSign, Download, RotateCw, Check, ExternalLink,
  Calendar, Camera as CameraIcon
} from 'lucide-react';
import { Plant, PlantType, PlantUpdate } from '../../types';
import { getToxicityColor, formatCurrency } from '../../utils/formatUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

interface PlantDetailDialogProps {
  open: boolean;
  plant: Plant | null;
  onClose: () => void;
  onUpdate: (plant: Plant) => void;
  onWater: (id: number) => void;
  onSnooze: (id: number) => void;
  onPropagate: (id: number) => void;
  onDelete: (id: number) => void;
  onRotateMain: (id: number, rotation: number) => void;
  onDownload: (path: string, label?: string) => void;
  onOpenGallery: (plant: Plant, path?: string) => void;
  onAddPhoto: () => void;
  onDeleteUpdate: (update: PlantUpdate) => void;
  onDeleteImage: (imageId: number) => void;
  onRotateImage: (imageId: number, rotation: number) => void;
  onSetCover: (plantId: number, imageId: number) => void;
  onEditUpdate: (update: PlantUpdate) => void;
  onUpdateLabel: (imageId: number, label: string) => void;
  plantTypes: PlantType[];
  locations: string[];
  isProcessing: boolean;
  initialTab?: number;
}

const PlantDetailDialog: React.FC<PlantDetailDialogProps> = ({
  open,
  plant,
  onClose,
  onUpdate,
  onWater,
  onSnooze,
  onPropagate,
  onDelete,
  onRotateMain,
  onDownload,
  onOpenGallery,
  onAddPhoto,
  onDeleteUpdate,
  onDeleteImage,
  onRotateImage,
  onSetCover,
  onEditUpdate,
  onUpdateLabel,
  plantTypes,
  locations,
  isProcessing,
  initialTab = 0
}) => {
  const [tab, setTab] = useState(initialTab);
  const [editedPlant, setEditedPlant] = useState<Plant | null>(null);

  React.useEffect(() => {
    if (plant) {
      setEditedPlant(plant);
      setTab(initialTab);
    }
  }, [plant, initialTab]);

  if (!editedPlant) return null;

  const handleSave = () => {
    onUpdate(editedPlant);
  };

  const toxicityColor = getToxicityColor(editedPlant.plantType?.petToxicity);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'primary.main' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{editedPlant.name}</Typography>
          <Typography variant="caption" color="textSecondary">#{editedPlant.id} | GUID: {editedPlant.guid}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Water Now"><IconButton size="small" color="primary" onClick={() => onWater(editedPlant.id)} disabled={isProcessing}><Droplet size={20} /></IconButton></Tooltip>
          <Tooltip title="Snooze 1 Day"><IconButton size="small" color="info" onClick={() => onSnooze(editedPlant.id)} disabled={isProcessing}><AlarmClock size={20} /></IconButton></Tooltip>
          <Tooltip title="Propagate"><IconButton size="small" color="secondary" onClick={() => onPropagate(editedPlant.id)} disabled={isProcessing}><Scissors size={20} /></IconButton></Tooltip>
          <IconButton color="error" onClick={() => onDelete(editedPlant.id)}><Trash2 size={20} /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ minHeight: 500 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
          <Tab label="General" icon={<Info size={16} />} iconPosition="start" />
          <Tab label="Plant Info" icon={<Sprout size={16} />} iconPosition="start" />
          <Tab label="History & Gallery" icon={<History size={16} />} iconPosition="start" />
          <Tab label="Care" icon={<Settings size={16} />} iconPosition="start" />
          <Tab label="Propagation" icon={<Scissors size={16} />} iconPosition="start" />
          <Tab label="Lineage" icon={<Sprout size={16} />} iconPosition="start" />
          <Tab label="Finance" icon={<DollarSign size={16} />} iconPosition="start" />
        </Tabs>

        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ height: 250, bgcolor: '#f5f5f5', borderRadius: 3, overflow: 'hidden', position: 'relative', border: '2px dashed #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {editedPlant.imagePath ? (
                  <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img 
                      src={`/uploads/thumb_${editedPlant.imagePath}?t=${new Date().getTime()}`} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        cursor: 'pointer',
                        transform: `rotate(${editedPlant.rotation || 0}deg)` 
                      }} 
                      alt={editedPlant.name}
                      onClick={() => onOpenGallery(editedPlant, editedPlant.imagePath)}
                    />
                    <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 1 }}>
                      <IconButton size="small" sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#eee' } }} onClick={() => onDownload(editedPlant.imagePath)}><Download size={14} /></IconButton>
                      <IconButton size="small" sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#eee' } }} onClick={() => onRotateMain(editedPlant.id, editedPlant.rotation || 0)}><RotateCw size={14} /></IconButton>
                      <Button size="small" variant="contained" startIcon={<History size={14} />} onClick={() => setTab(2)} sx={{ fontSize: '0.7rem' }}>View History</Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                    <History size={32} />
                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>No cover photo set</Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<CameraIcon size={14} />}
                      onClick={onAddPhoto}
                    >
                      Add First Photo
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Name" value={editedPlant.name} onChange={(e) => setEditedPlant({...editedPlant, name: e.target.value})} size="small" /></Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete 
                freeSolo
                forcePopupIcon
                options={plantTypes} 
                getOptionLabel={(o) => {
                  if (typeof o === 'string') return o;
                  return o.name || '';
                }} 
                value={editedPlant.plantType || null}
                onChange={(_, n) => {
                  let val: any = n;
                  if (typeof n === 'string') {
                    val = { name: n };
                  }
                  setEditedPlant({
                    ...editedPlant, 
                    plantType: val || undefined,
                    wateringFrequencyDays: val?.defaultWateringFrequencyDays || editedPlant.wateringFrequencyDays
                  });
                }}
                renderInput={(p) => <TextField {...p} label="Plant Type" size="small" />} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete freeSolo options={locations} value={editedPlant.location} onInputChange={(_, n) => setEditedPlant({...editedPlant, location: n})} renderInput={(p) => <TextField {...p} label="Location" size="small" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete options={['Active', 'Propagating', 'Ready to Sell', 'Sold']} value={editedPlant.currentStage} onChange={(_, n) => setEditedPlant({...editedPlant, currentStage: n || ''})} renderInput={(p) => <TextField {...p} label="Growth Stage" size="small" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete options={['Healthy', 'Water Overdue', 'Needs Attention']} value={editedPlant.plantStatus} onChange={(_, n) => setEditedPlant({...editedPlant, plantStatus: n || ''})} renderInput={(p) => <TextField {...p} label="Health Status" size="small" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: editedPlant.nextWaterDate && new Date(editedPlant.nextWaterDate) <= new Date() ? 'warning.light' : 'success.light',
                color: editedPlant.nextWaterDate && new Date(editedPlant.nextWaterDate) <= new Date() ? 'warning.contrastText' : 'success.contrastText',
                display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'
              }}>
                <Droplet size={18} style={{ marginRight: 8 }} />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Next Water: {editedPlant.nextWaterDate ? new Date(editedPlant.nextWaterDate).toLocaleDateString() : 'TBD'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}><FormControlLabel control={<Checkbox checked={editedPlant.goodForTerrariums} onChange={(e) => setEditedPlant({...editedPlant, goodForTerrariums: e.target.checked})} />} label="Good for Terrariums" /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Watering Frequency (Days)" type="number" value={editedPlant.wateringFrequencyDays} onKeyDown={(e) => {if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) e.preventDefault();}} onChange={(e) => setEditedPlant({...editedPlant, wateringFrequencyDays: parseInt(e.target.value) || 0})} size="small" /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next Water Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={editedPlant.nextWaterDate || ''}
                onChange={(e) => setEditedPlant({...editedPlant, nextWaterDate: e.target.value})}
                size="small"
              />
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Species Specification</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Common Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{editedPlant.plantType?.name || 'Unknown'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Scientific Name</Typography>
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>{editedPlant.plantType?.scientificName || 'Not recorded'}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Other Names</Typography>
                <Typography variant="body1">{editedPlant.plantType?.otherNames || 'None'}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: !toxicityColor ? '#f1f8e9' : (toxicityColor === '#d32f2f' ? '#fdecea' : '#fffde7'), borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  {toxicityColor ? 
                    <Box component="span" sx={{ display: 'flex' }}><Trash2 color={toxicityColor} /></Box> : 
                    <Box component="span" sx={{ display: 'flex' }}><Check color="#2e7d32" /></Box>
                  }
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Pet Toxicity</Typography>
                    <Typography variant="body2">{editedPlant.plantType?.petToxicity || 'Toxicity information not available.'}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>History & Photos</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<Calendar size={18} />} onClick={onAddPhoto}>Add Entry</Button>
              </Box>
            </Box>
            
            {editedPlant.updates?.map((update) => (
              <Card key={update.id} sx={{ mb: 3, borderRadius: 2, bgcolor: '#fcfcfc' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {formatDisplayDate(update.date)}
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => onEditUpdate(update)}><Settings size={16} /></IconButton>
                      <IconButton size="small" color="error" onClick={() => onDeleteUpdate(update)}><Trash2 size={16} /></IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{update.notes || 'No notes for this day.'}</Typography>
                  
                  <Grid container spacing={1}>
                    {update.images?.map((img) => (
                      <Grid item xs={4} sm={3} key={img.id}>
                        <Box sx={{ position: 'relative', pt: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #eee' }}>
                          <img 
                            src={`/uploads/thumb_${img.imagePath}`} 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `rotate(${img.rotation}deg)`, cursor: 'pointer' }}
                            alt={img.label}
                            onClick={() => onOpenGallery(editedPlant, img.imagePath)}
                          />
                          <IconButton 
                            size="small" 
                            sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.8)', p: 0.5 }}
                            onClick={() => onRotateImage(img.id, img.rotation)}
                          >
                            <RotateCw size={12} />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ position: 'absolute', top: 2, left: 2, bgcolor: 'rgba(255,255,255,0.8)', p: 0.5, color: editedPlant.imagePath === img.imagePath ? 'primary.main' : 'inherit' }}
                            onClick={() => onSetCover(editedPlant.id, img.id)}
                          >
                            <Check size={12} />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ position: 'absolute', top: 32, right: 2, bgcolor: 'rgba(255,255,255,0.8)', p: 0.5 }}
                            onClick={() => onDownload(img.imagePath, img.label)}
                          >
                            <Download size={12} />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ position: 'absolute', top: 32, left: 2, bgcolor: 'rgba(255,255,255,0.8)', p: 0.5, color: '#d32f2f' }}
                            onClick={() => onDeleteImage(img.id)}
                          >
                            <Trash2 size={12} />
                          </IconButton>
                          <Box 
                            sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', px: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => onUpdateLabel(img.id, img.label || '')}
                          >
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {img.label || 'No Label'}
                            </Typography>
                            <Settings size={10} />
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            ))}
            {(!editedPlant.updates || editedPlant.updates.length === 0) && (
              <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <History size={48} style={{ opacity: 0.2, marginBottom: 8 }} />
                <Typography>No updates recorded yet. Start tracking your plant's progress!</Typography>
              </Box>
            )}
          </Box>
        )}

        {tab === 3 && (
          <Box sx={{ minHeight: 300 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Master Care Instructions</Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 3, display: 'block' }}>Derived from {editedPlant.plantType?.name || 'Unknown Type'}</Typography>
            <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 2, border: '1px solid #eee' }}>
              <div dangerouslySetInnerHTML={{ __html: editedPlant.plantType?.careInstructions || 'No care instructions in library.' }} />
            </Box>
          </Box>
        )}

        {tab === 4 && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Master Propagation Notes</Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 3, display: 'block' }}>Derived from {editedPlant.plantType?.name || 'Unknown Type'}</Typography>
            <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 2, border: '1px solid #eee', mb: 3 }}>
              <div dangerouslySetInnerHTML={{ __html: editedPlant.plantType?.propagationInstructions || 'No propagation notes in library.' }} />
            </Box>
            <TextField fullWidth label="Total Propagation Time" value={editedPlant.totalPropagationTime || ''} onChange={(e) => setEditedPlant({...editedPlant, totalPropagationTime: e.target.value})} size="small" placeholder="e.g. 4 weeks to root" />
          </Box>
        )}

        {tab === 5 && (
          <Box sx={{ py: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Parent Source</Typography>
            {editedPlant.parent ? (
              <Chip 
                icon={<ExternalLink size={14} />} 
                label={`${editedPlant.parent.name} (#${editedPlant.parent.id})`} 
                onClick={() => {/* This would need a way to navigate to parent details, maybe pass a handler */}} 
                color="primary" variant="outlined" sx={{ mb: 3 }} 
              />
            ) : <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>This is an original plant (no recorded parent).</Typography>}
            
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Children (Cuttings)</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {editedPlant.children?.map(child => (
                <Chip key={child.id} label={child.name} onClick={() => {/* Handle child navigation */}} variant="outlined" clickable />
              ))}
              {(!editedPlant.children || editedPlant.children.length === 0) && <Typography variant="body2" color="textSecondary">No cuttings have been taken from this plant.</Typography>}
            </Box>
          </Box>
        )}

        {tab === 6 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth label="Purchase Price"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { step: "0.01" }
                }}
                value={editedPlant.originalPurchasePrice !== undefined ? editedPlant.originalPurchasePrice : ''} 
                onKeyDown={(e) => {
                  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', '.', 'Enter'];
                  if (!allowed.includes(e.key) && !/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setEditedPlant({...editedPlant, originalPurchasePrice: e.target.value === '' ? undefined : parseFloat(e.target.value)})} 
                size="small" 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth label="Listing Price"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { step: "0.01" }
                }}
                value={editedPlant.price !== undefined ? editedPlant.price : ''} 
                onKeyDown={(e) => {
                  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', '.', 'Enter'];
                  if (!allowed.includes(e.key) && !/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setEditedPlant({...editedPlant, price: e.target.value === '' ? undefined : parseFloat(e.target.value)})} 
                size="small" 
              />
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Date Sold" type="date" InputLabelProps={{ shrink: true }} value={editedPlant.soldDate || ''} onChange={(e) => setEditedPlant({...editedPlant, soldDate: e.target.value})} size="small" /></Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleSave} variant="contained" disabled={isProcessing}>
          {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlantDetailDialog;
