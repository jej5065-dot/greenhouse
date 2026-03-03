import React from 'react';
import { Box, Button, Menu, MenuItem, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { AlertCircle, Droplet, ArrowUpDown, Grid as GridIcon, LayoutGrid, AlignJustify } from 'lucide-react';
import { ViewMode } from '../../types';

interface FilterBarProps {
  onFilter: (term: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  onFilter,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}) => {
  const [sortAnchor, setSortAnchor] = React.useState<null | HTMLElement>(null);

  const handleSortClick = (val: string) => {
    onSortChange(val);
    setSortAnchor(null);
  };

  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button 
          variant="contained" size="small" startIcon={<AlertCircle />} 
          onClick={() => onFilter('Needs Attention')} color="warning"
        >
          Needs Attention
        </Button>
        <Button 
          variant="outlined" size="small" startIcon={<Droplet />} 
          onClick={() => onFilter('Need Watering')}
        >
          Due
        </Button>
        <Button variant="text" size="small" onClick={() => onFilter('')}>
          All
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowUpDown size={18} />} onClick={(e) => setSortAnchor(e.currentTarget)} size="small">
          Sort: {sortBy === 'nextWaterDate' ? 'Urgency' : sortBy}
        </Button>
        <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
          <MenuItem onClick={() => handleSortClick('nextWaterDate')}>Urgency (Watering)</MenuItem>
          <MenuItem onClick={() => handleSortClick('id')}>Plant Number</MenuItem>
          <MenuItem onClick={() => handleSortClick('name')}>Name</MenuItem>
          <MenuItem onClick={() => handleSortClick('type')}>Type</MenuItem>
        </Menu>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && onViewModeChange(newMode)}
          size="small"
        >
          <ToggleButton value="gallery"><GridIcon size={16} /></ToggleButton>
          <ToggleButton value="compact"><LayoutGrid size={16} /></ToggleButton>
          <ToggleButton value="table"><AlignJustify size={16} /></ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
};

export default FilterBar;
