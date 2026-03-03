export const formatCurrency = (val?: number) => {
  if (val === undefined || val === null) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

export const getToxicityColor = (toxicity?: string) => {
  if (!toxicity || toxicity.toLowerCase().includes('safe') || toxicity.toLowerCase().includes('fine')) return null;
  const t = toxicity.toLowerCase();
  if (t.includes('heart') || t.includes('severe') || t.includes('death')) return '#d32f2f'; // Dangerous Red
  return '#ffc107'; // Warning Yellow/Amber
};
