import { Outlet } from 'react-router-dom';
import AppHeader from './components/layout/app.header';
import MobileBottomNav from './components/layout/mobile.bottom.nav';

function Layout() {
  return (
    <div className="client-layout">
      <AppHeader />

      <Outlet />

      <MobileBottomNav />
    </div>
  );
}

export default Layout;
