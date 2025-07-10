import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BookingForm from './components/BookingForm';
import ViajesResults from './components/ViajesResults';
import DestinationsPage from './components/DestinationsPage';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchResults, setSearchResults] = useState(null);
  const { user, isAuthenticated } = useAuth();

  const handleSearch = (results: any) => {
    setSearchResults(results);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (page !== 'home') {
      setSearchResults(null);
    }
  };

  const handleLoginSuccess = () => {
    setCurrentPage('admin');
  };

  if (isAuthenticated && user?.rol === 'ADMIN') {
    return <AdminDashboard />;
  }

  if (currentPage === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === 'home' && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-800 mb-4">
                Viaja con <span className="text-orange-500">Perú Bus</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Conectamos todo el Perú con comodidad, seguridad y los mejores precios.
                Tu próximo destino está a un clic de distancia.
              </p>
            </div>
            
            <BookingForm onSearch={handleSearch} />
            
            {searchResults && <ViajesResults searchData={searchResults} />}
          </>
        )}

        {currentPage === 'destinations' && <DestinationsPage />}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;