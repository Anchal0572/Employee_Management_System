import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Permanently enforce light theme across all pages
document.documentElement.classList.remove('dark');
try {
  localStorage.removeItem('workpulse_theme');
  localStorage.removeItem('theme');
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
