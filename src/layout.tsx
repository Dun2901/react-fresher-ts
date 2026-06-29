import { Outlet } from 'react-router-dom';
import AppHeader from './components/layout/app.header';
import MobileBottomNav from './components/layout/mobile.bottom.nav';
import Chatbot from './components/layout/chatbot';

function Layout() {
  return (
    <div className="client-layout">
      <AppHeader />

      <Outlet />

      <Chatbot />

      <MobileBottomNav />
    </div>
  );
}

export default Layout;
