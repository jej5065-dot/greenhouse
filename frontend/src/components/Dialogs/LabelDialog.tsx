import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Typography, TextField, Button, CircularProgress 
} from '@mui/material';

interface LabelDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
  initialLabel: string;
  isProcessing: boolean;
}

const LabelDialog: React.FC<LabelDialogProps> = ({
  open,
  onClose,
  onSave,
  initialLabel,
  isProcessing
}) => {
  const [label, setLabel] = useState(initialLabel);

  useEffect(() => {
    setLabel(initialLabel);
  }, [initialLabel, open]);

  const handleSave = () => {
    onSave(label);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Edit Photo Label</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Provide a short label for this photo (e.g., "Top Down", "New Leaf").
        </Typography>
        <TextField 
          fullWidth label="Photo Label" autoFocus sx={{ mt: 1 }}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Side view"
          size="small"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={isProcessing}>
          {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Update Label'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabelDialog;
