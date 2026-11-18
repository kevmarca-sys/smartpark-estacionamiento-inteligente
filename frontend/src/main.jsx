/**
 * Punto de entrada del frontend
 *
 * Monta la aplicación con el enrutador, el contexto de autenticación y las notificaciones.
 */

import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Se omite React.StrictMode porque en desarrollo ejecuta los efectos dos veces
// y encendería la cámara por duplicado.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontSize: '14px' } }} />
    </AuthProvider>
  </BrowserRouter>,
);
