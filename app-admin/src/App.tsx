import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedLayout } from './layouts/ProtectedLayout';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <ProtectedLayout />
    </AuthProvider>
  );
}
