import React from "react";
import { Link } from "react-router-dom";
import { NAV_LINKS } from "../navLinksData";

// Desktop Navigation Links
export function NavLinks() {
  return (
    <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.name}
          to={link.href}
          className="group text-sm font-medium text-white hover:text-white transition-colors uppercase tracking-wide"
        >
          <span className="relative inline-flex items-center gap-2">
            {link.icon ? React.createElement(link.icon, { size: 22, className: "h-5 w-5" }) : null}
            <span>{link.name}</span>
            <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-blue-200 transform scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
          </span>
        </Link>
      ))}
    </div>
  );
}

// Mobile Navigation Links
export function MobileNavLinks({ onClose }) {
  return (
    <div className="mt-6 flex flex-col gap-2">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.name}
          to={link.href}
          onClick={onClose}
          className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors uppercase tracking-wide font-medium"
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
}