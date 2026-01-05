import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon } from "./Icons";
import { MobileSearchBar } from "./SearchBar";
import { MobileNavLinks } from "./NavLinks";

export function MobileMenu({
  isOpen,
  setIsOpen,
  searchQuery,
  setSearchQuery,
  showSuggestions,
  setShowSuggestions,
  suggestions,
  onSearch,
  onSuggestionClick,
}) {
  return (
    <div className="flex items-center ml-auto lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:text-white hover:bg-white/10 h-10 w-10"
          >
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] sm:w-80 bg-zinc-950 border-zinc-800 px-4">
          <SheetHeader className="flex flex-row items-center justify-between pr-0">
            <SheetTitle className="text-white flex items-center gap-0">
              <img 
                src="/logo/shirayuki2.png" 
                alt="Shirayuki Logo" 
                className="h-12 w-auto object-contain" 
              />
              <img 
                src="/logo/text.png" 
                alt="Shirayuki" 
                className="h-10 w-auto object-contain" 
              />
            </SheetTitle>
          </SheetHeader>

          <MobileSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            suggestions={suggestions}
            onSearch={onSearch}
            onSuggestionClick={onSuggestionClick}
            onMenuClose={() => setIsOpen(false)}
          />

          <MobileNavLinks onClose={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
