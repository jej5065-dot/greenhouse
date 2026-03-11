import React from 'react';
import { Dialog, Box, IconButton, Typography } from '@mui/material';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { FullImageState } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';

interface LightboxProps {
  state: FullImageState | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDownload: (path: string, label?: string) => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  state,
  onClose,
  onNext,
  onPrev,
  onDownload
}) => {
  if (!state) return null;

  const currentImage = state.images[state.index];

  return (
    <Dialog
      open={Boolean(state)}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'black',
          boxShadow: 'none',
          overflow: 'hidden',
          m: 0,
          width: '100%',
          height: '100%',
          maxHeight: '100%'
        }
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconButton 
          onClick={onClose} 
          sx={{ position: 'absolute', top: 16, right: 16, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, zIndex: 100 }}
        >
          <X size={24} />
        </IconButton>

        <IconButton 
          onClick={() => onDownload(currentImage.path, currentImage.label)}
          sx={{ position: 'absolute', top: 16, right: 72, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, zIndex: 100 }}
        >
          <Download size={24} />
        </IconButton>

        {state.images.length > 1 && (
          <>
            <IconButton 
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              sx={{ 
                position: 'absolute', 
                left: 16,
                color: 'white', 
                bgcolor: 'rgba(0,0,0,0.3)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                zIndex: 50
              }}
            >
              <ChevronLeft size={32} />
            </IconButton>
            <IconButton 
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              sx={{ 
                position: 'absolute', 
                right: 16,
                color: 'white', 
                bgcolor: 'rgba(0,0,0,0.3)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                zIndex: 50
              }}
            >
              <ChevronRight size={32} />
            </IconButton>
          </>
        )}

        <Box sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}>
          <img 
            src={`/uploads/original_${currentImage.path}`} 
            alt="Full view" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '85vh',
              objectFit: 'contain', 
              transform: `rotate(${currentImage.rotation}deg)`,
              transition: 'transform 0.3s ease',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }} 
          />

          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            color: 'white',
            textAlign: 'center',
            bgcolor: 'rgba(0,0,0,0.6)',
            py: 2,
            px: 4
          }}>
            <Typography variant="h6" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {currentImage.date ? formatDisplayDate(currentImage.date) : 'Untitled Photo'}
            </Typography>
            {currentImage.notes && (
              <Typography variant="body2" sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', mt: 0.5, maxWidth: 600, mx: 'auto' }}>
                {currentImage.notes}
              </Typography>
            )}
            {currentImage.label && (
              <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', opacity: 0.8, mt: 0.5 }}>
                {currentImage.label}
              </Typography>
            )}
            {state.images.length > 1 && (
              <Typography variant="caption" sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', opacity: 0.6, display: 'block', mt: 1 }}>
                {state.index + 1} of {state.images.length}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default Lightbox;
