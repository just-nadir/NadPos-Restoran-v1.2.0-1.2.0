import React, { lazy, Suspense, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios'; // Import axios
import { ThemeProvider } from './context/ThemeProvider';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';

// Lazy loading - Code Splitting
const DesktopLayout = lazy(() => import('./components/DesktopLayout'));


function App() {
  const [configChecked, setConfigChecked] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    const checkConfig = async () => {
      // Agar Electron bo'lmasa (Browser), konfiguratsiyani o'tkazib yuboramiz
      if (!window.electron) {
        setIsConfigured(true);
        setConfigChecked(true);
        return;
      }

      try {
        const settings = await window.electron.ipcRenderer.invoke('get-settings');
        if (settings && settings.restaurant_id && settings.access_key) {
          // 1. Optimistic UI: Darhol dasturni ochish
          setIsConfigured(true);
          setConfigChecked(true);

          // 2. Background Verification
          // Fon rejimida tekshirish (foydalanuvchini kutdirmaslik uchun)
          axios.get(`https://halboldi.uz/api/restaurants/${settings.restaurant_id}/verify`, {
            headers: { 'x-access-key': settings.access_key }
          }).then(() => {
            // Hammasi joyida
          }).catch(err => {
            if (err.response && err.response.status === 403) {
              // Obuna tugagan bo'lsa, bloklash
              setSubscriptionExpired(true);
              setBlockReason(err.response.data.message || "Obuna muddati tugagan.");
            } else {
              console.log("Background check error (Offline/Server):", err.message);
            }
          });
        } else {
          // Sozlamalar yo'q -> Onboarding
          setIsConfigured(false);
          setConfigChecked(true);
        }
      } catch (err) {
        console.error('Config check failed:', err);
        // Xatolik bo'lsa ham onboardingga o'tkazish xavfsizroq yoki retry qilish kerak
        setConfigChecked(true);
      }
    };

    checkConfig();
  }, []);

  if (!configChecked) return <LoadingSpinner />;

  if (subscriptionExpired) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kirish Cheklangan</h2>
          <p className="text-gray-600 mb-6">{blockReason}</p>
          <p className="text-sm text-gray-400">Iltimos, Administrator bilan bog'laning.</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return <Onboarding onComplete={() => window.location.reload()} />;
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <ErrorBoundary>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Asosiy Desktop ilova */}
              <Route path="/" element={<DesktopLayout />} />

              {/* Mobil Ofitsiant ilovasi */}

            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;