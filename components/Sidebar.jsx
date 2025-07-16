import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  Users, 
  Settings, 
  BarChart3, 
  Archive, 
  MapPin, 
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', href: '/' },
    { id: 'desarquivamentos', icon: FileText, label: 'Desarquivamentos', href: '/desarquivamentos' },
    { id: 'vestigios', icon: Archive, label: 'Vestígios', href: '/vestigios' },
    { id: 'localizacoes', icon: MapPin, label: 'Localizações', href: '/localizacoes' },
    { id: 'usuarios', icon: Users, label: 'Usuários', href: '/usuarios' },
    { id: 'relatorios', icon: BarChart3, label: 'Relatórios', href: '/relatorios' },
    { id: 'notificacoes', icon: Bell, label: 'Notificações', href: '/notificacoes' },
    { id: 'configuracoes', icon: Settings, label: 'Configurações', href: '/configuracoes' },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
  };

  return (
    <div className={`
      relative bg-slate-700 text-white transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-64'}
      min-h-screen flex flex-col
    `}>
      {/* Header fixo */}
      <div className="h-14 bg-slate-700 border-b border-slate-600 flex items-center justify-between px-4 sticky top-0 z-10">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">SGC-ITEP</span>
          </div>
        )}
        
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-600 transition-colors duration-200 group"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <li key={item.id}>
                <div className="relative group">
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleItemClick(item.id);
                    }}
                    className={`
                      flex items-center px-3 py-3 rounded-lg transition-all duration-200
                      hover:bg-slate-600 hover:scale-105 active:scale-95
                      ${isActive ? 'bg-slate-600 shadow-lg' : ''}
                      ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}
                    `}
                  >
                    <Icon 
                      className={`
                        w-5 h-5 transition-all duration-200
                        ${isActive ? 'animate-pulse text-blue-400' : 'text-slate-300'}
                        group-hover:text-white
                      `} 
                    />
                    
                    {!isCollapsed && (
                      <span className={`
                        font-medium transition-colors duration-200
                        ${isActive ? 'text-blue-400' : 'text-slate-300'}
                        group-hover:text-white
                      `}>
                        {item.label}
                      </span>
                    )}
                  </a>
                  
                  {/* Tooltip para sidebar colapsada */}
                  {isCollapsed && (
                    <div className="
                      absolute left-full top-1/2 transform -translate-y-1/2 ml-2
                      bg-slate-800 text-white px-3 py-2 rounded-lg text-sm
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 whitespace-nowrap z-50
                      shadow-lg border border-slate-600
                    ">
                      {item.label}
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 
                                    w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-600">
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer com informações do usuário (quando expandida) */}
      {!isCollapsed && (
        <div className="border-t border-slate-600 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-slate-400 truncate">admin@itep.rn.gov.br</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;