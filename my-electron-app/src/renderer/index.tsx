import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Renderer starting...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);

const container = document.getElementById('root');
if (!container) {
  console.error('Root container not found');
} else {
  console.log('Root container found, rendering App...');
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}