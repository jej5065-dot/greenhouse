import { useState, useEffect, useRef } from 'react'
import { 
  Container, Typography, Grid, Card, CardContent, CardActions, 
  IconButton, Button, TextField, Box, Chip, AppBar, Toolbar, 
  Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, Checkbox, FormControlLabel, Divider, Menu, MenuItem,
  Tooltip, Tab, Tabs, InputAdornment
} from '@mui/material'
import { 
  Droplet, Scissors, Search, Plus, Calendar, MapPin, 
  AlertCircle, Image as ImageIcon, Trash2,
  Camera, DollarSign, Sprout, Info, Settings, ArrowUpDown,
  ExternalLink
} from 'lucide-react'
import axios from 'axios'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { 
  RotateCw, MessageSquare, History, Check, X, Camera as CameraIcon,
  Image as GalleryIcon, ChevronLeft, ChevronRight, FileUp, Skull
} from 'lucide-react'

interface PlantType {
  id: number;
  name: string;
  scientificName: string;
  otherNames: string;
  petToxicity: string;
  careInstructions: string;
  propagationInstructions: string;
  defaultWateringFrequencyDays: number;
}

interface PlantImage {
  id: number;
  imagePath: string;
  label: string;
  rotation: number;
}

interface PlantUpdate {
  id: number;
  date: string;
  notes: string;
  images: PlantImage[];
}

interface Plant {
  id: number;
  guid: string;
  name: string;
  plantType?: PlantType;
  status: string;
  nextWaterDate: string;
  lastWateredDate: string;
  location: string;
  imagePath: string;
  goodForTerrariums: boolean;
  wateringFrequencyDays: number;
  price?: number;
  originalPurchasePrice?: number;
  soldDate?: string;
  totalPropagationTime?: string;
  parent?: { id: number, name: string, guid: string };
  children?: { id: number, name: string, guid: string }[];
  updates: PlantUpdate[];
  rotation?: number;
}

interface PlantSummary {
  totalPlants: number;
  needsAttention: number;
  propagating: number;
  readyToSell: number;
  distinctLocations: number;
  totalEstimatedValue: number;
}

function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantTypes, setPlantTypes] = useState<PlantType[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [summary, setSummary] = useState<PlantSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nextWaterDate');
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);
  
  // Modals
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [fullImage, setFullImage] = useState<{ images: {path: string, rotation: number, label?: string}[], index: number } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState<number | null>(null);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [detailTab, setDetailTab] = useState(0);

  // New Progression State
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ date: new Date().toISOString().split('T')[0], notes: '' });
  const [uploadingToUpdateId, setUploadingToUpdateId] = useState<number | null>(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [imageToLabel, setImageToLabel] = useState<{id: number, label: string} | null>(null);

  const [newPlant, setNewPlant] = useState<Partial<Plant>>({ 
    name: '', wateringFrequencyDays: 7, location: '',
    goodForTerrariums: false, status: 'Active'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPlantId, setUploadingPlantId] = useState<number | null>(null);

  const fetchPlants = async (search = '') => {
    const res = await axios.get(`/api/plants${search ? `?search=${search}` : ''}`);
    let data = res.data;
    
    // Simple client-side sorting
    data.sort((a: any, b: any) => {
      if (!a[sortBy]) return 1;
      if (!b[sortBy]) return -1;
      return a[sortBy] > b[sortBy] ? 1 : -1;
    });

    setPlants(data);
  };

  const fetchLocations = async () => {
    const res = await axios.get('/api/plants/locations');
    setLocations(res.data);
  };

  const fetchPlantTypes = async () => {
    const res = await axios.get('/api/plant-types');
    setPlantTypes(res.data);
  };

  const fetchSummary = async () => {
    const res = await axios.get('/api/plants/summary');
    setSummary(res.data);
  };

  useEffect(() => {
    fetchPlants();
    fetchLocations();
    fetchPlantTypes();
    fetchSummary();
  }, [sortBy]);

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('/api/plant-types/import', formData);
      fetchPlantTypes();
      alert('Library updated successfully!');
    } catch (error) { showError('CSV Import failed.'); }
  };

  const handleWater = async (id: number) => {
    await axios.post(`/api/plants/${id}/water`);
    fetchPlants(searchTerm);
    fetchSummary();
    if (selectedPlant?.id === id) handleViewDetails(id);
  };

  const handlePropagate = async (id: number) => {
    await axios.post(`/api/plants/${id}/propagate`);
    fetchPlants(searchTerm);
    fetchLocations();
    fetchSummary();
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setErrorOpen(true);
  };

  const handleDelete = async () => {
    if (plantToDelete === null) return;
    try {
      await axios.delete(`/api/plants/${plantToDelete}`);
      setSelectedPlant(null);
      setDeleteConfirmOpen(false);
      setPlantToDelete(null);
      fetchPlants(searchTerm);
      fetchSummary();
    } catch (error) {
      console.error('Delete failed:', error);
      showError('Failed to delete plant. Please try again.');
    }
  };

  const triggerDelete = (id: number) => {
    setPlantToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleAddPlant = async () => {
    console.log('Attempting to add plant:', newPlant);
    if (!newPlant.name) {
      showError('Please enter a name for the plant.');
      return;
    }
    try {
      const response = await axios.post('/api/plants', newPlant);
      console.log('Server response:', response.data);
      setOpenAdd(false);
      await fetchPlants();
      await fetchLocations();
      await fetchSummary();
      setNewPlant({ name: '', wateringFrequencyDays: 7, location: '', goodForTerrariums: false, status: 'Active' });
    } catch (error: any) {
      console.error('Add plant failed:', error);
      showError(`Failed to add plant: ${error.response?.data?.message || 'Check connection'}`);
    }
  };

  const handleUpdatePlant = async () => {
    if (!selectedPlant) return;
    try {
      // Create a shallow copy and remove relationships that can cause circular JSON errors
      const plantToUpdate = { ...selectedPlant };
      delete (plantToUpdate as any).parent;
      delete (plantToUpdate as any).children;

      await axios.put(`/api/plants/${selectedPlant.id}`, plantToUpdate);
      await fetchPlants(searchTerm);
      await fetchSummary();
      setSelectedPlant(null);
    } catch (error) {
      console.error('Update failed:', error);
      showError('Failed to save changes. Please check your connection.');
    }
  };

  const handleViewDetails = async (id: number, tabIndex = 0) => {
    const res = await axios.get(`/api/plants/${id}`);
    setSelectedPlant(res.data);
    setDetailTab(tabIndex);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPlant) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      if (uploadingToUpdateId) {
        await axios.post(`/api/plants/updates/${uploadingToUpdateId}/images`, formData);
      } else {
        // Create a default update for "today" if uploading from main view
        const updateRes = await axios.post(`/api/plants/${selectedPlant.id}/updates`, { 
          date: new Date().toISOString().split('T')[0], 
          notes: 'Photo added' 
        });
        await axios.post(`/api/plants/updates/${updateRes.data.id}/images`, formData);
      }
      
      handleViewDetails(selectedPlant.id, detailTab);
      fetchPlants(searchTerm);
      setUploadingToUpdateId(null);
    } catch (error) { 
      console.error('Upload failed', error);
      showError('Upload failed. The image might be too large.');
    }
  };

  const handleUpdateLabel = async () => {
    if (!imageToLabel || !selectedPlant) return;
    try {
      await axios.put(`/api/plants/images/${imageToLabel.id}/label`, imageToLabel.label, {
        headers: { 'Content-Type': 'text/plain' }
      });
      setLabelDialogOpen(false);
      handleViewDetails(selectedPlant.id, detailTab);
    } catch (error) {
      showError('Failed to update label.');
    }
  };

  const handleAddUpdate = async () => {
    if (!selectedPlant) return;
    try {
      await axios.post(`/api/plants/${selectedPlant.id}/updates`, newUpdate);
      setUpdateDialogOpen(false);
      setNewUpdate({ date: new Date().toISOString().split('T')[0], notes: '' });
      handleViewDetails(selectedPlant.id, 1); // Switch to History tab after adding
    } catch (error: any) {
      showError('Failed to add update.');
    }
  };

  const handleRotate = async (imageId: number, currentRotation: number) => {
    const nextRotation = (currentRotation + 90) % 360;
    try {
      await axios.put(`/api/plants/images/${imageId}/rotation`, nextRotation, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (selectedPlant) handleViewDetails(selectedPlant.id, detailTab);
    } catch (error) {
      showError('Failed to rotate image.');
    }
  };

  const handleRotateMain = async (plantId: number, currentRotation: number) => {
    const nextRotation = (currentRotation + 90) % 360;
    try {
      await axios.put(`/api/plants/${plantId}/rotation`, nextRotation, {
        headers: { 'Content-Type': 'application/json' }
      });
      handleViewDetails(plantId, 0);
      fetchPlants(searchTerm);
    } catch (error) {
      showError('Failed to rotate cover photo.');
    }
  };

  const handleSetCover = async (plantId: number, imageId: number) => {
    try {
      await axios.post(`/api/plants/${plantId}/cover/${imageId}`);
      handleViewDetails(plantId, 0); // Jump back to Info to see the result
      fetchPlants(searchTerm);
    } catch (error) {
      showError('Failed to set cover photo.');
    }
  };

  const triggerUpdateUpload = (updateId: number) => {
    setUploadingToUpdateId(updateId);
    fileInputRef.current?.click();
  };

  const triggerUpload = (id: number) => {
    setUploadingPlantId(id);
    fileInputRef.current?.click();
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const getToxicityColor = (toxicity?: string) => {
    if (!toxicity || toxicity.toLowerCase().includes('safe') || toxicity.toLowerCase().includes('fine')) return null;
    const t = toxicity.toLowerCase();
    if (t.includes('heart') || t.includes('severe') || t.includes('death')) return '#d32f2f'; // Dangerous Red
    return '#ffc107'; // Warning Yellow/Amber
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
      <input type="file" accept=".csv" style={{ display: 'none' }} ref={csvInputRef} onChange={handleCsvUpload} />
      
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Sprout style={{ marginRight: 12 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Greenhouse
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Import Plant Library (CSV)">
              <IconButton color="inherit" onClick={() => csvInputRef.current?.click()}><FileUp size={20} /></IconButton>
            </Tooltip>
            <Box component="form" onSubmit={(e) => {e.preventDefault(); fetchPlants(searchTerm)}} sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, px: 1.5 }}>
              <Search size={18} color="white" />
              <TextField 
                placeholder="Search..." variant="standard" size="small" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ 
                  ml: 1, 
                  width: { xs: 100, sm: 200 }, 
                  '& .MuiInputBase-input': { color: 'white', py: 0.5 },
                  '& .MuiInput-underline:before': { borderBottom: 'none' },
                  '& .MuiInput-underline:after': { borderBottom: 'none' },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
                }}
              />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 3, pb: 10 }}>
        {summary && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={3}>
              <Card elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>{summary.totalPlants}</Typography>
                <Typography variant="caption" color="textSecondary">Total Plants</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>{summary.needsAttention}</Typography>
                <Typography variant="caption" color="textSecondary">Needs Attention</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" color="secondary" sx={{ fontWeight: 'bold' }}>{summary.propagating}</Typography>
                <Typography variant="caption" color="textSecondary">Propagating</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>${summary.totalEstimatedValue.toFixed(2)}</Typography>
                <Typography variant="caption" color="textSecondary">Estimated Value</Typography>
              </Card>
            </Grid>
          </Grid>
        )}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" startIcon={<AlertCircle />} onClick={() => fetchPlants('Needs Attention')} color="warning">Needs Attention</Button>
            <Button variant="outlined" size="small" startIcon={<Droplet />} onClick={() => fetchPlants('Watering soon')}>Due</Button>
            <Button variant="text" size="small" onClick={() => fetchPlants('')}>All</Button>
          </Box>
          
          <Button startIcon={<ArrowUpDown size={18} />} onClick={(e) => setSortAnchor(e.currentTarget)} size="small">
            Sort: {sortBy === 'nextWaterDate' ? 'Urgency' : sortBy}
          </Button>
          <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
            <MenuItem onClick={() => {setSortBy('nextWaterDate'); setSortAnchor(null)}}>Urgency (Watering)</MenuItem>
            <MenuItem onClick={() => {setSortBy('id'); setSortAnchor(null)}}>Plant Number</MenuItem>
            <MenuItem onClick={() => {setSortBy('name'); setSortAnchor(null)}}>Name</MenuItem>
            <MenuItem onClick={() => {setSortBy('type'); setSortAnchor(null)}}>Type</MenuItem>
          </Menu>
        </Box>

        <Grid container spacing={2}>
          {plants.map((plant) => (
            <Grid item xs={12} sm={6} md={4} key={plant.id}>
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
                        onClick={() => setFullImage({ images: [{path: plant.imagePath, rotation: plant.rotation || 0}], index: 0 })}
                      />
                      <IconButton 
                        size="small" 
                        sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'white' } }}
                        onClick={() => setFullImage({ images: [{path: plant.imagePath, rotation: plant.rotation || 0}], index: 0 })}
                      >
                        <Search size={14} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }} onClick={() => handleViewDetails(plant.id)}>
                      <ImageIcon size={40} color="#999" />
                      <Typography variant="caption" color="textSecondary">No Photo</Typography>
                    </Box>
                  )}
                  {plant.goodForTerrariums && (
                    <Chip label="Terrarium" size="small" color="secondary" sx={{ position: 'absolute', top: 8, right: 8, height: 20, fontSize: '0.65rem' }} />
                  )}
                  <Box 
                    sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'pointer' }} 
                    onClick={(e) => { if (e.target === e.currentTarget) handleViewDetails(plant.id); }}
                  />
                </Box>
                <CardContent sx={{ pb: 1 }} onClick={() => handleViewDetails(plant.id)} style={{ cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                      #{plant.id} • {plant.plantType?.name || 'Unknown Type'}
                    </Typography>
                    {getToxicityColor(plant.plantType?.petToxicity) && (
                      <Tooltip title={`Toxicity: ${plant.plantType?.petToxicity}`}>
                        <Skull size={14} color={getToxicityColor(plant.plantType?.petToxicity) || '#999'} />
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
                    <Droplet size={14} color={plant.status === 'Needs Attention' ? '#ed6c02' : '#2e7d32'} />
                    <Typography variant="body2" sx={{ fontWeight: 500, color: plant.status === 'Needs Attention' ? 'warning.main' : 'text.primary' }}>
                      Next: {plant.nextWaterDate ? new Date(plant.nextWaterDate).toLocaleDateString() : 'TBD'}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
                  <Box>
                    <Tooltip title="Water Now"><IconButton size="small" color="primary" onClick={(e) => {e.stopPropagation(); handleWater(plant.id)}}><Droplet size={18} /></IconButton></Tooltip>
                    <Tooltip title="Propagate"><IconButton size="small" color="secondary" onClick={(e) => {e.stopPropagation(); handlePropagate(plant.id)}}><Scissors size={18} /></IconButton></Tooltip>
                  </Box>
                  <IconButton size="small" onClick={(e) => {e.stopPropagation(); triggerUpload(plant.id)}}><Camera size={18} /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Plant Detail/Edit Modal */}
      <Dialog open={Boolean(selectedPlant)} onClose={() => setSelectedPlant(null)} fullWidth maxWidth="sm">
        {selectedPlant && (
          <>
            <DialogTitle sx={{ pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{selectedPlant.name}</Typography>
                <Typography variant="caption" color="textSecondary">#{selectedPlant.id} | GUID: {selectedPlant.guid}</Typography>
              </Box>
              <IconButton color="error" onClick={() => triggerDelete(selectedPlant.id)}><Trash2 size={20} /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ minHeight: 500 }}>
              <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
                <Tab label="General" icon={<Info size={16} />} iconPosition="start" />
                <Tab label="Plant Info" icon={<Sprout size={16} />} iconPosition="start" />
                <Tab label="History & Gallery" icon={<History size={16} />} iconPosition="start" />
                <Tab label="Care" icon={<Settings size={16} />} iconPosition="start" />
                <Tab label="Propagation" icon={<Scissors size={16} />} iconPosition="start" />
                <Tab label="Lineage" icon={<Sprout size={16} />} iconPosition="start" />
                <Tab label="Finance" icon={<DollarSign size={16} />} iconPosition="start" />
              </Tabs>

              {detailTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ height: 250, bgcolor: '#f5f5f5', borderRadius: 3, overflow: 'hidden', position: 'relative', border: '2px dashed #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedPlant.imagePath ? (
                        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                          <img 
                            src={`/uploads/thumb_${selectedPlant.imagePath}?t=${new Date().getTime()}`} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover', 
                              cursor: 'pointer',
                              transform: `rotate(${selectedPlant.rotation || 0}deg)` 
                            }} 
                            onClick={() => setFullImage({ images: [{path: selectedPlant.imagePath, rotation: selectedPlant.rotation || 0}], index: 0 })}
                          />
                          <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 1 }}>
                            <IconButton size="small" sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#eee' } }} onClick={() => handleRotateMain(selectedPlant.id, selectedPlant.rotation || 0)}><RotateCw size={14} /></IconButton>
                            <Button size="small" variant="contained" startIcon={<History size={14} />} onClick={() => setDetailTab(1)} sx={{ fontSize: '0.7rem' }}>View History</Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', color: 'text.secondary', cursor: 'pointer' }} onClick={() => setDetailTab(1)}>
                          <History size={32} />
                          <Typography variant="caption" display="block">Add your first update in the Timeline</Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth label="Name" value={selectedPlant.name} onChange={(e) => setSelectedPlant({...selectedPlant, name: e.target.value})} size="small" /></Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete 
                      freeSolo
                      forcePopupIcon
                      options={plantTypes} 
                      getOptionLabel={(o) => {
                        if (typeof o === 'string') return o;
                        return o.name || '';
                      }} 
                      value={selectedPlant.plantType || null}
                      onChange={(_, n) => {
                        let val: any = n;
                        if (typeof n === 'string') {
                          val = { name: n };
                        }
                        setSelectedPlant({
                          ...selectedPlant, 
                          plantType: val || undefined,
                          wateringFrequencyDays: val?.defaultWateringFrequencyDays || selectedPlant.wateringFrequencyDays
                        });
                      }}
                      renderInput={(p) => <TextField {...p} label="Plant Type" size="small" />} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete freeSolo options={locations} value={selectedPlant.location} onInputChange={(_, n) => setSelectedPlant({...selectedPlant, location: n})} renderInput={(p) => <TextField {...p} label="Location" size="small" />} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete options={['Active', 'Propagating', 'Needs Attention', 'Ready to Sell', 'Sold']} value={selectedPlant.status} onChange={(_, n) => setSelectedPlant({...selectedPlant, status: n || ''})} renderInput={(p) => <TextField {...p} label="Status" size="small" />} />
                  </Grid>
                  <Grid item xs={12}><FormControlLabel control={<Checkbox checked={selectedPlant.goodForTerrariums} onChange={(e) => setSelectedPlant({...selectedPlant, goodForTerrariums: e.target.checked})} />} label="Good for Terrariums" /></Grid>
                  <Grid item xs={12}><TextField fullWidth label="Watering Frequency (Days)" type="number" value={selectedPlant.wateringFrequencyDays} onKeyDown={(e) => {if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) e.preventDefault();}} onChange={(e) => setSelectedPlant({...selectedPlant, wateringFrequencyDays: parseInt(e.target.value) || 0})} size="small" /></Grid>
                </Grid>
              )}

              {detailTab === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Species Specification</Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">Common Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{selectedPlant.plantType?.name || 'Unknown'}</Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Scientific Name</Typography>
                      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>{selectedPlant.plantType?.scientificName || 'Not recorded'}</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Other Names</Typography>
                      <Typography variant="body1">{selectedPlant.plantType?.otherNames || 'None'}</Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: !getToxicityColor(selectedPlant.plantType?.petToxicity) ? '#f1f8e9' : (getToxicityColor(selectedPlant.plantType?.petToxicity) === '#d32f2f' ? '#fdecea' : '#fffde7'), borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        {getToxicityColor(selectedPlant.plantType?.petToxicity) ? 
                          <Skull color={getToxicityColor(selectedPlant.plantType?.petToxicity) || '#999'} /> : 
                          <Check color="#2e7d32" />
                        }
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Pet Toxicity</Typography>
                          <Typography variant="body2">{selectedPlant.plantType?.petToxicity || 'Toxicity information not available.'}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {detailTab === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>History & Photos</Typography>
                    <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setUpdateDialogOpen(true)}>Add Day</Button>
                  </Box>
                  
                  {selectedPlant.updates?.map((update) => (
                    <Card key={update.id} sx={{ mb: 3, borderRadius: 2, bgcolor: '#fcfcfc' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {new Date(update.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </Typography>
                          <IconButton size="small" onClick={() => triggerUpdateUpload(update.id)}><CameraIcon size={18} /></IconButton>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{update.notes || 'No notes for this day.'}</Typography>
                        
                        <Grid container spacing={1}>
                          {update.images?.map((img, idx) => (
                            <Grid item xs={4} sm={3} key={img.id}>
                              <Box sx={{ position: 'relative', pt: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #eee' }}>
                                <img 
                                  src={`/uploads/thumb_${img.imagePath}`} 
                                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `rotate(${img.rotation}deg)`, cursor: 'pointer' }}
                                  onClick={() => setFullImage({ 
                                    images: update.images.map(i => ({ path: i.imagePath, rotation: i.rotation, label: i.label })), 
                                    index: idx 
                                  })}
                                />
                                <IconButton 
                                  size="small" 
                                  sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.8)', p: 0.5 }}
                                  onClick={() => handleRotate(img.id, img.rotation)}
                                >
                                  <RotateCw size={12} />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  sx={{ position: 'absolute', top: 2, left: 2, bgcolor: 'rgba(255,255,255,0.8)', p: 0.5, color: selectedPlant.imagePath === img.imagePath ? 'primary.main' : 'inherit' }}
                                  onClick={() => handleSetCover(selectedPlant.id, img.id)}
                                >
                                  <Check size={12} />
                                </IconButton>
                                <Box 
                                  sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', px: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                  onClick={() => { setImageToLabel({id: img.id, label: img.label || ''}); setLabelDialogOpen(true); }}
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
                  {(!selectedPlant.updates || selectedPlant.updates.length === 0) && (
                    <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                      <History size={48} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <Typography>No updates recorded yet. Start tracking your plant's progress!</Typography>
                    </Box>
                  )}
                </Box>
              )}

              {detailTab === 3 && (
                <Box sx={{ minHeight: 300 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Master Care Instructions</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 3, display: 'block' }}>Derived from {selectedPlant.plantType?.name || 'Unknown Type'}</Typography>
                  <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 2, border: '1px solid #eee' }}>
                    <div dangerouslySetInnerHTML={{ __html: selectedPlant.plantType?.careInstructions || 'No care instructions in library.' }} />
                  </Box>
                </Box>
              )}

              {detailTab === 4 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Master Propagation Notes</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 3, display: 'block' }}>Derived from {selectedPlant.plantType?.name || 'Unknown Type'}</Typography>
                  <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 2, border: '1px solid #eee', mb: 3 }}>
                    <div dangerouslySetInnerHTML={{ __html: selectedPlant.plantType?.propagationInstructions || 'No propagation notes in library.' }} />
                  </Box>
                  <TextField fullWidth label="Total Propagation Time" value={selectedPlant.totalPropagationTime || ''} onChange={(e) => setSelectedPlant({...selectedPlant, totalPropagationTime: e.target.value})} size="small" placeholder="e.g. 4 weeks to root" />
                </Box>
              )}

              {detailTab === 5 && (
                <Box sx={{ py: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Parent Source</Typography>
                  {selectedPlant.parent ? (
                    <Chip 
                      icon={<ExternalLink size={14} />} 
                      label={`${selectedPlant.parent.name} (#${selectedPlant.parent.id})`} 
                      onClick={() => handleViewDetails(selectedPlant.parent!.id)} 
                      color="primary" variant="outlined" sx={{ mb: 3 }} 
                    />
                  ) : <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>This is an original plant (no recorded parent).</Typography>}
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Children (Cuttings)</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {selectedPlant.children?.map(child => (
                      <Chip key={child.id} label={child.name} onClick={() => handleViewDetails(child.id)} variant="outlined" clickable />
                    ))}
                    {(!selectedPlant.children || selectedPlant.children.length === 0) && <Typography variant="body2" color="textSecondary">No cuttings have been taken from this plant.</Typography>}
                  </Box>
                </Box>
              )}

              {detailTab === 6 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth label="Purchase Price"
                      type="number"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        inputProps: { step: "0.01" }
                      }}
                      value={selectedPlant.originalPurchasePrice !== undefined ? selectedPlant.originalPurchasePrice : ''} 
                      onKeyDown={(e) => {
                        const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', '.', 'Enter'];
                        if (!allowed.includes(e.key) && !/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => setSelectedPlant({...selectedPlant, originalPurchasePrice: e.target.value === '' ? undefined : parseFloat(e.target.value)})} 
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
                      value={selectedPlant.price !== undefined ? selectedPlant.price : ''} 
                      onKeyDown={(e) => {
                        const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', '.', 'Enter'];
                        if (!allowed.includes(e.key) && !/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => setSelectedPlant({...selectedPlant, price: e.target.value === '' ? undefined : parseFloat(e.target.value)})} 
                      size="small" 
                    />
                  </Grid>
                  <Grid item xs={12}><TextField fullWidth label="Date Sold" type="date" InputLabelProps={{ shrink: true }} value={selectedPlant.soldDate || ''} onChange={(e) => setSelectedPlant({...selectedPlant, soldDate: e.target.value})} size="small" /></Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPlant(null)}>Close</Button>
              <Button onClick={handleUpdatePlant} variant="contained">Save Changes</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={() => setOpenAdd(true)}><Plus /></Fab>

      {/* Basic Add Modal */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
        <DialogTitle>Quick Add Plant</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" sx={{ mt: 1 }} value={newPlant.name} onChange={(e) => setNewPlant({...newPlant, name: e.target.value})} size="small" />
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
          <Autocomplete freeSolo options={locations} value={newPlant.location} onInputChange={(_, n) => setNewPlant({...newPlant, location: n})} renderInput={(p) => <TextField {...p} label="Location" fullWidth sx={{ mt: 2 }} size="small" />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button onClick={handleAddPlant} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox for Original Images */}
      <Dialog open={Boolean(fullImage)} onClose={() => setFullImage(null)} maxWidth="lg" fullWidth>
        <Box sx={{ position: 'relative', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <IconButton 
            onClick={() => setFullImage(null)} 
            sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, zIndex: 10 }}
          >
            <X size={20} />
          </IconButton>

          {fullImage && fullImage.images.length > 1 && (
            <>
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIndex = (fullImage.index - 1 + fullImage.images.length) % fullImage.images.length;
                  setFullImage({ ...fullImage, index: nextIndex });
                }}
                sx={{ 
                  position: 'absolute', 
                  left: { xs: 4, sm: 24 }, 
                  color: 'white', 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  zIndex: 20 
                }}
              >
                <ChevronLeft size={48} />
              </IconButton>
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIndex = (fullImage.index + 1) % fullImage.images.length;
                  setFullImage({ ...fullImage, index: nextIndex });
                }}
                sx={{ 
                  position: 'absolute', 
                  right: { xs: 4, sm: 24 }, 
                  color: 'white', 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  zIndex: 20 
                }}
              >
                <ChevronRight size={48} />
              </IconButton>
            </>
          )}

          {fullImage && (
            <Box sx={{ textAlign: 'center', width: '100%', px: { xs: 8, sm: 12 } }}>
              <img 
                src={`/uploads/original_${fullImage.images[fullImage.index].path}`} 
                alt="Full view" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '80vh', 
                  objectFit: 'contain', 
                  transform: `rotate(${fullImage.images[fullImage.index].rotation}deg)`,
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                }} 
              />
              <Box sx={{ position: 'absolute', bottom: 16, left: 0, right: 0, color: 'white', textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {fullImage.images[fullImage.index].label || 'Untitled Photo'}
                </Typography>
                {fullImage.images.length > 1 && (
                  <Typography variant="caption" sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', opacity: 0.8 }}>
                    {fullImage.index + 1} of {fullImage.images.length}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Add Update Day Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <History color="#2e7d32" />
          Add Daily Growth Entry
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
            Record today's progress, notes, and photos for your plant.
          </Typography>
          <TextField 
            fullWidth label="Entry Date" type="date" sx={{ mt: 1 }}
            InputLabelProps={{ shrink: true }}
            value={newUpdate.date}
            onChange={(e) => setNewUpdate({...newUpdate, date: e.target.value})}
            size="small"
          />
          <TextField 
            fullWidth label="Growth Notes" multiline rows={4} sx={{ mt: 3 }}
            placeholder="How is the plant doing today? Any new leaves or roots?"
            value={newUpdate.notes}
            onChange={(e) => setNewUpdate({...newUpdate, notes: e.target.value})}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUpdateDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleAddUpdate} variant="contained" color="primary">Save Growth Day</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Photo Label Dialog */}
      <Dialog open={labelDialogOpen} onClose={() => setLabelDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Photo Label</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Provide a short label for this photo (e.g., "Top Down", "New Leaf").
          </Typography>
          <TextField 
            fullWidth label="Photo Label" autoFocus sx={{ mt: 1 }}
            value={imageToLabel?.label || ''}
            onChange={(e) => setImageToLabel({...imageToLabel!, label: e.target.value})}
            placeholder="e.g. Side view"
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLabelDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleUpdateLabel} variant="contained" color="primary">Update Label</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertCircle color="#ed6c02" /> 
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this plant? This action cannot be undone and will remove all history and photos associated with it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete Plant</Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorOpen} onClose={() => setErrorOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <AlertCircle /> 
          Oops! Something went wrong
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">{errorMsg}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setErrorOpen(false)} variant="contained" color="primary">Dismiss</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;