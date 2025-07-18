import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>

    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
