import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, IconButton,
  Box, CircularProgress, Card, CardContent, CardMedia,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Tooltip, useTheme, useMediaQuery
} from '@mui/material';
import {
  Plus, Trash2, Edit2, Upload, X, Sprout, AlertCircle, Check
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';

interface PlantType {
  id?: number;
  name: string;
  scientificName: string;
  otherNames: string;
  petToxicity: string;
  careInstructions: string;
  propagationInstructions: string;
  defaultWateringFrequencyDays: number;
  exampleImagePath?: string;
}

interface PlantLibraryDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function PlantLibraryDialog({ open, onClose }: PlantLibraryDialogProps) {
  const [types, setTypes] = useState<PlantType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingType, setEditingType] = useState<PlantType | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (open) {
      fetchTypes();
    }
  }, [open]);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/plant-types');
      setTypes(res.data);
    } catch (error) {
      console.error('Failed to fetch plant types', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: PlantType) => {
    setEditingType({ ...type });
    setImageFile(null);
  };

  const handleAddNew = () => {
    setEditingType({
      name: '',
      scientificName: '',
      otherNames: '',
      petToxicity: '',
      careInstructions: '',
      propagationInstructions: '',
      defaultWateringFrequencyDays: 7
    });
    setImageFile(null);
  };

  const handleSave = async () => {
    if (!editingType || !editingType.name) return;

    try {
      let savedType;
      if (editingType.id) {
        const res = await axios.put(`/api/plant-types/${editingType.id}`, editingType);
        savedType = res.data;
      } else {
        const res = await axios.post('/api/plant-types', editingType);
        savedType = res.data;
      }

      if (imageFile && savedType.id) {
        const formData = new FormData();
        formData.append('file', imageFile);
        await axios.post(`/api/plant-types/${savedType.id}/image`, formData);
      }

      fetchTypes();
      setEditingType(null);
      setImageFile(null);
    } catch (error) {
      console.error('Failed to save plant type', error);
      alert('Failed to save. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/plant-types/${id}`);
      fetchTypes();
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Failed to delete plant type', error);
      alert('Failed to delete. It might be in use by existing plants.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sprout />
          <Typography variant="h6" fontWeight="bold">Master Plant Library</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleAddNew} size={isMobile ? "small" : "medium"}>
            {isMobile ? "Add" : "Add New Species"}
          </Button>
          {isMobile && (
            <IconButton onClick={onClose} size="small" edge="end">
              <X size={24} />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {editingType ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">{editingType.id ? 'Edit Species' : 'Add New Species'}</Typography>
              <Button onClick={() => setEditingType(null)} color="inherit">Cancel</Button>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Common Name"
                      value={editingType.name}
                      onChange={(e) => setEditingType({...editingType, name: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Scientific Name"
                      value={editingType.scientificName || ''}
                      onChange={(e) => setEditingType({...editingType, scientificName: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Other Names (Aliases)"
                      value={editingType.otherNames || ''}
                      onChange={(e) => setEditingType({...editingType, otherNames: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Watering Frequency (Days)"
                      type="number"
                      value={editingType.defaultWateringFrequencyDays || ''}
                      onChange={(e) => setEditingType({...editingType, defaultWateringFrequencyDays: parseInt(e.target.value) || 7})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Pet Toxicity"
                      placeholder="e.g. Toxic to cats if ingested"
                      value={editingType.petToxicity || ''}
                      onChange={(e) => setEditingType({...editingType, petToxicity: e.target.value})}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <Box sx={{ height: 200, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : editingType.exampleImagePath ? (
                      <img src={`/uploads/thumb_${editingType.exampleImagePath}`} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Typography color="textSecondary">No Example Photo</Typography>
                    )}
                    <input
                      type="file"
                      hidden
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                    />
                    <IconButton
                      sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'white' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={16} />
                    </IconButton>
                  </Box>
                  <CardContent>
                    <Typography variant="caption" color="textSecondary">
                      Upload a reference photo for this species.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Care Instructions</Typography>
                <ReactQuill
                  theme="snow"
                  value={editingType.careInstructions || ''}
                  onChange={(val) => setEditingType({...editingType, careInstructions: val})}
                  style={{ height: 200, marginBottom: 50 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Propagation Notes</Typography>
                <ReactQuill
                  theme="snow"
                  value={editingType.propagationInstructions || ''}
                  onChange={(val) => setEditingType({...editingType, propagationInstructions: val})}
                  style={{ height: 200, marginBottom: 50 }}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button onClick={() => setEditingType(null)}>Cancel</Button>
              <Button variant="contained" onClick={handleSave}>Save Species</Button>
            </Box>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell width={60}>Image</TableCell>
                  <TableCell>Common Name</TableCell>
                  {!isMobile && <TableCell>Scientific Name</TableCell>}
                  {!isMobile && <TableCell>Toxicity</TableCell>}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : types.map((type) => (
                  <TableRow key={type.id} hover>
                    <TableCell>
                      {type.exampleImagePath ? (
                        <Box
                          component="img"
                          src={`/uploads/thumb_${type.exampleImagePath}`}
                          sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                        />
                      ) : (
                        <Box sx={{ width: 40, height: 40, bgcolor: '#eee', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Sprout size={16} color="#999" />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {type.name}
                      {isMobile && type.scientificName && (
                        <Typography variant="caption" display="block" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                          {type.scientificName}
                        </Typography>
                      )}
                    </TableCell>
                    {!isMobile && <TableCell sx={{ fontStyle: 'italic', color: 'text.secondary' }}>{type.scientificName}</TableCell>}
                    {!isMobile && (
                      <TableCell>
                         {type.petToxicity && (
                           <Tooltip title={type.petToxicity}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                               <AlertCircle size={14} color={type.petToxicity.toLowerCase().includes('safe') ? 'green' : 'orange'} />
                               <Typography variant="caption" noWrap sx={{ maxWidth: 150, display: 'block' }}>{type.petToxicity}</Typography>
                             </Box>
                           </Tooltip>
                         )}
                      </TableCell>
                    )}
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEdit(type)}><Edit2 size={16} /></IconButton>
                      {confirmDeleteId === type.id ? (
                        <Box component="span">
                           <IconButton size="small" color="error" onClick={() => type.id && handleDelete(type.id)}><Check size={16} /></IconButton>
                           <IconButton size="small" onClick={() => setConfirmDeleteId(null)}><X size={16} /></IconButton>
                        </Box>
                      ) : (
                        <IconButton size="small" onClick={() => type.id && setConfirmDeleteId(type.id)}><Trash2 size={16} /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && types.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>No species found. Add one to get started!</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
