import React, { useState, useRef } from 'react';
import { Container, Box, Fab } from '@mui/material';
import { Plus } from 'lucide-react';

// Types
import { Plant, PlantUpdate, ViewMode, FullImageState } from './types';

// Hooks
import { usePlants } from './hooks/usePlants';
import { usePlantActions } from './hooks/usePlantActions';

// API
import { plantApi } from './api/plantApi';

// Utilities
import { getLocalDateString, formatDisplayDate } from './utils/dateUtils';

// Components
import Header from './components/Layout/Header';
import SummaryCards from './components/Dashboard/SummaryCards';
import FilterBar from './components/Dashboard/FilterBar';
import PlantGalleryView from './components/Plants/PlantGalleryView';
import PlantCompactView from './components/Plants/PlantCompactView';
import PlantTableView from './components/Plants/PlantTableView';

// Dialogs
import PlantDetailDialog from './components/Dialogs/PlantDetailDialog';
import QuickAddDialog from './components/Dialogs/QuickAddDialog';
import Lightbox from './components/Dialogs/Lightbox';
import UpdateDialog from './components/Dialogs/UpdateDialog';
import ConfirmationDialog from './components/Dialogs/ConfirmationDialog';
import LabelDialog from './components/Dialogs/LabelDialog';
import AlertDialog, { AlertSeverity } from './components/Dialogs/AlertDialog';
import PlantLibraryDialog from './components/PlantLibraryDialog';

function App() {
  // Main state from hooks
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(localStorage.getItem('greenhouse_sort') || 'nextWaterDate');
  const [viewMode, setViewMode] = useState<ViewMode>(localStorage.getItem('greenhouse_view') as ViewMode || 'gallery');

  const {
    plants,
    plantTypes,
    locations,
    summary,
    refreshAll,
    fetchPlants,
    fetchSummary,
    fetchPlantTypes
  } = usePlants(searchTerm, sortBy);

  const {
    isProcessing,
    waterPlant,
    snoozePlant,
    propagatePlant,
    deletePlant,
    updatePlant,
    addPlant
  } = usePlantActions(fetchPlants, fetchSummary, undefined, searchTerm);

  // Local UI State
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [openAdd, setOpenAdd] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [fullImage, setFullImage] = useState<FullImageState | null>(null);
  
  // Update/History state
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<PlantUpdate | null>(null);
  const [duplicateDayOpen, setDuplicateDayOpen] = useState(false);
  const [uploadingToUpdateId, setUploadingToUpdateId] = useState<number | null>(null);
  
  // Label state
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [imageToLabel, setImageToLabel] = useState<{id: number, label: string} | null>(null);

  // Confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState<number | null>(null);
  const [deleteUpdateConfirmOpen, setDeleteUpdateConfirmOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<PlantUpdate | null>(null);

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>('error');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Helpers
  const showAlert = (msg: string, severity: AlertSeverity = 'error') => {
    setAlertMsg(msg);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const handleSetSort = (val: string) => {
    setSortBy(val);
    localStorage.setItem('greenhouse_sort', val);
  };

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('greenhouse_view', mode);
  };

  const handleViewDetails = async (id: number, tabIndex = 0) => {
    try {
      const res = await plantApi.fetchPlantDetails(id);
      setSelectedPlant(res.data);
      setDetailTab(tabIndex);
    } catch (error) {
      showAlert('Failed to fetch plant details.');
    }
  };

  // Action Handlers
  const onWater = (id: number) => {
    waterPlant(id, () => {
      if (selectedPlant?.id === id) handleViewDetails(id, detailTab);
    }).catch(() => showAlert('Failed to log watering.'));
  };

  const onSnooze = (id: number) => {
    snoozePlant(id, () => {
      if (selectedPlant?.id === id) handleViewDetails(id, detailTab);
    }).catch(() => showAlert('Failed to snooze watering.'));
  };

  const onPropagate = (id: number) => {
    propagatePlant(id).catch(() => showAlert('Failed to propagate.'));
  };

  const onAdd = (newPlantData: Partial<Plant>, initialFile: File | null) => {
    addPlant(newPlantData, initialFile, (created) => {
      setOpenAdd(false);
      handleViewDetails(created.id);
      showAlert('Plant added successfully!', 'success');
    }).catch((err) => {
      const msg = err.response?.data?.message || err.message || 'Server error';
      showAlert(`Failed to add plant: ${msg}`);
    });
  };

  const onUpdate = (plantData: Plant) => {
    const data = { ...plantData };
    delete (data as any).parent;
    delete (data as any).children;

    updatePlant(data.id, data, () => {
      setSelectedPlant(null);
      showAlert('Plant updated successfully.', 'success');
    }).catch(() => showAlert('Failed to save changes.'));
  };

  const onConfirmDelete = () => {
    if (plantToDelete) {
      deletePlant(plantToDelete, () => {
        setSelectedPlant(null);
        setDeleteConfirmOpen(false);
        setPlantToDelete(null);
      }).catch(() => showAlert('Failed to delete plant.'));
    }
  };

  // Image & History Handlers
  const openGalleryForPlant = (plant: Plant, startingPath?: string) => {
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
      if (index === -1) index = allImages.length - 1;
    } else {
      index = allImages.length - 1;
    }

    setFullImage({ images: allImages, index });
  };

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
    } catch (error) { showAlert('Failed to download image.'); }
  };

  const handleRotateMain = async (id: number, rotation: number) => {
    try {
      await plantApi.rotateMainImage(id, (rotation + 90) % 360);
      handleViewDetails(id, detailTab);
      fetchPlants(searchTerm);
    } catch (err) { showAlert('Failed to rotate image.'); }
  };

  const handleRotateImage = async (id: number, rotation: number) => {
    try {
      await plantApi.rotateImage(id, (rotation + 90) % 360);
      if (selectedPlant) handleViewDetails(selectedPlant.id, detailTab);
    } catch (err) { showAlert('Failed to rotate image.'); }
  };

  const handleSetCover = async (plantId: number, imageId: number) => {
    try {
      await plantApi.setCoverPhoto(plantId, imageId);
      handleViewDetails(plantId, 0);
      fetchPlants(searchTerm);
    } catch (err) { showAlert('Failed to set cover photo.'); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPlant) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      let updateId = uploadingToUpdateId;
      if (!updateId) {
        const res = await plantApi.addUpdate(selectedPlant.id, { date: getLocalDateString(), notes: 'Photo added' });
        updateId = res.data.id;
      }
      await plantApi.uploadImage(updateId, formData);
      handleViewDetails(selectedPlant.id, detailTab);
      fetchPlants(searchTerm);
      setUploadingToUpdateId(null);
      showAlert('Image uploaded successfully.', 'success');
    } catch (err) { showAlert('Upload failed. Image might be too large.'); }
  };

  const handleSaveUpdate = async (update: Partial<PlantUpdate>) => {
    if (!selectedPlant) return;
    try {
      if (editingUpdate) {
        await plantApi.updateUpdate(editingUpdate.id, update);
        setEditingUpdate(null);
      } else {
        const today = getLocalDateString();
        if (update.date! > today) return showAlert('Cannot log future dates.');
        const existing = (selectedPlant.updates || []).find(u => u.date === update.date);
        if (existing) return showAlert('Entry for this date already exists.');
        await plantApi.addUpdate(selectedPlant.id, update);
        setUpdateDialogOpen(false);
      }
      handleViewDetails(selectedPlant.id, 2);
      showAlert('History updated.', 'success');
    } catch (err) { showAlert('Failed to save update.'); }
  };

  const handleExecuteDeleteUpdate = async () => {
    if (updateToDelete) {
      try {
        await plantApi.deleteUpdate(updateToDelete.id);
        setDeleteUpdateConfirmOpen(false);
        setUpdateToDelete(null);
        if (selectedPlant) handleViewDetails(selectedPlant.id, 2);
        fetchPlants(searchTerm);
      } catch (err) { showAlert('Failed to delete entry.'); }
    }
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await plantApi.importPlantTypes(formData);
      fetchPlantTypes();
      showAlert('Library updated!', 'success');
    } catch (err) { showAlert('CSV Import failed.'); }
  };

  const handleIdentify = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await plantApi.identifyPlant(formData);
      showAlert('Plant identified successfully!', 'success');
      return res.data;
    } catch (err) {
      showAlert('Failed to identify plant. Ensure your API key is correct.');
      throw err;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
      <input type="file" accept=".csv" style={{ display: 'none' }} ref={csvInputRef} onChange={handleCsvUpload} />

      <Header 
        onRefresh={() => refreshAll(searchTerm)}
        onOpenLibrary={() => setLibraryOpen(true)}
        onImportCsv={() => csvInputRef.current?.click()}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearchSubmit={(e) => { e.preventDefault(); fetchPlants(searchTerm); }}
        isProcessing={isProcessing}
      />

      <Container sx={{ mt: 3, pb: 10 }}>
        {summary && <SummaryCards summary={summary} onFilter={(f) => { setSearchTerm(f); fetchPlants(f); }} />}
        
        <FilterBar 
          onFilter={(f) => { setSearchTerm(f); fetchPlants(f); }}
          sortBy={sortBy}
          onSortChange={handleSetSort}
          viewMode={viewMode}
          onViewModeChange={handleSetViewMode}
        />

        {viewMode === 'gallery' && (
          <PlantGalleryView 
            plants={plants}
            onViewDetails={handleViewDetails}
            onOpenGallery={openGalleryForPlant}
            onWater={onWater}
            onSnooze={onSnooze}
            onPropagate={onPropagate}
            onUpload={(id) => { setUploadingToUpdateId(null); fileInputRef.current?.click(); }}
            isProcessing={isProcessing}
          />
        )}

        {viewMode === 'compact' && (
          <PlantCompactView plants={plants} onViewDetails={handleViewDetails} />
        )}

        {viewMode === 'table' && (
          <PlantTableView 
            plants={plants}
            onViewDetails={handleViewDetails}
            onWater={onWater}
            onSnooze={onSnooze}
            onUpload={(id) => { setUploadingToUpdateId(null); fileInputRef.current?.click(); }}
            isProcessing={isProcessing}
          />
        )}
      </Container>

      <PlantDetailDialog 
        open={Boolean(selectedPlant)}
        plant={selectedPlant}
        onClose={() => setSelectedPlant(null)}
        onUpdate={onUpdate}
        onWater={onWater}
        onSnooze={onSnooze}
        onPropagate={onPropagate}
        onDelete={(id) => { setPlantToDelete(id); setDeleteConfirmOpen(true); }}
        onRotateMain={handleRotateMain}
        onDownload={handleDownload}
        onOpenGallery={openGalleryForPlant}
        onAddPhoto={() => {
          const today = getLocalDateString();
          const existing = selectedPlant?.updates?.find(u => u.date === today);
          if (existing) {
            setDuplicateDayOpen(true);
          } else {
            setUpdateDialogOpen(true);
          }
        }}
        onDeleteUpdate={(u) => { setUpdateToDelete(u); setDeleteUpdateConfirmOpen(true); }}
        onDeleteImage={async (id) => {
           try { await plantApi.deleteImage(id); handleViewDetails(selectedPlant!.id, detailTab); } 
           catch (e) { showAlert('Failed to delete image.'); }
        }}
        onRotateImage={handleRotateImage}
        onSetCover={handleSetCover}
        onEditUpdate={(u) => { setEditingUpdate(u); setUpdateDialogOpen(true); }}
        onUpdateLabel={(id, l) => { setImageToLabel({id, label: l}); setLabelDialogOpen(true); }}
        plantTypes={plantTypes}
        locations={locations}
        isProcessing={isProcessing}
        initialTab={detailTab}
      />

      <QuickAddDialog 
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onAdd={onAdd}
        onIdentify={handleIdentify}
        plantTypes={plantTypes}
        locations={locations}
        isProcessing={isProcessing}
      />

      <Lightbox 
        state={fullImage}
        onClose={() => setFullImage(null)}
        onNext={() => setFullImage(s => s ? {...s, index: (s.index + 1) % s.images.length} : null)}
        onPrev={() => setFullImage(s => s ? {...s, index: (s.index - 1 + s.images.length) % s.images.length} : null)}
        onDownload={handleDownload}
      />

      <UpdateDialog 
        open={updateDialogOpen}
        onClose={() => { setUpdateDialogOpen(false); setEditingUpdate(null); }}
        onSave={handleSaveUpdate}
        editingUpdate={editingUpdate}
        isProcessing={isProcessing}
      />

      <ConfirmationDialog 
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={onConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this plant? This action cannot be undone."
        confirmText="Delete Plant"
        confirmColor="error"
        isProcessing={isProcessing}
      />

      <ConfirmationDialog 
        open={deleteUpdateConfirmOpen}
        onClose={() => setDeleteUpdateConfirmOpen(false)}
        onConfirm={handleExecuteDeleteUpdate}
        title="Delete History Entry"
        message={`Are you sure you want to delete the entry for ${updateToDelete ? formatDisplayDate(updateToDelete.date) : ''}?`}
        confirmText="Delete Entry"
        confirmColor="error"
        isProcessing={isProcessing}
      />

      <ConfirmationDialog 
        open={duplicateDayOpen}
        onClose={() => setDuplicateDayOpen(false)}
        onConfirm={() => {
          setDuplicateDayOpen(false);
          const today = getLocalDateString();
          const existing = selectedPlant?.updates?.find(u => u.date === today);
          if (existing) {
            setUploadingToUpdateId(existing.id);
            fileInputRef.current?.click();
          }
        }}
        title="Entry Already Exists"
        message="An entry for today already exists. Would you like to add another photo to it?"
        confirmText="Add Photo"
        cancelText="Backdate Instead"
      />

      <LabelDialog 
        open={labelDialogOpen}
        onClose={() => setLabelDialogOpen(false)}
        onSave={async (l) => {
          if (imageToLabel) {
            try {
              await plantApi.updateImageLabel(imageToLabel.id, l);
              setLabelDialogOpen(false);
              if (selectedPlant) handleViewDetails(selectedPlant.id, detailTab);
            } catch (e) { showAlert('Failed to update label.'); }
          }
        }}
        initialLabel={imageToLabel?.label || ''}
        isProcessing={isProcessing}
      />

      <AlertDialog 
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMsg}
        severity={alertSeverity}
      />

      <PlantLibraryDialog open={libraryOpen} onClose={() => { setLibraryOpen(false); fetchPlantTypes(); }} />

      <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={() => setOpenAdd(true)}><Plus /></Fab>
    </Box>
  );
}

export default App;
