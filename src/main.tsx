import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { ConfigurationProvider } from './contexts/ConfigurationProvider';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('The application root element is missing.');
}

createRoot(root).render(
  <StrictMode>
    <ConfigurationProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigurationProvider>
  </StrictMode>,
);
