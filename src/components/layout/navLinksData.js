import { Home } from "lucide-react";

// Store icon component references (not JSX elements) to avoid parsing issues in plain .js
export const NAV_LINKS = [
  { name: "Home", href: "/", icon: Home },
  { name: "Genres", href: "/genre" },
  { name: "Types", href: "/category" },
  { name: "Schedule", href: "/schedule" },
  { name: "A-Z List", href: "/az-list" },
  { name: "Studios", href: "/producer" },
];
