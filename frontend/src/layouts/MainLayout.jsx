import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';

export const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen ambient-mesh-canvas relative flex selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Animated Ambient Light Orbs */}
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-indigo-300/30 to-violet-300/20 rounded-full blur-3xl pointer-events-none z-0 animate-pulse duration-1000" />
      <div className="fixed top-1/3 -left-40 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-300/25 to-blue-300/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-40 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-pink-200/25 via-purple-200/20 to-indigo-200/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed inset-0 dot-matrix pointer-events-none opacity-40 z-0" />

      {/* Navigation Sidebar */}
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 relative z-10">
        <Navbar onOpenMobile={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
