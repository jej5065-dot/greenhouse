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
    <Dialog open={Boolean(state)} onClose={onClose} maxWidth="lg" fullWidth>
      <Box sx={{ position: 'relative', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <IconButton 
          onClick={onClose} 
          sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, zIndex: 10 }}
        >
          <X size={20} />
        </IconButton>

        <IconButton 
          onClick={() => onDownload(currentImage.path, currentImage.label)}
          sx={{ position: 'absolute', top: 8, right: 56, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, zIndex: 10 }}
        >
          <Download size={20} />
        </IconButton>

        {state.images.length > 1 && (
          <>
            <IconButton 
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
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
              onClick={(e) => { e.stopPropagation(); onNext(); }}
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

        <Box sx={{ textAlign: 'center', width: '100%', px: { xs: 8, sm: 12 } }}>
          <img 
            src={`/uploads/original_${currentImage.path}`} 
            alt="Full view" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '80vh', 
              objectFit: 'contain', 
              transform: `rotate(${currentImage.rotation}deg)`,
              transition: 'transform 0.3s ease',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }} 
          />
          <Box sx={{ position: 'absolute', bottom: 16, left: 0, right: 0, color: 'white', textAlign: 'center', bgcolor: 'rgba(0,0,0,0.4)', py: 1 }}>
            <Typography variant="h6" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {currentImage.date ? formatDisplayDate(currentImage.date) : 'Untitled Photo'}
            </Typography>
            {currentImage.notes && (
              <Typography variant="body2" sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', mt: 0.5, px: 4 }}>
                {currentImage.notes}
              </Typography>
            )}
            {currentImage.label && (
              <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', opacity: 0.8 }}>
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
