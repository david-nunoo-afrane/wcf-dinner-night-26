import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully catch and swallow unhandled third-party script loading errors inside sandboxed previews
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__DNA_CREDIT__ = "Made with ♥️🌚 by DNA";
  console.log(
    "%cMade with ♥️🌚 by DNA",
    "color: #B38F6F; font-family: 'Playfair Display', serif; font-size: 14px; font-weight: bold; text-shadow: 0 0 5px rgba(179,143,111,0.2); padding: 4px 8px; border-left: 3px solid #B38F6F;"
  );

  // Intercept console.error and console.warn to swallow harmless Firestore clock-desync warnings
  const originalError = console.error;
  console.error = function (...args) {
    const msg = args.map(arg => (arg && typeof arg === 'object' && arg.message) ? arg.message : String(arg)).join(' ');
    if (
      msg.includes('Detected an update time that is in the future') ||
      (msg.includes('Firestore') && msg.includes('update time') && msg.includes('future'))
    ) {
      // Swallowed harmless Firestore clock drift message
      return;
    }
    originalError.apply(console, args);
  };

  const originalWarn = console.warn;
  console.warn = function (...args) {
    const msg = args.map(arg => (arg && typeof arg === 'object' && arg.message) ? arg.message : String(arg)).join(' ');
    if (
      msg.includes('Detected an update time that is in the future') ||
      (msg.includes('Firestore') && msg.includes('update time') && msg.includes('future'))
    ) {
      // Swallowed harmless Firestore clock drift message
      return;
    }
    originalWarn.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('Script error')
    )) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('Swallowed safe environmental script error:', event.message);
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
