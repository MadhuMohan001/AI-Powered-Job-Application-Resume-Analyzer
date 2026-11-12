import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/resumes/upload", label: "Upload Resume" },
  { to: "/resumes", label: "Resume Library", end: true },
  { to: "/jobs", label: "Job Descriptions" },
  { to: "/assistant", label: "AI Assistant" },
  { to: "/applications", label: "Application Tracker" },
  { to: "/history", label: "Analysis History" },
  { to: "/profile", label: "Profile Settings" },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen lg:flex">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
        <span className="font-semibold text-brand-700">ResumeIQ</span>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="sidebar"
                className="rounded-md px-3 py-1 text-sm ring-1 ring-slate-300">Menu</button>
      </header>

      <aside id="sidebar"
             className={`${open ? "block" : "hidden"} w-full shrink-0 border-r bg-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64`}>
        <div className="hidden px-6 py-5 text-xl font-bold text-brand-700 lg:block">ResumeIQ</div>
        <nav aria-label="Main" className="flex flex-col gap-1 px-3 pb-3">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
                     className={({ isActive }) =>
                       `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t px-6 py-4 text-sm">
          <p className="truncate font-medium text-slate-800">{user?.full_name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          <button onClick={handleLogout} className="mt-3 text-sm font-medium text-red-600 hover:underline">Log out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
  );
}
