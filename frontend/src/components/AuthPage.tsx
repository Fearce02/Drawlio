import React, { useState, useEffect, useRef } from "react";
import {
  Palette,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  TowerControl as GameController2,
  Sparkles,
  Users,
  Play,
  Brush,
  PenTool,
  Plus,
  Hash,
  ArrowRight,
} from "lucide-react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

interface GuestData {
  username: string;
  roomCode: string;
}

const baseAPI = "http://localhost:8000";

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [guestData, setGuestData] = useState<GuestData>({
    username: "",
    roomCode: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [guestErrors, setGuestErrors] = useState<Partial<GuestData>>({});

  const navigate = useNavigate();

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const leftSideRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background gradient animation
      gsap.to(".bg-orb", {
        y: -20,
        x: 10,
        rotation: 360,
        duration: 20,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 2,
      });

      // Entrance Animations
      const tl = gsap.timeline();
      tl.fromTo(
        leftSideRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 1, ease: "power3.out" }
      )
        .fromTo(
          cardRef.current,
          { opacity: 0, x: 30, scale: 0.95 },
          { opacity: 1, x: 0, scale: 1, duration: 1, ease: "power3.out" },
          "-=0.8"
        )
        .fromTo(
          ".animate-child",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.5)" },
          "-=0.5"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (showGuestModal && modalRef.current && modalContentRef.current) {
      gsap.set(modalRef.current, { opacity: 0 });
      gsap.set(modalContentRef.current, { scale: 0.9, opacity: 0, y: 20 });

      const tl = gsap.timeline();
      tl.to(modalRef.current, { opacity: 1, duration: 0.3 })
        .to(
        modalContentRef.current,
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.2)" },
        "-=0.2"
      );
    }
  }, [showGuestModal]);

  useEffect(() => {
    // Redirect logic
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    const guestUsername = localStorage.getItem("guestUsername");
    if (token && userRaw && !guestUsername) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleGuestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGuestData((prev) => ({ ...prev, [name]: value }));
    if (guestErrors[name as keyof GuestData]) {
      setGuestErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    if (isSignUp) {
      if (!formData.firstName.trim()) newErrors.firstName = "Required";
      if (!formData.lastName.trim()) newErrors.lastName = "Required";
      if (!formData.username.trim()) newErrors.username = "Required";
      if (formData.username.length < 3) newErrors.username = "Min 3 chars";
    }
    if (!formData.email.trim()) newErrors.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
    
    if (!formData.password.trim()) newErrors.password = "Required";
    else if (formData.password.length < 8) newErrors.password = "Min 8 chars";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateGuestForm = () => {
    const newErrors: Partial<GuestData> = {};
    if (!guestData.username.trim()) newErrors.username = "Required";
    else if (guestData.username.length < 3) newErrors.username = "Min 3 chars";
    setGuestErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const endpoint = isSignUp ? "/sign-up" : "/sign-in";
    const url = `${baseAPI}/api/auth${endpoint}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        // Simple error mapping
         setErrors((prev) => ({
          ...prev,
          email: data.message?.toLowerCase().includes("email") ? data.message : undefined,
          username: data.message?.toLowerCase().includes("username") ? data.message : undefined,
          password: data.message?.toLowerCase().includes("password") ? data.message : undefined,
        }));
        if (!data.message?.toLowerCase().includes("email") && 
            !data.message?.toLowerCase().includes("username") && 
            !data.message?.toLowerCase().includes("password")) {
              alert(data.message || "Authentication failed");
        }
        return;
      }

      if (isSignUp) {
        setIsSignUp(false);
        // Reset form but keep email maybe?
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Auth Error", error);
      alert("Connection error. Please try again.");
    }
  };

  const handleGuestLogin = () => setShowGuestModal(true);

  const handleCreateRoom = () => {
    if (validateGuestForm()) {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem("guestUsername", guestData.username);
      localStorage.setItem("roomCode", roomCode);
      navigate("/guest-lobby");
      setShowGuestModal(false);
    }
  };

  const handleJoinRoom = () => {
    if (validateGuestForm()) {
      if (!guestData.roomCode.trim()) {
        setGuestErrors((prev) => ({ ...prev, roomCode: "Required" }));
        return;
      }
      localStorage.setItem("guestUsername", guestData.username);
      localStorage.setItem("roomCode", guestData.roomCode.trim().toUpperCase());
      navigate("/guest-lobby");
      setShowGuestModal(false);
    }
  };

  const closeGuestModal = () => {
    if (modalContentRef.current && modalRef.current) {
      gsap.to(modalContentRef.current, {
        scale: 0.9,
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.in",
      });
      gsap.to(modalRef.current, {
        opacity: 0,
        duration: 0.3,
        delay: 0.1,
        onComplete: () => setShowGuestModal(false),
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#FDF8FC]"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         {/* M3 Primary Color Orb */}
        <div className="bg-orb absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#D0BCFF] opacity-20 blur-[100px]" />
         {/* M3 Tertiary Color Orb */}
        <div className="bg-orb absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#EFB8C8] opacity-20 blur-[80px]" />
        {/* M3 Secondary Color Orb */}
        <div className="bg-orb absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-[#CCC2DC] opacity-20 blur-[60px]" />
      </div>

      <div className="relative w-full max-w-[1200px] flex gap-8 lg:gap-20 items-stretch z-10">
        
        {/* Left Side - Hero / Illustration */}
        <div ref={leftSideRef} className="hidden lg:flex flex-1 flex-col justify-center text-[#1C1B1F]">
            <div className="mb-12">
                 <h1 className="text-display-large font-bold text-6xl mb-4 tracking-tight text-[#6750A4]">
                    Drawlio.
                 </h1>
                 <p className="text-3xl font-medium text-[#49454F] leading-tight">
                    Where creativity meets <br/> chaos, instantly.
                 </p>
            </div>

            <div className="relative h-[400px] w-full bg-[#F3EDF7] rounded-[32px] overflow-hidden shadow-sm border border-[#E7E0EC] flex items-center justify-center p-8 group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                
                {/* Floating Icons */}
                <div className="absolute top-10 left-10 p-4 bg-white rounded-2xl shadow-md rotate-[-6deg] group-hover:rotate-[-12deg] transition-transform duration-500">
                    <Palette className="w-8 h-8 text-[#6750A4]" />
                </div>
                <div className="absolute bottom-12 right-12 p-4 bg-[#6750A4] rounded-2xl shadow-md rotate-[6deg] group-hover:rotate-[12deg] transition-transform duration-500">
                     <Brush className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md rounded-full px-8 py-4 shadow-lg border border-white">
                     <span className="text-[#6750A4] font-bold text-xl tracking-wide">It's... a Pineapple?</span>
                </div>
            </div>

            <div className="mt-8 flex gap-6">
                <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-[#EADDFF] flex items-center justify-center text-lg">🚀</div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-[#D0BCFF] flex items-center justify-center text-lg">🎮</div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-[#6750A4] flex items-center justify-center text-xs font-bold text-white">Play</div>
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-sm font-bold text-[#1C1B1F]">Beta Access</span>
                    <span className="text-xs text-[#49454F]">Instant multiplayer games</span>
                </div>
            </div>
        </div>

        {/* Right Side - Auth Card */}
        <div ref={cardRef} className="flex-1 flex items-center justify-center">
           <div className="w-full max-w-[480px] bg-white rounded-[32px] p-8 md:p-10 shadow-xl shadow-[#6750A4]/5 border border-[#E7E0EC] flex flex-col items-center">
              
              {/* Tab Switcher */}
              <div className="w-full bg-[#F3EDF7] p-1 rounded-full flex mb-8">
                  <button onClick={() => setIsSignUp(true)} className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all duration-300 ${isSignUp ? "bg-white text-[#1D192B] shadow-sm" : "text-[#49454F] hover:bg-[#E7E0EC]/50"}`}>
                      Display Name & New Account
                  </button>
                  <button onClick={() => setIsSignUp(false)} className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all duration-300 ${!isSignUp ? "bg-white text-[#1D192B] shadow-sm" : "text-[#49454F] hover:bg-[#E7E0EC]/50"}`}>
                      Login
                  </button>
              </div>

              <div className="w-full mb-6 text-center">
                  <h2 className="text-2xl font-semibold text-[#1C1B1F] mb-2 animate-child">
                      {isSignUp ? "Create your account" : "Welcome back"}
                  </h2>
                  <p className="text-[#49454F] text-sm animate-child">
                      {isSignUp ? "Join the fun and save your progress" : "Enter your details to sign in"}
                  </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                  {isSignUp && (
                      <div className="flex gap-4 animate-child">
                          <InputField 
                             name="firstName" 
                             label="First Name" 
                             value={formData.firstName} 
                             onChange={handleInputChange} 
                             error={errors.firstName} 
                             icon={<User size={18} />}
                             half
                          />
                           <InputField 
                             name="lastName" 
                             label="Last Name" 
                             value={formData.lastName} 
                             onChange={handleInputChange} 
                             error={errors.lastName} 
                             half
                          />
                      </div>
                  )}

                  {isSignUp && (
                      <div className="animate-child">
                        <InputField 
                            name="username" 
                            label="Username" 
                            value={formData.username} 
                            onChange={handleInputChange} 
                            error={errors.username} 
                            icon={<GameController2 size={18} />}
                        />
                      </div>
                  )}

                  <div className="animate-child">
                    <InputField 
                        name="email" 
                        label="Email Address" 
                        type="email"
                        value={formData.email} 
                        onChange={handleInputChange} 
                        error={errors.email} 
                        icon={<Mail size={18} />}
                    />
                  </div>

                  <div className="animate-child">
                    <InputField 
                        name="password" 
                        label="Password" 
                        type="password"
                        value={formData.password} 
                        onChange={handleInputChange} 
                        error={errors.password} 
                        showPasswordToggle
                        icon={<Lock size={18} />}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="animate-child w-full bg-[#6750A4] hover:bg-[#523E8E] text-white font-medium py-4 rounded-full mt-6 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2"
                  >
                     <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                     <ArrowRight size={20} />
                  </button>
              </form>

              <div className="relative w-full my-8 animate-child">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E7E0EC]"></div></div>
                  <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-[#49454F] uppercase tracking-wider">Or</span></div>
              </div>

              <div className="w-full animate-child">
                  <button onClick={handleGuestLogin} className="w-full bg-[#EADDFF] hover:bg-[#D0BCFF] text-[#21005D] font-medium py-4 rounded-full transition-colors flex items-center justify-center gap-2 group">
                      <Sparkles size={18} className="group-hover:rotate-12 transition-transform"/>
                      <span>Quick Play as Guest</span>
                  </button>
              </div>

           </div>
        </div>
      </div>

       {/* Guest Modal */}
       {showGuestModal && (
        <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#1C1B1F]/40 backdrop-blur-sm" onClick={closeGuestModal}>
            <div ref={modalContentRef} className="bg-[#F3EDF7] rounded-[32px] p-8 shadow-2xl w-full max-w-md border border-white/20" onClick={e => e.stopPropagation()}>
                <div className="text-center mb-8">
                     <div className="w-16 h-16 bg-[#E8DEF8] text-[#1D192B] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        👻
                     </div>
                     <h3 className="text-2xl font-bold text-[#1C1B1F] mb-2">Guest Access</h3>
                     <p className="text-[#49454F] text-sm">Jump into a game without an account</p>
                </div>

                <div className="space-y-4">
                     <InputField 
                         name="username" 
                         label="Guest Username" 
                         value={guestData.username} 
                         onChange={handleGuestInputChange} 
                         error={guestErrors.username}
                         bg="white"
                     />
                     <InputField 
                         name="roomCode" 
                         label="Room Code (Optional)" 
                         value={guestData.roomCode} 
                         onChange={handleGuestInputChange} 
                         error={guestErrors.roomCode}
                         bg="white"
                     />
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={handleJoinRoom} className="flex-1 bg-[#6750A4] text-white py-3 rounded-full font-medium hover:bg-[#523E8E] transition-colors">Join</button>
                    <button onClick={handleCreateRoom} className="flex-1 bg-[#21005D] text-white py-3 rounded-full font-medium hover:bg-[#32008E] transition-colors">Create</button>
                </div>
            </div>
        </div>
       )}
    </div>
  );
};

// Reusable Input Component for that Material 3 Look
interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  icon?: React.ReactNode;
  half?: boolean;
  showPasswordToggle?: boolean;
  bg?: string;
}

const InputField: React.FC<InputFieldProps> = ({ 
    label, name, type = "text", value, onChange, error, icon, half, showPasswordToggle, bg = "bg-[#F3EDF7]" 
}) => {
    const [showPass, setShowPass] = useState(false);
    const [focused, setFocused] = useState(false);

    const inputType = type === "password" ? (showPass ? "text" : "password") : type;

    return (
        <div className={`${half ? "w-full" : "w-full"}`}>
            <div className={`
                relative flex items-center px-4 py-3 rounded-2xl border-2 transition-all duration-200
                ${error ? "border-[#B3261E] bg-[#FFF9F9]" : 
                  focused ? "border-[#6750A4] bg-white" : 
                  `border-transparent ${bg === 'white' ? 'bg-white' : 'bg-[#F3EDF7]'}`
                }
            `}>
                {icon && <div className={`mr-3 ${focused ? "text-[#6750A4]" : "text-[#49454F]"}`}>{icon}</div>}
                
                <div className="flex-1 relative">
                     {/* Floating Label Logic */}
                    <label className={`
                        absolute left-0 transition-all duration-200 pointer-events-none
                        ${focused || value ? "top-0 text-[10px] font-bold text-[#6750A4]" : "top-1/2 -translate-y-1/2 text-[#49454F]"}
                    `}>
                        {focused || value ? label : label}
                    </label>

                    <input
                        type={inputType}
                        name={name}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className={`w-full bg-transparent outline-none text-[#1C1B1F] placeholder-transparent ${focused || value ? "pt-3 pb-0" : ""}`}
                        placeholder={label} // Needed for layout but hidden by transparent placeholder
                    />
                </div>

                {showPasswordToggle && (
                    <button type="button" onClick={() => setShowPass(!showPass)} className="ml-2 text-[#49454F] hover:text-[#1C1B1F]">
                        {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                )}
            </div>
            {error && <p className="text-[#B3261E] text-xs mt-1 ml-2">{error}</p>}
        </div>
    );
};

export default AuthPage;
