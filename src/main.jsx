import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { TemaProvider } from './context/TemaContext';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';

import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TemaProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </TemaProvider>
  </StrictMode>
);