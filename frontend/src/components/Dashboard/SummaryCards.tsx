import React from 'react';
import { Grid, Card, Typography } from '@mui/material';
import { PlantSummary } from '../../types';

interface SummaryCardsProps {
  summary: PlantSummary;
  onFilter: (term: string) => void;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, onFilter }) => {
  const cards = [
    { 
      label: 'Total Plants', 
      value: summary.totalPlants, 
      color: 'primary', 
      hoverBg: '#f1f8e9', 
      filter: '' 
    },
    { 
      label: 'Needs Attention', 
      value: summary.needsAttention, 
      color: 'warning.main', 
      hoverBg: '#fffde7', 
      filter: 'Needs Attention' 
    },
    { 
      label: 'Propagating', 
      value: summary.propagating, 
      color: 'secondary', 
      hoverBg: '#f3e5f5', 
      filter: 'Propagating' 
    },
    { 
      label: 'To Water Today', 
      value: summary.needsWatering, 
      color: 'info.main', 
      hoverBg: '#e3f2fd', 
      filter: 'Need Watering' 
    }
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {cards.map((card) => (
        <Grid item xs={6} sm={3} key={card.label}>
          <Card 
            elevation={1} 
            sx={{ 
              p: 2, textAlign: 'center', cursor: 'pointer', transition: '0.3s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 3, bgcolor: card.hoverBg } 
            }}
            onClick={() => onFilter(card.filter)}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: card.color }}>
              {card.value}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {card.label}
            </Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryCards;
