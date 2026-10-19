import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

// Client ID Google OAuth da variabile d'ambiente VITE_GOOGLE_CLIENT_ID
const googleClientId =
  (typeof process !== 'undefined' && process.env?.VITE_GOOGLE_CLIENT_ID) ||
  (import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) ||
  '';

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={googleClientId || 'jesic-meet-client-id'}>
    <App />
  </GoogleOAuthProvider>
);
