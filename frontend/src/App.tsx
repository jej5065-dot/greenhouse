import { useState, useEffect, useRef } from 'react'
import { 
  Container, Typography, Grid, Card, CardContent, CardActions, 
  IconButton, Button, TextField, Box, Chip, AppBar, Toolbar, 
  Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, Checkbox, FormControlLabel, Divider, Menu, MenuItem,
  Tooltip, Tab, Tabs, InputAdornment, CircularProgress,
  ToggleButton, ToggleButtonGroup, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper
} from '@mui/material'
import { 
  Droplet, Scissors, Search, Plus, Calendar, MapPin, 
  AlertCircle, AlertTriangle, Image as ImageIcon, Trash2,
  Camera, DollarSign, Sprout, Info, Settings, ArrowUpDown,
  ExternalLink, BookOpen, LayoutGrid, AlignJustify, Grid as GridIcon, Sparkles
} from 'lucide-react'
import axios from 'axios'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { 
  RotateCw, MessageSquare, History, Check, X, Camera as CameraIcon,
  Image as GalleryIcon, ChevronLeft, ChevronRight, FileUp, Skull,
  Download, RefreshCw, Trash2 as TrashIcon
} from 'lucide-react'
import PlantLibraryDialog from './components/PlantLibraryDialog';

interface PlantType {
  id: number;
  name: string;
  scientificName: string;
  otherNames: string;
  petToxicity: string;
  careInstructions: string;
  propagationInstructions: string;
  defaultWateringFrequencyDays: number;
  exampleImagePath?: string;
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
  const [sortBy, setSortBy] = useState(localStorage.getItem('greenhouse_sort') || 'nextWaterDate');
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);

  const handleSetSort = (val: string) => {
    setSortBy(val);
    localStorage.setItem('greenhouse_sort', val);
    setSortAnchor(null);
  };
  
  // Modals
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [fullImage, setFullImage] = useState<{ 
    images: {
      path: string, 
      rotation: number, 
      label?: string,
      date?: string,
      notes?: string
    }[], 
    index: number 
  } | null>(null);

  const openGalleryForPlant = (plant: Plant, startingPath?: string) => {
    // Flatten all images from all updates and sort chronologically
    const allImages = (plant.updates || [])
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .flatMap(u => (u.images || []).map(img => ({
        path: img.imagePath,
        rotation: img.rotation,
        label: img.label,
        date: u.date,
        notes: u.notes
      })));
    
    if (allImages.length === 0) {
      if (plant.imagePath) {
        setFullImage({ 
          images: [{ path: plant.imagePath, rotation: plant.rotation || 0, date: plant.lastWateredDate?.split('T')[0] }], 
          index: 0 
        });
      }
      return;
    }

    let index = 0;
    if (startingPath) {
      index = allImages.findIndex(img => img.path === startingPath);
      if (index === -1) index = allImages.length - 1; // Default to latest if not found
    } else {
      index = allImages.length - 1; // Default to latest
    }

    setFullImage({ images: allImages, index });
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState<number | null>(null);
  const [deleteUpdateConfirmOpen, setDeleteUpdateConfirmOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<PlantUpdate | null>(null);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorSeverity, setErrorSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('error');
  const [detailTab, setDetailTab] = useState(0);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'gallery' | 'compact' | 'table'>('gallery');
  const [scrollToId, setScrollToId] = useState<number | null>(null);

  useEffect(() => {
    if (scrollToId && plants.length > 0) {
      // Small timeout to allow DOM to settle
      setTimeout(() => {
        const element = document.getElementById(`plant-${scrollToId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight effect
          element.style.transition = 'background-color 0.5s';
          const originalBg = element.style.backgroundColor;
          element.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
          setTimeout(() => {
            element.style.backgroundColor = originalBg;
          }, 1500);
          setScrollToId(null);
        }
      }, 100);
    }
  }, [plants, scrollToId]);

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  };

  // New Progression State
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ date: getYesterdayDateString(), notes: '' });
  const [uploadingToUpdateId, setUploadingToUpdateId] = useState<number | null>(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [imageToLabel, setImageToLabel] = useState<{id: number, label: string} | null>(null);
  
  // New: State for editing an existing entry
  const [editingUpdate, setEditingUpdate] = useState<PlantUpdate | null>(null);
  const [initialPlantFile, setInitialPlantFile] = useState<File | null>(null);
  const [duplicateDayOpen, setDuplicateDayOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [newPlant, setNewPlant] = useState<Partial<Plant>>({ 
    name: '', wateringFrequencyDays: 7, location: '',
    goodForTerrariums: false, status: 'Active'
  });

  const handleDownload = async (path: string, label?: string) => {
    try {
      const url = `/uploads/original_${path}`;
      const filename = label ? `${label.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png` : `plant_image_${path}`;
      
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      showError('Failed to download image.');
    }
  };
  
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

  const refreshAll = async () => {
    setIsProcessing(true);
    try {
      await Promise.all([
        fetchPlants(searchTerm),
        fetchLocations(),
        fetchPlantTypes(),
        fetchSummary()
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchPlants();
    fetchLocations();
    fetchPlantTypes();
    fetchSummary();

    // Auto-refresh every 60 seconds to keep multi-user sessions in sync
    const interval = setInterval(() => {
      fetchPlants(searchTerm);
      fetchSummary();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [sortBy]);

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('/api/plant-types/import', formData);
      fetchPlantTypes();
      showSuccess('Library updated successfully!');
    } catch (error) { showError('CSV Import failed.'); }
  };

  const handleWater = async (id: number) => {
    setIsProcessing(true);
    try {
      await axios.post(`/api/plants/${id}/water`);
      fetchPlants(searchTerm);
      fetchSummary();
      if (selectedPlant?.id === id) handleViewDetails(id);
    } catch (error) { showError('Failed to log watering.'); }
    finally { setIsProcessing(false); }
  };

  const handlePropagate = async (id: number) => {
    setIsProcessing(true);
    try {
      await axios.post(`/api/plants/${id}/propagate`);
      fetchPlants(searchTerm);
      fetchLocations();
      fetchSummary();
    } catch (error) { showError('Failed to propagate.'); }
    finally { setIsProcessing(false); }
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setErrorSeverity('error');
    setErrorOpen(true);
  };

  const showWarning = (msg: string) => {
    setErrorMsg(msg);
    setErrorSeverity('warning');
    setErrorOpen(true);
  };

  const showSuccess = (msg: string) => {
    setErrorMsg(msg);
    setErrorSeverity('success');
    setErrorOpen(true);
  };

  const formatDisplayDate = (dateStr: string) => {
    // Manually parse YYYY-MM-DD to avoid timezone shifting
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDelete = async () => {
    if (plantToDelete === null) return;
    setIsProcessing(true);
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
    } finally { setIsProcessing(false); }
  };

  const triggerDelete = (id: number) => {
    setPlantToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteUpdate = async (update: PlantUpdate) => {
    if ((update.notes && update.notes.trim()) || (update.images && update.images.length > 0)) {
      setUpdateToDelete(update);
      setDeleteUpdateConfirmOpen(true);
    } else {
      executeDeleteUpdate(update.id);
    }
  };

  const executeDeleteUpdate = async (id: number) => {
    setIsProcessing(true);
    try {
      await axios.delete(`/api/plants/updates/${id}`);
      setDeleteUpdateConfirmOpen(false);
      setUpdateToDelete(null);
      if (selectedPlant) handleViewDetails(selectedPlant.id, 2);
      fetchPlants(searchTerm);
    } catch (error) {
      showError('Failed to delete history entry.');
    } finally { setIsProcessing(false); }
  };

  const handleDeleteImage = async (imageId: number) => {
    setIsProcessing(true);
    try {
      await axios.delete(`/api/plants/images/${imageId}`);
      if (selectedPlant) handleViewDetails(selectedPlant.id, detailTab);
      fetchPlants(searchTerm);
    } catch (error) {
      showError('Failed to delete image.');
    } finally { setIsProcessing(false); }
  };

  const handleIdentify = async () => {
    if (!initialPlantFile) {
      showError('Please upload a photo first to identify.');
      return;
    }

    setIsProcessing(true);
    // Mock AI Identification Service
    // In a real app, you would send `initialPlantFile` to an endpoint like /api/identify
    setTimeout(() => {
      const mockTypes = plantTypes.length > 0 ? plantTypes : [
        { name: 'Monstera Deliciosa', defaultWateringFrequencyDays: 7 },
        { name: 'Ficus Lyrata', defaultWateringFrequencyDays: 10 },
        { name: 'Pothos', defaultWateringFrequencyDays: 5 }
      ];
      const result = mockTypes[Math.floor(Math.random() * mockTypes.length)] as PlantType;

      setNewPlant({
        ...newPlant,
        name: result.name,
        plantType: result,
        wateringFrequencyDays: result.defaultWateringFrequencyDays || 7
      });

      setIsProcessing(false);
      showSuccess(`Identified as ${result.name}!`);
    }, 1500);
  };

  const handleAddPlant = async () => {
    if (!newPlant.name) {
      showError('Please enter a name for the plant.');
      return;
    }
    setIsProcessing(true);
    try {
      const plantData = { ...newPlant };
      
      // freeSolo Autocomplete can return a string or an object
      if (typeof plantData.plantType === 'string') {
        plantData.plantType = { name: plantData.plantType } as any;
      } else if (plantData.plantType && (plantData.plantType as any).name) {
        // Just send the essential fields to avoid circularity/bloat
        plantData.plantType = {
          id: (plantData.plantType as any).id,
          name: (plantData.plantType as any).name
        } as any;
      }

      console.log('Posting plant data:', plantData);
      const response = await axios.post('/api/plants', plantData);
      const createdPlant = response.data;
      console.log('Plant created:', createdPlant);
      
      if (initialPlantFile) {
        console.log('Uploading initial image for plant:', createdPlant.id);
        const updateRes = await axios.post(`/api/plants/${createdPlant.id}/updates`, { 
          date: getLocalDateString(), 
          notes: 'Initial photo' 
        });
        console.log('Update entry created:', updateRes.data);
        
        const formData = new FormData();
        formData.append('file', initialPlantFile);
        await axios.post(`/api/plants/updates/${updateRes.data.id}/images`, formData);
        console.log('Image uploaded successfully');
      }

      setOpenAdd(false);
      setInitialPlantFile(null);
      await fetchPlants();
      await fetchLocations();
      await fetchSummary();
      setNewPlant({ name: '', wateringFrequencyDays: 7, location: '', goodForTerrariums: false, status: 'Active' });
      handleViewDetails(createdPlant.id);
      setScrollToId(createdPlant.id);
    } catch (error: any) {
      console.error('Add plant failed details:', error);
      const msg = error.response?.data?.message || error.message || 'Server error';
      showError(`Failed to add plant: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePlant = async () => {
    if (!selectedPlant) return;
    setIsProcessing(true);
    try {
      // Create a shallow copy and remove relationships that can cause circular JSON errors
      const plantToUpdate = { ...selectedPlant };
      delete (plantToUpdate as any).parent;
      delete (plantToUpdate as any).children;

      await axios.put(`/api/plants/${selectedPlant.id}`, plantToUpdate);
      await fetchPlants(searchTerm);
      await fetchSummary();
      setScrollToId(selectedPlant.id);
      setSelectedPlant(null);
      showSuccess('Plant updated successfully.');
    } catch (error) {
      console.error('Update failed:', error);
      showError('Failed to save changes. Please check your connection.');
    } finally { setIsProcessing(false); }
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

    setIsProcessing(true);
    try {
      if (uploadingToUpdateId) {
        await axios.post(`/api/plants/updates/${uploadingToUpdateId}/images`, formData);
      } else {
        // Create a default update for "today" if uploading from main view
        const updateRes = await axios.post(`/api/plants/${selectedPlant.id}/updates`, { 
          date: getLocalDateString(), 
          notes: 'Photo added' 
        });
        await axios.post(`/api/plants/updates/${updateRes.data.id}/images`, formData);
      }
      
      handleViewDetails(selectedPlant.id, detailTab);
      fetchPlants(searchTerm);
      setUploadingToUpdateId(null);
      showSuccess('Image uploaded successfully.');
    } catch (error) { 
      console.error('Upload failed', error);
      showError('Upload failed. The image might be too large.');
    } finally { setIsProcessing(false); }
  };

  const handleUpdateLabel = async () => {
    if (!imageToLabel || !selectedPlant) return;
    setIsProcessing(true);
    try {
      await axios.put(`/api/plants/images/${imageToLabel.id}/label`, imageToLabel.label, {
        headers: { 'Content-Type': 'text/plain' }
      });
      setLabelDialogOpen(false);
      handleViewDetails(selectedPlant.id, detailTab);
    } catch (error) {
      showError('Failed to update label.');
    } finally { setIsProcessing(false); }
  };

  const handleAddUpdate = async () => {
    if (!selectedPlant) return;

    const today = getLocalDateString();
    if (newUpdate.date > today) {
      showError('You cannot log entries for future dates.');
      return;
    }

    const existing = (selectedPlant.updates || []).find(u => u.date === newUpdate.date);
    if (existing) {
      showWarning(`An entry for this date already exists. You can add more photos to the existing day in the timeline.`);
      return;
    }

    setIsProcessing(true);
    try {
      await axios.post(`/api/plants/${selectedPlant.id}/updates`, newUpdate);
      setUpdateDialogOpen(false);
      setNewUpdate({ date: getYesterdayDateString(), notes: '' });
      handleViewDetails(selectedPlant.id, 2); // Switch to History tab (index 2)
      showSuccess('Entry added successfully.');
    } catch (error: any) {
      showError('Failed to add update.');
    } finally { setIsProcessing(false); }
  };

  const handleEditUpdate = async () => {
    if (!editingUpdate || !selectedPlant) return;
    setIsProcessing(true);
    try {
      await axios.put(`/api/plants/updates/${editingUpdate.id}`, {
        date: editingUpdate.date,
        notes: editingUpdate.notes
      });
      setEditingUpdate(null);
      handleViewDetails(selectedPlant.id, 2);
      showSuccess('Entry updated successfully.');
    } catch (error) {
      showError('Failed to update entry.');
    } finally { setIsProcessing(false); }
  };

  const addTodayAndUpload = async (force = false) => {
    if (!selectedPlant || isProcessing) return;
    
    const today = getLocalDateString();
    const existing = (selectedPlant.updates || []).find(u => u.date === today);

    if (existing && !force) {
      setDuplicateDayOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      let updateId: number;
      if (existing) {
        updateId = existing.id;
      } else {
        const res = await axios.post(`/api/plants/${selectedPlant.id}/updates`, { 
          date: today, 
          notes: '' 
        });
        updateId = res.data.id;
        // Refresh details immediately so the new day shows up
        await handleViewDetails(selectedPlant.id, 2);
      }
      
      setUploadingToUpdateId(updateId);
      fileInputRef.current?.click();
    } catch (error) {
      showError('Failed to prepare for upload.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = async (imageId: number, currentRotation: number) => {
    const nextRotation = (currentRotation + 90) % 360;
    setIsProcessing(true);
    try {
      await axios.put(`/api/plants/images/${imageId}/rotation`, nextRotation, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (selectedPlant) handleViewDetails(selectedPlant.id, detailTab);
    } catch (error) {
      showError('Failed to rotate image.');
    } finally { setIsProcessing(false); }
  };

  const handleRotateMain = async (plantId: number, currentRotation: number) => {
    const nextRotation = (currentRotation + 90) % 360;
    setIsProcessing(true);
    try {
      await axios.put(`/api/plants/${plantId}/rotation`, nextRotation, {
        headers: { 'Content-Type': 'application/json' }
      });
      handleViewDetails(plantId, 0);
      fetchPlants(searchTerm);
    } catch (error) {
      showError('Failed to rotate cover photo.');
    } finally { setIsProcessing(false); }
  };

  const handleSetCover = async (plantId: number, imageId: number) => {
    setIsProcessing(true);
    try {
      await axios.post(`/api/plants/${plantId}/cover/${imageId}`);
      handleViewDetails(plantId, 0); // Jump back to Info to see the result
      fetchPlants(searchTerm);
    } catch (error) {
      showError('Failed to set cover photo.');
    } finally { setIsProcessing(false); }
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
            <Tooltip title="Refresh Data">
              <IconButton color="inherit" onClick={refreshAll} disabled={isProcessing}>
                <RefreshCw size={20} className={isProcessing ? 'animate-spin' : ''} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Manage Plant Library">
              <IconButton color="inherit" onClick={() => setLibraryOpen(true)}><BookOpen size={20} /></IconButton>
            </Tooltip>
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<ArrowUpDown size={18} />} onClick={(e) => setSortAnchor(e.currentTarget)} size="small">
              Sort: {sortBy === 'nextWaterDate' ? 'Urgency' : sortBy}
            </Button>
            <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
              <MenuItem onClick={() => handleSetSort('nextWaterDate')}>Urgency (Watering)</MenuItem>
              <MenuItem onClick={() => handleSetSort('id')}>Plant Number</MenuItem>
              <MenuItem onClick={() => handleSetSort('name')}>Name</MenuItem>
              <MenuItem onClick={() => handleSetSort('type')}>Type</MenuItem>
            </Menu>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="gallery"><GridIcon size={16} /></ToggleButton>
              <ToggleButton value="compact"><LayoutGrid size={16} /></ToggleButton>
              <ToggleButton value="table"><AlignJustify size={16} /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {viewMode === 'gallery' && (
          <Grid container spacing={2}>
            {plants.map((plant) => (
              <Grid item xs={12} sm={6} md={4} key={plant.id} id={`plant-${plant.id}`}>
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
                          onClick={() => openGalleryForPlant(plant, plant.imagePath)}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'white' } }}
                          onClick={() => openGalleryForPlant(plant, plant.imagePath)}
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
                      <Tooltip title="Water Now"><IconButton size="small" color="primary" onClick={(e) => {e.stopPropagation(); handleWater(plant.id)}} disabled={isProcessing}><Droplet size={18} /></IconButton></Tooltip>
                      <Tooltip title="Propagate"><IconButton size="small" color="secondary" onClick={(e) => {e.stopPropagation(); handlePropagate(plant.id)}} disabled={isProcessing}><Scissors size={18} /></IconButton></Tooltip>
                    </Box>
                    <IconButton size="small" onClick={(e) => {e.stopPropagation(); triggerUpload(plant.id)}} disabled={isProcessing}><Camera size={18} /></IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {viewMode === 'compact' && (
          <Grid container spacing={1}>
            {plants.map((plant) => (
              <Grid item xs={4} sm={3} md={2} key={plant.id} id={`plant-${plant.id}`}>
                <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => handleViewDetails(plant.id)}>
                  <Box sx={{ pt: '100%', position: 'relative', bgcolor: '#eee' }}>
                    {plant.imagePath ? (
                      <img 
                        src={`/uploads/thumb_${plant.imagePath}`}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `rotate(${plant.rotation || 0}deg)` }}
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
                    {plant.status === 'Needs Attention' && (
                      <Box sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'warning.main', borderRadius: '50%', width: 8, height: 8 }} />
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {viewMode === 'table' && (
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
                  <TableRow key={plant.id} hover id={`plant-${plant.id}`} onClick={() => handleViewDetails(plant.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{plant.id}</TableCell>
                    <TableCell>
                      {plant.imagePath ? (
                        <Box
                          component="img"
                          src={`/uploads/thumb_${plant.imagePath}`}
                          sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', transform: `rotate(${plant.rotation || 0}deg)` }}
                        />
                      ) : <Box sx={{ width: 40, height: 40, bgcolor: '#eee', borderRadius: 1 }} />}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{plant.name}</TableCell>
                    <TableCell>{plant.plantType?.name}</TableCell>
                    <TableCell>{plant.location}</TableCell>
                    <TableCell>
                      <Chip
                        label={plant.status}
                        size="small"
                        color={plant.status === 'Needs Attention' ? 'warning' : (plant.status === 'Propagating' ? 'secondary' : 'default')}
                        variant="outlined"
                      />
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
                      <IconButton size="small" onClick={(e) => {e.stopPropagation(); handleWater(plant.id)}}><Droplet size={16} /></IconButton>
                      <IconButton size="small" onClick={(e) => {e.stopPropagation(); triggerUpload(plant.id)}}><CameraIcon size={16} /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {/* Plant Detail/Edit Modal */}
      <Dialog open={Boolean(selectedPlant)} onClose={() => setSelectedPlant(null)} fullWidth maxWidth="sm">
        {selectedPlant && (
          <>
            <DialogTitle sx={{ pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'primary.main' }}>
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
                            onClick={() => openGalleryForPlant(selectedPlant, selectedPlant.imagePath)}
                          />
                          <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 1 }}>
                            <IconButton size="small" sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#eee' } }} onClick={() => handleDownload(selectedPlant.imagePath)}><Download size={14} /></IconButton>
                            <IconButton size="small" sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#eee' } }} onClick={() => handleRotateMain(selectedPlant.id, selectedPlant.rotation || 0)}><RotateCw size={14} /></IconButton>
                            <Button size="small" variant="contained" startIcon={<History size={14} />} onClick={() => setDetailTab(1)} sx={{ fontSize: '0.7rem' }}>View History</Button>
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
                            onClick={() => addTodayAndUpload()}
                          >
                            Add First Photo
                          </Button>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>History & Photos</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="outlined" size="small" startIcon={<Calendar size={18} />} onClick={() => setUpdateDialogOpen(true)}>Backdate</Button>
                      <Button variant="contained" size="small" startIcon={<CameraIcon size={18} />} onClick={() => addTodayAndUpload()}>Add Today</Button>
                    </Box>
                  </Box>
                  
                  {selectedPlant.updates?.map((update) => (
                    <Card key={update.id} sx={{ mb: 3, borderRadius: 2, bgcolor: '#fcfcfc' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {formatDisplayDate(update.date)}
                          </Typography>
                          <Box>
                            <IconButton size="small" onClick={() => setEditingUpdate(update)}><Settings size={16} /></IconButton>
                            <IconButton size="small" onClick={() => triggerUpdateUpload(update.id)}><CameraIcon size={18} /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteUpdate(update)}><TrashIcon size={16} /></IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{update.notes || 'No notes for this day.'}</Typography>
                        
                        <Grid container spacing={1}>
                          {update.images?.map((img, idx) => (
                            <Grid item xs={4} sm={3} key={img.id}>
                              <Box sx={{ position: 'relative', pt: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #eee' }}>
                                <img 
                                  src={`/uploads/thumb_${img.imagePath}`} 
                                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `rotate(${img.rotation}deg)`, cursor: 'pointer' }}
                                  onClick={() => openGalleryForPlant(selectedPlant, img.imagePath)}
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
                                <IconButton 
                                  size="small" 
                                  sx={{ position: 'absolute', top: 32, right: 2, bgcolor: 'rgba(255,255,255,0.8)', p: 0.5 }}
                                  onClick={() => handleDownload(img.imagePath, img.label)}
                                >
                                  <Download size={12} />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  sx={{ position: 'absolute', top: 32, left: 2, bgcolor: 'rgba(255,255,255,0.8)', p: 0.5, color: '#d32f2f' }}
                                  onClick={() => handleDeleteImage(img.id)}
                                >
                                  <TrashIcon size={12} />
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
              <Button onClick={handleUpdatePlant} variant="contained" disabled={isProcessing}>
                {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={() => setOpenAdd(true)}><Plus /></Fab>

      {/* Basic Add Modal */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: 'primary.main', fontWeight: 'bold' }}>Quick Add Plant</DialogTitle>
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
          
          <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2, textAlign: 'center' }}>
            {initialPlantFile ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>{initialPlantFile.name}</Typography>
                  <IconButton size="small" color="error" onClick={() => setInitialPlantFile(null)}><X size={14} /></IconButton>
                </Box>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  startIcon={<Sparkles size={16} />}
                  onClick={handleIdentify}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Identifying...' : 'Identify with AI'}
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
                  input.onchange = (e: any) => setInitialPlantFile(e.target.files[0]);
                  input.click();
                }}
              >
                Attach Initial Photo
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAdd(false)} color="inherit">Cancel</Button>
          <Button onClick={handleAddPlant} variant="contained" disabled={isProcessing}>
            {isProcessing ? 'Adding...' : 'Add Plant'}
          </Button>
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

          <IconButton 
            onClick={() => {
              if (fullImage) {
                const img = fullImage.images[fullImage.index];
                handleDownload(img.path, img.label);
              }
            }}
            sx={{ position: 'absolute', top: 8, right: 56, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, zIndex: 10 }}
          >
            <Download size={20} />
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
              <Box sx={{ position: 'absolute', bottom: 16, left: 0, right: 0, color: 'white', textAlign: 'center', bgcolor: 'rgba(0,0,0,0.4)', py: 1 }}>
                <Typography variant="h6" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {fullImage.images[fullImage.index].date ? formatDisplayDate(fullImage.images[fullImage.index].date!) : 'Untitled Photo'}
                </Typography>
                {fullImage.images[fullImage.index].notes && (
                  <Typography variant="body2" sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', mt: 0.5, px: 4 }}>
                    {fullImage.images[fullImage.index].notes}
                  </Typography>
                )}
                {fullImage.images[fullImage.index].label && (
                  <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', opacity: 0.8 }}>
                    {fullImage.images[fullImage.index].label}
                  </Typography>
                )}
                {fullImage.images.length > 1 && (
                  <Typography variant="caption" sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', opacity: 0.6, display: 'block', mt: 1 }}>
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
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
          <History color="inherit" />
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
            inputProps={{ max: getLocalDateString() }}
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
          <Button onClick={handleAddUpdate} variant="contained" color="primary" disabled={isProcessing}>
            {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Save Growth Day'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit History Entry Dialog */}
      <Dialog open={Boolean(editingUpdate)} onClose={() => setEditingUpdate(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Edit History Entry</DialogTitle>
        <DialogContent>
          <TextField 
            fullWidth label="Entry Date" type="date" sx={{ mt: 1 }}
            InputLabelProps={{ shrink: true }}
            value={editingUpdate?.date || ''}
            onChange={(e) => setEditingUpdate(u => u ? {...u, date: e.target.value} : null)}
            size="small"
          />
          <TextField 
            fullWidth label="Notes" multiline rows={4} sx={{ mt: 3 }}
            value={editingUpdate?.notes || ''}
            onChange={(e) => setEditingUpdate(u => u ? {...u, notes: e.target.value} : null)}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingUpdate(null)} color="inherit">Cancel</Button>
          <Button onClick={handleEditUpdate} variant="contained" color="primary" disabled={isProcessing}>
            {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Update Entry'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Day Prompt */}
      <Dialog open={duplicateDayOpen} onClose={() => setDuplicateDayOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Entry Already Exists</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            You've already added an entry for today. Would you like to add another photo to today's entry, or backdate a new one?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', gap: 1 }}>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => {
              setDuplicateDayOpen(false);
              addTodayAndUpload(true);
            }}
          >
            Add to Today's Entry
          </Button>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={() => {
              setDuplicateDayOpen(false);
              setUpdateDialogOpen(true);
            }}
          >
            Backdate a Different Day
          </Button>
          <Button fullWidth onClick={() => setDuplicateDayOpen(false)} color="inherit">Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Photo Label Dialog */}
      <Dialog open={labelDialogOpen} onClose={() => setLabelDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Edit Photo Label</DialogTitle>
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
          <Button onClick={handleUpdateLabel} variant="contained" color="primary" disabled={isProcessing}>
            {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Update Label'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Update Confirmation Dialog */}
      <Dialog open={deleteUpdateConfirmOpen} onClose={() => setDeleteUpdateConfirmOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 'bold' }}>
          <AlertCircle />
          Delete History Entry
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            This entry contains {updateToDelete?.notes ? 'notes' : ''} 
            {updateToDelete?.notes && updateToDelete?.images?.length ? ' and ' : ''}
            {updateToDelete?.images?.length ? `${updateToDelete.images.length} photo(s)` : ''}.
            Are you sure you want to delete this entire growth day?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteUpdateConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={() => updateToDelete && executeDeleteUpdate(updateToDelete.id)} variant="contained" color="error" disabled={isProcessing}>
            {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Delete Entry'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 'bold' }}>
          <AlertCircle />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this plant? This action cannot be undone and will remove all history and photos associated with it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={isProcessing}>
            {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Delete Plant'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error/Warning Dialog */}
      <Dialog open={errorOpen} onClose={() => setErrorOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: `${errorSeverity}.main`, fontWeight: 'bold' }}>
          {errorSeverity === 'error' && <AlertCircle />}
          {errorSeverity === 'warning' && <AlertTriangle />}
          {errorSeverity === 'success' && <Check />}
          {errorSeverity === 'info' && <Info />}
          {errorSeverity === 'error' ? 'Oops! Something went wrong' : (errorSeverity === 'warning' ? 'Note' : (errorSeverity === 'success' ? 'Success' : 'Info'))}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">{errorMsg}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setErrorOpen(false)} variant="contained" color={errorSeverity}>Dismiss</Button>
        </DialogActions>
      </Dialog>

      <PlantLibraryDialog open={libraryOpen} onClose={() => { setLibraryOpen(false); fetchPlantTypes(); }} />
    </Box>
  );
}

export default App;
