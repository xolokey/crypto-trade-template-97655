import React from 'react'
import ReactDOM from 'react-dom/client'
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
