import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Typography, Button, CircularProgress 
} from '@mui/material';
import { History } from 'lucide-react';
import { PlantUpdate } from '../../types';
import { getLocalDateString } from '../../utils/dateUtils';

interface UpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (update: Partial<PlantUpdate>) => void;
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

  useEffect(() => {
    if (editingUpdate) {
      setDate(editingUpdate.date);
      setNotes(editingUpdate.notes);
    } else {
      setDate(getLocalDateString());
      setNotes('');
    }
  }, [editingUpdate, open]);

  const handleSave = () => {
    onSave({ date, notes });
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
