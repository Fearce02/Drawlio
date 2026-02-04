import React, { useState, useRef, useEffect } from "react";
import { Palette, Settings, LogOut, ChevronDown } from "lucide-react";
import { gsap } from "gsap";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    level: number;
  };
  onSignOut: () => void;
  onEditProfile: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onSignOut, onEditProfile }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);

    if (!isDropdownOpen && dropdownRef.current) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, scale: 0.95, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.7)" },
      );
    }
  };

  const handleLogoHover = () => {
    if (logoRef.current) {
      gsap.to(logoRef.current.querySelector(".logo-icon"), {
        rotation: 360,
        duration: 0.6,
        ease: "power2.out",
      });
    }
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-[#FDF8FC]/80 backdrop-blur-md border-b border-[#E7E0EC]"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div
            ref={logoRef}
            className="flex items-center space-x-3 cursor-pointer group"
            onMouseEnter={handleLogoHover}
          >
            <div className="w-10 h-10 bg-[#6750A4] rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(103,80,164,0.4)]">
              <Palette className="logo-icon w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1C1B1F] tracking-tight group-hover:text-[#6750A4] transition-colors">
              Drawlio
            </h1>
          </div>

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              ref={profileRef}
              onClick={handleDropdownToggle}
              className={`flex items-center gap-3 px-2 py-2 pr-4 rounded-full transition-all duration-200 border border-transparent
                  ${isDropdownOpen ? "bg-[#EADDFF] border-[#D0BCFF]" : "hover:bg-[#F3EDF7]"}
              `}
            >
               <div className="relative">
                 <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                  />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#6750A4] text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-white">
                    {user.level}
                  </div>
               </div>
              
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-[#1C1B1F] leading-tight">
                  {user.name}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#49454F] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-[#FDF8FC] rounded-[24px] shadow-xl border border-[#E7E0EC] py-3 z-50 overflow-hidden"
              >
                {/* User Info Header */}
                 <div className="px-6 py-4 border-b border-[#E7E0EC] bg-[#F3EDF7]/50">
                    <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#6750A4] to-[#EADDFF]"> 
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover border-2 border-white"/>
                         </div>
                         <div>
                             <p className="font-bold text-[#1C1B1F]">{user.name}</p>
                             <p className="text-xs text-[#49454F] truncate max-w-[140px]">{user.email}</p>
                             <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-[#E6F4EA] border border-[#C3EED0]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0D652D] animate-pulse"/>
                                <span className="text-[10px] font-bold text-[#0D652D]">Online</span>
                             </div>
                         </div>
                    </div>
                 </div>

                <div className="p-2">
                    <button
                        onClick={() => {
                            onEditProfile();
                            setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 rounded-full hover:bg-[#EADDFF]/50 transition-colors group"
                    >
                        <div className="w-10 h-10 bg-[#EADDFF] rounded-full flex items-center justify-center text-[#21005D] group-hover:bg-[#21005D] group-hover:text-white transition-colors">
                            <Settings size={20} />
                        </div>
                        <span className="text-[#1C1B1F] font-medium group-hover:text-[#21005D] transition-colors">
                            Edit Profile
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            onSignOut();
                            setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 rounded-full hover:bg-[#FFD8E4]/50 transition-colors group mt-1"
                    >
                        <div className="w-10 h-10 bg-[#FFD8E4] rounded-full flex items-center justify-center text-[#31111D] group-hover:bg-[#B3261E] group-hover:text-white transition-colors">
                            <LogOut size={20} />
                        </div>
                        <span className="text-[#1C1B1F] font-medium group-hover:text-[#B3261E] transition-colors">
                            Sign Out
                        </span>
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
