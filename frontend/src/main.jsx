/**
 * Punto de entrada del frontend
 *
 * Monta la aplicación con el enrutador, las preferencias visuales (tema e idioma),
 * el contexto de autenticación y las notificaciones.
 */

import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PreferenciasProvider } from './context/PreferenciasContext';
import './index.css';

// Se omite React.StrictMode porque en desarrollo ejecuta los efectos dos veces
// y encendería la cámara por duplicado.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <PreferenciasProvider>
      <AuthProvider>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontSize: '14px' } }} />
      </AuthProvider>
    </PreferenciasProvider>
  </BrowserRouter>,
);
