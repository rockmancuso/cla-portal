  import { useState } from "react";
  import { Menu, X } from "lucide-react";
  import { Button } from "@/components/ui/button";

  interface NavigationItem {
    label: string;
    href: string;
  }

  const navigationItems: NavigationItem[] = [
    { label: "My Profile", href: "https://member.laundryassociation.org/profile?hsLang=en" },
    { label: "Update Profile", href: "https://member.laundryassociation.org/update-profile?hsLang=en" },
    { label: "Store", href: "https://member.laundryassociation.org/store?hsLang=en" },
    { label: "Resources", href: "https://member.laundryassociation.org/member-resources?hsLang=en" },
    { label: "CLAdvantage Rewards", href: "https://member.laundryassociation.org/cladvantage-rewards-program" },
    { label: "CLA Business Solutions", href: "https://laundryassociation.org/membership/cla-business-solutions/" },
  ];

  export default function NavigationMenu() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto">
          <div className="flex items-center justify-center lg:justify-between h-12 bg-[#1e4dd4]">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center divide-x divide-gray-400 flex-1 justify-center flex-row  px-4 sm:px-6 lg:px-8">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="uppercase tracking-normal lg:tracking-widest text-center lg:text-sm sm:text-xs font-medium text-white hover:text-white hover:bg-[#78c021] transition-all duration-200"
                  target="_self"
                >
                  <div className="px-6 py-2">{item.label}</div>
                </a>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center text-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center space-x-2 bg-[#78c021] text-white px-3 py-1"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="text-sm font-bold tracking-wide">MEMBER CONTENT MENU</span>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-2">
              <div className="flex flex-col space-y-1">
                {navigationItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block px-4 py-2 text-sm font-medium text-gray-700 hover:text-white hover:bg-[#78c021] rounded transition-colors duration-200"
                    target="_self"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }