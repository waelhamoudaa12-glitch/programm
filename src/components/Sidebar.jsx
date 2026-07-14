import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt, Activity, Package, CalendarDays } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Activity className="logo-icon" size={32} />
        <h2>Elhady Clinic</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} end>
          <LayoutDashboard size={20} />
          <span>الرئيسية</span>
        </NavLink>
        <NavLink to="/appointments" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <CalendarDays size={20} />
          <span>المواعيد</span>
        </NavLink>
        <NavLink to="/patients" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Users size={20} />
          <span>المرضى</span>
        </NavLink>
        <NavLink to="/financials" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Receipt size={20} />
          <span>المالية</span>
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Package size={20} />
          <span>المخزن</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div className="doctor-info">
          <div className="doctor-avatar">د.</div>
          <div className="doctor-details">
            <span className="doctor-name">د. أحمد</span>
            <span className="doctor-title">طبيب أسنان رئيسي</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
