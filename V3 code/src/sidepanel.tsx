export { }; // Force module
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/components/App';

console.log('[JobSwyft] Sidepanel mounting...');
const root = document.getElementById('root');
if (!root) console.error('[JobSwyft] Root element not found!');

import { ErrorBoundary } from '@/components/ErrorBoundary';

ReactDOM.createRoot(root!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
