import React from 'react';
import { Bus, MapPin, Users } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  return (
    <nav className="bg-white shadow-lg border-b-4 border-orange-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Bus className="h-8 w-8 text-orange-500 mr-2" />
            <span className="text-2xl font-bold text-gray-800">
              Perú <span className="text-orange-500">Bus</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-8">
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                currentPage === 'home' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500'
              }`}
            >
              <Bus className="h-5 w-5 mr-2" />
              Elegir Viajes
            </button>
            
            <button
              onClick={() => onNavigate('destinations')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                currentPage === 'destinations' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500'
              }`}
            >
              <MapPin className="h-5 w-5 mr-2" />
              Destinos
            </button>
            
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Users className="h-5 w-5 mr-2" />
              Trabajadores
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;