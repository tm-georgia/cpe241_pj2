import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export function Header() {
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);

  const getBreadcrumbsElements = () => {
    if (pathParts.length === 0) {
      return <span className="font-medium text-slate-900">Customers</span>;
    }
    return pathParts.map((part, index) => {
      const step = part.replace("-", " ");
      const label = step.charAt(0).toUpperCase() + step.slice(1);
      const isLast = index === pathParts.length - 1;

      if (isLast) {
        return (
          <span key={index} className="font-medium text-slate-900">
            {label}
          </span>
        );
      }

      return (
        <React.Fragment key={index}>
          <span className="hover:text-blue-600 cursor-pointer transition-colors">
            {label}
          </span>
          <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </React.Fragment>
      );
    });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
      <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <Link to="/customers" className="hover:text-blue-600 cursor-pointer transition-colors">
          Home
        </Link>
        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        {getBreadcrumbsElements()}
      </div>
    </header>
  );
}

export default Header;
