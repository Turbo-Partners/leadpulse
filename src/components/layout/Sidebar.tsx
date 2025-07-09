import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserRole } from '../../hooks/useUserRole';
import { 
  Home, 
  Layers,
  Calendar,
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Calculator,
  MessageSquare,
  Map,
  Lock,
  CheckSquare,
  Users,
  Wrench
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  toggleCollapse: () => void;
}

const Sidebar = ({ isOpen, isCollapsed, toggleSidebar, toggleCollapse }: SidebarProps) => {
  const location = useLocation();
  const { logout } = useAuth();
  const { canAccessFeature } = useUserRole();
  const [toolsExpanded, setToolsExpanded] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isToolsActive = () => {
    const toolsPaths = ['/scrapping-map', '/cadences', '/whatsapp'];
    return toolsPaths.some(path => location.pathname === path);
  };

  // Auto-expand tools menu if we're on a tools page
  useEffect(() => {
    if (isToolsActive()) {
      setToolsExpanded(true);
    }
  }, [location.pathname]);
  const navigationItems = [
    { name: 'Painel', path: '/', icon: Home, blocked: false, feature: 'dashboard' },
    { name: 'Pipeline', path: '/pipeline', icon: Layers, blocked: false, feature: 'pipeline' },
    { name: 'Atividades', path: '/activities', icon: CheckSquare, blocked: false, feature: 'activities' },
    { name: 'Planejamento', path: '/planning', icon: Calculator, blocked: false, feature: 'planning' },
    { name: 'Comunidade', path: '/community', icon: Users, blocked: false, feature: 'community' },
    { name: 'Cursos', path: '/courses', icon: GraduationCap, blocked: true, feature: 'courses' },
    { name: 'Configurações', path: '/settings', icon: Settings, blocked: false, feature: 'settings' },
  ];

  const toolsItems = [
    { name: 'Scrapping Map', path: '/scrapping-map', icon: Map, blocked: false, feature: 'scrapping' },
    { name: 'Cadências', path: '/cadences', icon: Calendar, blocked: true, feature: 'cadences' },
    { name: 'WhatsApp', path: '/whatsapp', icon: MessageSquare, blocked: false, feature: 'whatsapp' },
  ];

  return (
    <div 
      className={`fixed inset-y-0 left-0 z-30 bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 border-r border-gray-200 dark:border-gray-700 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="h-full flex flex-col justify-between">
        <div>
          <div className={`px-6 pt-6 pb-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center text-white font-semibold">
                LP
              </div>
              {!isCollapsed && (
                <span className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">LeadPulse</span>
              )}
            </div>
            <button
              onClick={toggleCollapse}
              className="hidden md:block text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none"
            >
              {isCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>
          </div>

          <nav className="mt-6 px-3 space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const hasAccess = canAccessFeature(item.feature);
              const isBlocked = item.blocked || !hasAccess;
              
              return isBlocked ? (
                <div
                  key={item.name}
                  className="flex items-center px-2 py-3 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 cursor-not-allowed group"
                >
                  <IconComponent size={20} className="text-gray-400 dark:text-gray-500" />
                  {!isCollapsed && (
                    <>
                      <span className="ml-3">{item.name}</span>
                      <Lock size={14} className="ml-auto text-gray-400 dark:text-gray-500" />
                    </>
                  )}
                </div>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => toggleSidebar()}
                  className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md ${
                    isActive(item.path)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <IconComponent 
                    size={20} 
                    className={`${
                      isActive(item.path) ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`} 
                  />
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
            {/* Ferramentas Submenu */}
            <div>
              <button
                onClick={() => !isCollapsed && setToolsExpanded(!toolsExpanded)}
                className={`w-full group flex items-center px-2 py-3 text-sm font-medium rounded-md ${
                  isToolsActive()
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Wrench 
                  size={20} 
                  className={`${
                    isToolsActive() ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`} 
                />
                {!isCollapsed && (
                  <>
                    <span className="ml-3">Ferramentas</span>
                    <div className="ml-auto">
                      {toolsExpanded ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </>
                )}
              </button>

              {/* Submenu Items */}
              {!isCollapsed && toolsExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {toolsItems.map((item) => {
                    const IconComponent = item.icon;
                    const hasAccess = canAccessFeature(item.feature);
                    const isBlocked = item.blocked || !hasAccess;
                    
                    return isBlocked ? (
                      <div
                        key={item.name}
                        className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 cursor-not-allowed group"
                      >
                        <IconComponent size={18} className="text-gray-400 dark:text-gray-500" />
                        <span className="ml-3">{item.name}</span>
                        <Lock size={12} className="ml-auto text-gray-400 dark:text-gray-500" />
                      </div>
                    ) : (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => toggleSidebar()}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive(item.path)
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <IconComponent 
                          size={18} 
                          className={`${
                            isActive(item.path) ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                          }`} 
                        />
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
        </div>

        <div className={`px-3 py-4 border-t border-gray-200 dark:border-gray-700 ${isCollapsed ? 'text-center' : ''}`}>
          <button
            onClick={logout}
            className={`px-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} className="text-gray-500 dark:text-gray-400" />
            {!isCollapsed && <span className="ml-3">Sair</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;