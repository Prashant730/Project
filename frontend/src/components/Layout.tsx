import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText, LogOut, Menu, X, UserCog, BarChart2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { name: 'Dashboard', path: '/',          icon: <LayoutDashboard className="w-4 h-4" />, roles: ['ADMIN','SALES','WAREHOUSE','ACCOUNTS'] },
    { name: 'Customers', path: '/customers', icon: <Users className="w-4 h-4" />,           roles: ['ADMIN','SALES'] },
    { name: 'Inventory', path: '/inventory', icon: <Package className="w-4 h-4" />,          roles: ['ADMIN','WAREHOUSE'] },
    { name: 'Challans',  path: '/challans',  icon: <FileText className="w-4 h-4" />,         roles: ['ADMIN','SALES','WAREHOUSE','ACCOUNTS'] },
    { name: 'Reports',   path: '/reports',   icon: <BarChart2 className="w-4 h-4" />,        roles: ['ADMIN','ACCOUNTS'] },
    { name: 'Users',     path: '/users',     icon: <UserCog className="w-4 h-4" />,          roles: ['ADMIN'] },
  ].filter(i => user && i.roles.includes(user.role));


  const Sidebar = () => (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-ink)' }}>
      {/* Wordmark */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'color-mix(in srgb, var(--color-paper) 12%, transparent)' }}>
        <p className="text-sm font-semibold tracking-tight" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-paper)', letterSpacing: '-0.01em' }}>
          Mini ERP
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-paper) 12%, transparent)' }}>
        <div className="mb-3 px-2">
          <p className="text-xs font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-paper)', letterSpacing: '0.04em' }}>
            {user?.name}
          </p>
          <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-kraft)', letterSpacing: '0.06em', fontSize: '0.6rem', textTransform: 'uppercase' }}>
            {user?.role}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="nav-link w-full text-left"
          style={{ color: 'var(--color-kraft)' }}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-paper)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r" style={{ borderColor: 'var(--color-rule)' }}>
        <Sidebar />
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-rule)', background: 'var(--color-ink)' }}>
          <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-paper)' }}>Mini ERP</p>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: 'var(--color-paper)' }}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 top-[49px] z-30 animate-fade-in" style={{ background: 'var(--color-ink)' }}>
            <Sidebar />
          </div>
        )}

        <main className="flex-1 p-6 md:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
