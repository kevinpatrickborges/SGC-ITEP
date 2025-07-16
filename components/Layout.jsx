import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header da página principal */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              Sistema de Gestão Documental
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </header>
        
        {/* Conteúdo da página */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;