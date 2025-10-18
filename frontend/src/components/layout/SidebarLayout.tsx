import { ReactNode, useState, useEffect } from 'react';
import Header from './Header.tsx';
import Footer from './Footer.tsx';
import Sidebar from './Sidebar.tsx';
import BottomNav from './BottomNav.tsx';
import { useAuthStore } from '@/store/auth.store';

interface SidebarLayoutProps {
  children: ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { isAuthenticated } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.isCollapsed);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
  }, []);

  const getMainMargin = () => {
    if (!isAuthenticated) return '';
    return sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64';
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {isAuthenticated && <Sidebar />}
      <main className={`flex-1 transition-all duration-300 ${getMainMargin()} ${isAuthenticated ? 'pb-20 lg:pb-0' : ''}`}>
        {children}
      </main>
      <Footer className={isAuthenticated ? 'mb-16 lg:mb-0' : ''} />
      {isAuthenticated && <BottomNav />}
    </div>
  );
}

