import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Typography, Button 
} from '@mui/material';
import { AlertCircle, AlertTriangle, Check, Info } from 'lucide-react';

export type AlertSeverity = 'error' | 'warning' | 'info' | 'success';

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity: AlertSeverity;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onClose,
  message,
  severity
}) => {
  const getIcon = () => {
    switch (severity) {
      case 'error': return <AlertCircle />;
      case 'warning': return <AlertTriangle />;
      case 'success': return <Check />;
      case 'info': return <Info />;
    }
  };

  const getTitle = () => {
    switch (severity) {
      case 'error': return 'Oops! Something went wrong';
      case 'warning': return 'Note';
      case 'success': return 'Success';
      case 'info': return 'Info';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: `${severity}.main`, fontWeight: 'bold' }}>
        {getIcon()}
        {getTitle()}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color={severity}>Dismiss</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;
