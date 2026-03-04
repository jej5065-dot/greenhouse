import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Typography, Button, CircularProgress, Box, IconButton
} from '@mui/material';
import { History, Camera as CameraIcon, X } from 'lucide-react';
import { PlantUpdate } from '../../types';
import { getLocalDateString } from '../../utils/dateUtils';

interface UpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (update: Partial<PlantUpdate>, file: File | null) => void;
  editingUpdate: PlantUpdate | null;
  isProcessing: boolean;
}

const UpdateDialog: React.FC<UpdateDialogProps> = ({
  open,
  onClose,
  onSave,
  editingUpdate,
  isProcessing
}) => {
  const [date, setDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (editingUpdate) {
      setDate(editingUpdate.date);
      setNotes(editingUpdate.notes);
    } else {
      setDate(getLocalDateString());
      setNotes('');
    }
    setSelectedFile(null);
  }, [editingUpdate, open]);

  const handleSave = () => {
    onSave({ date, notes }, selectedFile);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
        <History color="inherit" />
        {editingUpdate ? 'Edit History Entry' : 'Add Daily Growth Entry'}
      </DialogTitle>
      <DialogContent>
        {!editingUpdate && (
          <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
            Record today's progress, notes, and photos for your plant.
          </Typography>
        )}

        <Box sx={{ mt: 1, mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2, textAlign: 'center', bgcolor: '#fafafa' }}>
          {selectedFile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Typography variant="body2" noWrap sx={{ maxWidth: 150, fontWeight: 500 }}>{selectedFile.name}</Typography>
              <IconButton size="small" color="error" onClick={() => setSelectedFile(null)}><X size={14} /></IconButton>
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
                input.onchange = (e: any) => setSelectedFile(e.target.files[0]);
                input.click();
              }}
            >
              Attach Photo
            </Button>
          )}
        </Box>

        <TextField 
          fullWidth label="Entry Date" type="date" sx={{ mt: 1 }}
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          inputProps={{ max: getLocalDateString() }}
          size="small"
        />
        <TextField 
          fullWidth label={editingUpdate ? "Notes" : "Growth Notes"} multiline rows={4} sx={{ mt: 3 }}
          placeholder="How is the plant doing today? Any new leaves or roots?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={isProcessing}>
          {isProcessing ? <CircularProgress size={24} color="inherit" /> : (editingUpdate ? 'Update Entry' : 'Save Growth Day')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateDialog;
