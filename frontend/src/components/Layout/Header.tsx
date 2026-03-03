import React from 'react';
import { AppBar, Toolbar, Typography, Box, Tooltip, IconButton, TextField } from '@mui/material';
import { Sprout, RefreshCw, BookOpen, FileUp, Search } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  onOpenLibrary: () => void;
  onImportCsv: () => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  isProcessing: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onOpenLibrary,
  onImportCsv,
  searchTerm,
  setSearchTerm,
  onSearchSubmit,
  isProcessing,
}) => {
  return (
    <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
      <Toolbar>
        <Sprout style={{ marginRight: 12 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Greenhouse
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton color="inherit" onClick={onRefresh} disabled={isProcessing}>
              <RefreshCw size={20} className={isProcessing ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Manage Plant Library">
            <IconButton color="inherit" onClick={onOpenLibrary}><BookOpen size={20} /></IconButton>
          </Tooltip>
          <Tooltip title="Import Plant Library (CSV)">
            <IconButton color="inherit" onClick={onImportCsv}><FileUp size={20} /></IconButton>
          </Tooltip>
          <Box 
            component="form" 
            onSubmit={onSearchSubmit} 
            sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, px: 1.5 }}
          >
            <Search size={18} color="white" />
            <TextField 
              placeholder="Search..." variant="standard" size="small" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                ml: 1, 
                width: { xs: 100, sm: 200 }, 
                '& .MuiInputBase-input': { color: 'white', py: 0.5 },
                '& .MuiInput-underline:before': { borderBottom: 'none' },
                '& .MuiInput-underline:after': { borderBottom: 'none' },
                '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
              }}
            />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
