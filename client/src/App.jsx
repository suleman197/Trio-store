import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { SettingsProvider } from './hooks/useSiteSettings.jsx';

export default function App() {
  return (
    <SettingsProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#d4af37',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid #333',
          },
          success: { iconTheme: { primary: '#d4af37', secondary: '#1a1a1a' } },
        }}
      />
    </SettingsProvider>
  );
}
