import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export const NAV_LINKS = [
  { name: "Home", href: "/", icon: <Home size={22} /> },
  { name: "Genres", href: "/genre" },
  { name: "Types", href: "/category" },
  { name: "Schedule", href: "/schedule" },
  { name: "A-Z List", href: "/az-list" },
  { name: "Studios", href: "/producer" },
];

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
            {link.icon ? link.icon : null}
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