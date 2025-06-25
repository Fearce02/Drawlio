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

  //   useEffect(() => {
  //     // Initial animations
  //     if (navRef.current) {
  //       gsap.fromTo(
  //         navRef.current,
  //         { y: -100, opacity: 0 },
  //         { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
  //       );
  //     }

  //     if (logoRef.current) {
  //       slideInFromLeft(logoRef.current, 0.2);
  //     }

  //     if (profileRef.current) {
  //       fadeInScale(profileRef.current, 0.4);
  //     }
  //   }, []);

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
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            ref={logoRef}
            className="flex items-center space-x-3 cursor-pointer"
            onMouseEnter={handleLogoHover}
          >
            <div className="w-12 h-12 bg-[#ef476f] rounded-full flex items-center justify-center transition-all duration-300 hover:shadow-lg">
              <Palette className="logo-icon w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#073b4c] transition-colors duration-300 hover:text-[#ef476f]">
              SkribblePlay
            </h1>
          </div>

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              ref={profileRef}
              onClick={handleDropdownToggle}
              className="flex items-center space-x-3 px-4 py-2 rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, { scale: 1, duration: 0.2 });
              }}
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover transition-all duration-300 hover:ring-2 hover:ring-[#ef476f]/30"
                />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ffd166] text-[#073b4c] text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                  {user.level}
                </div>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-[#073b4c]">
                  {user.name}
                </p>
                <p className="text-xs text-gray-600">Level {user.level}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-xl border-0 py-4 z-50"
              >
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center space-x-4">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-[#073b4c] text-lg">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center mt-2">
                        <div className="w-3 h-3 bg-[#06d6a0] rounded-full mr-2 animate-pulse"></div>
                        <span className="text-xs text-gray-600 font-medium">
                          Online
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onEditProfile();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-6 py-4 text-left flex items-center space-x-4 hover:bg-gray-50 transition-all duration-300 transform hover:translate-x-1"
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget.querySelector(".menu-icon"), {
                      rotation: 360,
                      duration: 0.5,
                    });
                  }}
                >
                  <div className="w-10 h-10 bg-[#118ab2] rounded-full flex items-center justify-center">
                    <Settings className="menu-icon w-5 h-5 text-white" />
                  </div>
                  <span className="text-[#073b4c] font-medium">
                    Edit Profile
                  </span>
                </button>

                <button
                  onClick={() => {
                    onSignOut();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-6 py-4 text-left flex items-center space-x-4 hover:bg-red-50 transition-all duration-300 transform hover:translate-x-1"
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget.querySelector(".logout-icon"), {
                      x: 5,
                      duration: 0.3,
                    });
                  }}
                  onMouseLeave={(e) => {
                    gsap.to(e.currentTarget.querySelector(".logout-icon"), {
                      x: 0,
                      duration: 0.3,
                    });
                  }}
                >
                  <div className="w-10 h-10 bg-[#ef476f] rounded-full flex items-center justify-center">
                    <LogOut className="logout-icon w-5 h-5 text-white" />
                  </div>
                  <span className="text-[#ef476f] font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
