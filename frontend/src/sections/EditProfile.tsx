import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, User as UserIcon, Mail } from "lucide-react";
import { gsap } from "gsap";

interface User {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar: string;
  level: number;
  gamesPlayed: number;
  gamesWon: number;
}

interface EditProfileProps {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

const AVATAR_OPTIONS = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Jack",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Precious",
];

const EditProfile: React.FC<EditProfileProps> = ({
  user,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    avatar: user.avatar || AVATAR_OPTIONS[0],
  });

  const [isUnsaved, setIsUnsaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseApi = "http://localhost:8000";

  useEffect(() => {
    const ctx = gsap.context(() => {
         gsap.fromTo(".animate-item", 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
        );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsUnsaved(true);
  };

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const updatedData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username,
      email: formData.email,
      avatar: formData.avatar,
    };

    try {
      const response = await fetch(`${baseApi}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();
      if (response.ok) {
        const updatedUser = {
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          username: data.user.username,
          email: data.user.email,
          avatar: data.user.avatar,
          level: data.user.stats.level || user.level,
          gamesPlayed: data.user.stats.gamesplayed || user.gamesPlayed,
          gamesWon: data.user.stats.gamesWon || user.gamesWon,
        };

        onSave(updatedUser);
        setIsUnsaved(false);
        
        // Success animation button
        gsap.to(event.currentTarget, {
            scale: 0.95,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
        });

      } else {
        alert(data.message || "Failed to Save profile");
      }
    } catch (error) {
      console.error("Update Error: ", error);
      alert("Something went wrong while updating profile");
    }
  };

  const handleCancel = () => {
    if (isUnsaved) {
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to leave?",
        )
      ) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto px-6 py-10 min-h-screen">
      {/* Background Orbs */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-[10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#D0BCFF] opacity-20 blur-[100px]" />
            <div className="absolute bottom-[10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#EFB8C8] opacity-20 blur-[80px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-item">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-[#49454F] hover:text-[#6750A4] transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
             <ArrowLeft size={20} />
          </div>
          <span className="font-bold text-lg">Back</span>
        </button>
        
        {isUnsaved && (
          <div className="flex items-center gap-3 px-4 py-2 bg-[#FFD8E4] rounded-full animate-item">
            <span className="text-sm font-bold text-[#31111D]">Unsaved Changes</span>
            <div className="w-2 h-2 bg-[#B3261E] rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-[32px] shadow-sm border border-[#CAC4D0] overflow-hidden animate-item">
        
        {/* Banner with Avatar Chooser */}
        <div className="bg-[#6750A4] h-48 relative">
             <div className="absolute inset-0 bg-gradient-to-r from-[#6750A4] to-[#7D5260] opacity-80" />
             <div className="absolute -bottom-12 left-0 right-0 px-8 flex justify-center">
                  <div className="bg-white rounded-[24px] p-2 shadow-xl flex gap-4 overflow-x-auto max-w-full z-10">
                       {AVATAR_OPTIONS.map((avatarUrl, index) => (
                           <button
                                key={index}
                                onClick={() => handleInputChange("avatar", avatarUrl)}
                                className={`relative w-20 h-20 rounded-[20px] overflow-hidden transition-all duration-300 flex-shrink-0 ${
                                    formData.avatar === avatarUrl 
                                    ? "ring-4 ring-[#6750A4] scale-110 z-10" 
                                    : "opacity-70 hover:opacity-100 hover:scale-105"
                                }`}
                           >
                               <img 
                                    src={avatarUrl} 
                                    alt={`Avatar ${index + 1}`} 
                                    className="w-full h-full object-cover bg-[#EADDFF]"
                               />
                               {formData.avatar === avatarUrl && (
                                   <div className="absolute inset-0 bg-[#6750A4]/20 flex items-center justify-center">
                                       <div className="bg-white rounded-full p-1">
                                           <div className="w-2 h-2 bg-[#6750A4] rounded-full" />
                                       </div>
                                   </div>
                               )}
                           </button>
                       ))}
                  </div>
             </div>
        </div>

        <div className="pt-20 pb-10 px-8 lg:px-16">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-[#1C1B1F]">{formData.username || "User"}</h1>
                <p className="text-[#49454F]">Choose your avatar and update details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <InputField 
                    label="Username"
                    value={formData.username}
                    onChange={(v: string) => handleInputChange("username", v)}
                    icon={<UserIcon size={18} />}
                />
                <InputField 
                    label="Email Address"
                    value={formData.email}
                    onChange={(v: string) => handleInputChange("email", v)}
                    icon={<Mail size={18} />}
                    type="email"
                />
                <InputField 
                    label="First Name"
                    value={formData.firstName}
                    onChange={(v: string) => handleInputChange("firstName", v)}
                />
                <InputField 
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(v: string) => handleInputChange("lastName", v)}
                />
            </div>

            <h3 className="text-lg font-bold text-[#1C1B1F] mb-6 border-b border-[#E7E0EC] pb-2">Your Stats</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                <StatBox label="Level" value={user.level} color="bg-[#EADDFF]" textColor="text-[#21005D]" />
                <StatBox label="Games Played" value={user.gamesPlayed} color="bg-[#E8DEF8]" textColor="text-[#1D192B]" />
                <StatBox label="Games Won" value={user.gamesWon} color="bg-[#FFD8E4]" textColor="text-[#31111D]" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[#E7E0EC]">
                <button
                    onClick={handleCancel}
                    className="flex-1 px-8 py-4 rounded-full border border-[#79747E] text-[#6750A4] font-bold text-lg hover:bg-[#F3EDF7] transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={!isUnsaved}
                    className="flex-1 px-8 py-4 rounded-full bg-[#6750A4] text-white font-bold text-lg hover:bg-[#523E8E] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Save size={20} />
                    <span>Save Changes</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange, icon, type = "text" }: any) => (
    <div className="group">
        <label className="block text-xs font-bold text-[#6750A4] mb-1 pl-4 uppercase tracking-wider">{label}</label>
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-[#F3EDF7] border-0 rounded-full pl-6 pr-6 py-4 font-medium text-[#1C1B1F] placeholder:text-[#49454F]/50 outline-none focus:ring-2 focus:ring-[#6750A4] transition-all"
                placeholder={`Enter ${label}`}
            />
            {icon && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#49454F]">
                    {icon}
                </div>
            )}
        </div>
    </div>
);

const StatBox = ({ label, value, color, textColor }: any) => (
    <div className={`${color} p-6 rounded-[24px] text-center transition-transform hover:scale-105`}>
        <p className={`text-4xl font-bold ${textColor} mb-1`}>{value}</p>
        <p className={`text-sm font-medium ${textColor} opacity-80 uppercase tracking-widest`}>{label}</p>
    </div>
);

export default EditProfile;
