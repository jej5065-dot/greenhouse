import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Typography, TextField, Button, CircularProgress, useTheme, useMediaQuery, IconButton, Box
} from '@mui/material';
import { X } from 'lucide-react';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setLabel(initialLabel);
  }, [initialLabel, open]);

  const handleSave = () => {
    onSave(label);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Edit Photo Label
        {isMobile && (
          <IconButton onClick={onClose} size="small" edge="end">
            <X size={24} />
          </IconButton>
        )}
      </DialogTitle>
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
