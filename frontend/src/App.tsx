import { useState, useEffect, useRef } from 'react'
import { 
  Container, Typography, Grid, Card, CardContent, CardActions, 
  IconButton, Button, TextField, Box, Chip, AppBar, Toolbar, 
  Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, Checkbox, FormControlLabel, Divider, Menu, MenuItem,
  Tooltip, Tab, Tabs
} from '@mui/material'
import { 
  Droplet, Scissor, Search, Plus, Calendar, MapPin, 
  AlertCircle, ChevronRight, Image as ImageIcon, Trash2,
  Camera, DollarSign, Sprout, Info, Settings, ArrowUpDown,
  ExternalLink
} from 'lucide-react'
import axios from 'axios'

interface Plant {
  id: number;
  guid: string;
  name: string;
  type: string;
  status: string;
  nextWaterDate: string;
  lastWateredDate: string;
  location: string;
  imagePath: string;
  careInstructions?: string;
  propagationInstructions?: string;
  goodForTerrariums: boolean;
  wateringFrequencyDays: number;
  price?: number;
  originalPurchasePrice?: number;
  soldDate?: string;
  totalPropagationTime?: string;
  parent?: { id: number, name: string, guid: string };
  children?: { id: number, name: string, guid: string }[];
}

function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nextWaterDate');
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);
  
  // Modals
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [detailTab, setDetailTab] = useState(0);

  const [newPlant, setNewPlant] = useState<Partial<Plant>>({ 
    name: '', type: '', wateringFrequencyDays: 7, location: '',
    goodForTerrariums: false, status: 'Active'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    fetchPlants();
    fetchLocations();
  }, [sortBy]);

  const handleWater = async (id: number) => {
    await axios.post(`/api/plants/${id}/water`);
    fetchPlants(searchTerm);
    if (selectedPlant?.id === id) handleViewDetails(id);
  };

  const handlePropagate = async (id: number) => {
    await axios.post(`/api/plants/${id}/propagate`);
    fetchPlants(searchTerm);
    fetchLocations();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this plant?')) {
      await axios.delete(`/api/plants/${id}`);
      setSelectedPlant(null);
      fetchPlants(searchTerm);
    }
  };

  const handleAddPlant = async () => {
    await axios.post('/api/plants', newPlant);
    setOpenAdd(false);
    fetchPlants();
    fetchLocations();
    setNewPlant({ name: '', type: '', wateringFrequencyDays: 7, location: '', goodForTerrariums: false });
  };

  const handleUpdatePlant = async () => {
    if (!selectedPlant) return;
    await axios.put(`/api/plants/${selectedPlant.id}`, selectedPlant);
    fetchPlants(searchTerm);
    setOpenAdd(false);
  };

  const handleViewDetails = async (id: number) => {
    const res = await axios.get(`/api/plants/${id}`);
    setSelectedPlant(res.data);
    setDetailTab(0);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploadingPlantId === null) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/plants/upload', formData);
      const filename = res.data;
      
      const plantRes = await axios.get(`/api/plants/${uploadingPlantId}`);
      const plant = plantRes.data;
      await axios.put(`/api/plants/${uploadingPlantId}`, { ...plant, imagePath: filename });
      fetchPlants(searchTerm);
      if (selectedPlant?.id === uploadingPlantId) handleViewDetails(uploadingPlantId);
    } catch (error) { console.error('Upload failed', error); } finally { setUploadingPlantId(null); }
  };

  const triggerUpload = (id: number) => {
    setUploadingPlantId(id);
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
      
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Sprout style={{ marginRight: 12 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Greenhouse
          </Typography>
          <Box component="form" onSubmit={(e) => {e.preventDefault(); fetchPlants(searchTerm)}} sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 1 }}>
            <Search size={18} />
            <TextField 
              placeholder="Search..." variant="standard" size="small" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ ml: 1, color: 'white', width: { xs: 100, sm: 200 }, '& .MuiInput-underline:before': { borderBottom: 'none' } }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 3, pb: 10 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" startIcon={<AlertCircle />} onClick={() => fetchPlants('Needs Attention')} color="error">Needs Attention</Button>
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
                <Box sx={{ height: 180, bgcolor: '#e0e0e0', position: 'relative', overflow: 'hidden' }} onClick={() => handleViewDetails(plant.id)}>
                  {plant.imagePath ? (
                    <img src={`/uploads/${plant.imagePath}`} alt={plant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <ImageIcon size={40} color="#999" />
                      <Typography variant="caption" color="textSecondary">No Photo</Typography>
                    </Box>
                  )}
                  {plant.goodForTerrariums && (
                    <Chip label="Terrarium" size="small" color="secondary" sx={{ position: 'absolute', top: 8, right: 8, height: 20, fontSize: '0.65rem' }} />
                  )}
                </Box>
                <CardContent sx={{ pb: 1 }} onClick={() => handleViewDetails(plant.id)} style={{ cursor: 'pointer' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                    #{plant.id} • {plant.type || 'Plant'}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {plant.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <MapPin size={14} />
                    <Typography variant="body2" color="textSecondary">{plant.location || 'Unknown'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Droplet size={14} color={plant.status === 'Needs Attention' ? '#d32f2f' : '#2e7d32'} />
                    <Typography variant="body2" sx={{ fontWeight: 500, color: plant.status === 'Needs Attention' ? 'error.main' : 'text.primary' }}>
                      Next: {plant.nextWaterDate ? new Date(plant.nextWaterDate).toLocaleDateString() : 'TBD'}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
                  <Box>
                    <Tooltip title="Water Now"><IconButton size="small" color="primary" onClick={(e) => {e.stopPropagation(); handleWater(plant.id)}}><Droplet size={18} /></IconButton></Tooltip>
                    <Tooltip title="Propagate"><IconButton size="small" color="secondary" onClick={(e) => {e.stopPropagation(); handlePropagate(plant.id)}}><Scissor size={18} /></IconButton></Tooltip>
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
              <IconButton color="error" onClick={() => handleDelete(selectedPlant.id)}><Trash2 size={20} /></IconButton>
            </DialogTitle>
            <DialogContent>
              <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 2 }}>
                <Tab label="Info" icon={<Info size={16} />} iconPosition="start" />
                <Tab label="Care" icon={<Settings size={16} />} iconPosition="start" />
                <Tab label="Lineage" icon={<Sprout size={16} />} iconPosition="start" />
                <Tab label="Finance" icon={<DollarSign size={16} />} iconPosition="start" />
              </Tabs>

              {detailTab === 0 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Box sx={{ height: 150, bgcolor: '#eee', borderRadius: 2, overflow: 'hidden', mb: 2, cursor: 'pointer' }} onClick={() => triggerUpload(selectedPlant.id)}>
                      {selectedPlant.imagePath ? <img src={`/uploads/${selectedPlant.imagePath}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Camera size={32} /></Box>}
                    </Box>
                  </Grid>
                  <Grid item xs={6}><TextField fullWidth label="Name" value={selectedPlant.name} onChange={(e) => setSelectedPlant({...selectedPlant, name: e.target.value})} size="small" /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Type" value={selectedPlant.type} onChange={(e) => setSelectedPlant({...selectedPlant, type: e.target.value})} size="small" /></Grid>
                  <Grid item xs={12}>
                    <Autocomplete freeSolo options={locations} value={selectedPlant.location} onInputChange={(_, n) => setSelectedPlant({...selectedPlant, location: n})} renderInput={(p) => <TextField {...p} label="Location" size="small" />} />
                  </Grid>
                  <Grid item xs={6}>
                    <Autocomplete options={['Active', 'Propagating', 'Needs Attention', 'Ready to Sell', 'Sold']} value={selectedPlant.status} onChange={(_, n) => setSelectedPlant({...selectedPlant, status: n || ''})} renderInput={(p) => <TextField {...p} label="Status" size="small" />} />
                  </Grid>
                  <Grid item xs={6}><FormControlLabel control={<Checkbox checked={selectedPlant.goodForTerrariums} onChange={(e) => setSelectedPlant({...selectedPlant, goodForTerrariums: e.target.checked})} />} label="Terrarium Ready" /></Grid>
                </Grid>
              )}

              {detailTab === 1 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Care Instructions" value={selectedPlant.careInstructions || ''} onChange={(e) => setSelectedPlant({...selectedPlant, careInstructions: e.target.value})} /></Grid>
                  <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Propagation Notes" value={selectedPlant.propagationInstructions || ''} onChange={(e) => setSelectedPlant({...selectedPlant, propagationInstructions: e.target.value})} /></Grid>
                  <Grid item xs={12}><TextField fullWidth label="Watering Frequency (Days)" type="number" value={selectedPlant.wateringFrequencyDays} onChange={(e) => setSelectedPlant({...selectedPlant, wateringFrequencyDays: parseInt(e.target.value)})} size="small" /></Grid>
                </Grid>
              )}

              {detailTab === 2 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Parent Plant</Typography>
                  {selectedPlant.parent ? (
                    <Chip icon={<ExternalLink size={14} />} label={selectedPlant.parent.name} onClick={() => handleViewDetails(selectedPlant.parent!.id)} sx={{ mb: 2 }} />
                  ) : <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>None (Original Plant)</Typography>}
                  
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>Children / Cuttings</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedPlant.children?.map(child => (
                      <Chip key={child.id} label={child.name} onClick={() => handleViewDetails(child.id)} variant="outlined" size="small" />
                    ))}
                    {(!selectedPlant.children || selectedPlant.children.length === 0) && <Typography variant="body2" color="textSecondary">No cuttings taken yet.</Typography>}
                  </Box>
                  <TextField fullWidth sx={{ mt: 3 }} label="Total Propagation Time" value={selectedPlant.totalPropagationTime || ''} onChange={(e) => setSelectedPlant({...selectedPlant, totalPropagationTime: e.target.value})} size="small" />
                </Box>
              )}

              {detailTab === 3 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}><TextField fullWidth label="Original Cost ($)" type="number" value={selectedPlant.originalPurchasePrice || ''} onChange={(e) => setSelectedPlant({...selectedPlant, originalPurchasePrice: parseFloat(e.target.value)})} size="small" /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Current Price ($)" type="number" value={selectedPlant.price || ''} onChange={(e) => setSelectedPlant({...selectedPlant, price: parseFloat(e.target.value)})} size="small" /></Grid>
                  <Grid item xs={12}><TextField fullWidth label="Sold Date" type="date" InputLabelProps={{ shrink: true }} value={selectedPlant.soldDate || ''} onChange={(e) => setSelectedPlant({...selectedPlant, soldDate: e.target.value})} size="small" /></Grid>
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
          <TextField fullWidth label="Name" sx={{ mt: 1 }} value={newPlant.name} onChange={(e) => setNewPlant({...newPlant, name: e.target.value})} />
          <TextField fullWidth label="Type" sx={{ mt: 2 }} value={newPlant.type} onChange={(e) => setNewPlant({...newPlant, type: e.target.value})} />
          <Autocomplete freeSolo options={locations} value={newPlant.location} onInputChange={(_, n) => setNewPlant({...newPlant, location: n})} renderInput={(p) => <TextField {...p} label="Location" fullWidth sx={{ mt: 2 }} />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button onClick={handleAddPlant} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;