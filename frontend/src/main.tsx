import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Success Green
    },
    secondary: {
      main: '#81c784',
    },
    background: {
      default: '#f1f8e9', // Light Green background
    }
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
