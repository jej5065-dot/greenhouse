import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Typography, Button, useTheme, useMediaQuery, IconButton
} from '@mui/material';
import { AlertCircle, AlertTriangle, Check, Info, X } from 'lucide-react';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: `${severity}.main`, fontWeight: 'bold' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {getIcon()}
          {getTitle()}
        </div>
        {isMobile && (
          <IconButton onClick={onClose} size="small" edge="end">
            <X size={24} />
          </IconButton>
        )}
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
