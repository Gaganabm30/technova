import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { GlobalSearchModal } from './GlobalSearchModal';
import { TaskModal } from '../tasks/TaskModal';
import { ToastContainer } from '../common/Toast';
import { useNotifications } from '../../context/NotificationContext';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const { showToast } = useNotifications();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Global Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopBar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenCreateTask={() => setCreateTaskOpen(true)}
        />

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Search Palette */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Quick Task Creation Modal */}
      <TaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onSuccess={() => {
          showToast('Task added to workflow board', 'success');
          // Dispatches custom event so active pages refresh if needed
          window.dispatchEvent(new CustomEvent('workflow:task-created'));
        }}
      />
    </div>
  );
};
