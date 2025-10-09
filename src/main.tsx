import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { debugEnvironment, testAPIAvailability } from './utils/debugEnv'

// Debug environment variables on startup
if (import.meta.env.DEV) {
  debugEnvironment();
  // Test APIs after a short delay
  setTimeout(() => {
    testAPIAvailability();
  }, 2000);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Report web vitals in production
// Temporarily disabled for build testing
// if (import.meta.env.PROD) {
//   import('./utils/performance').then(({ reportWebVitals }) => {
//     reportWebVitals();
//   });
// }
