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
} from "lucide-react";
import { gsap } from "gsap";
import GoogleIcon from "./GoogleIcon";
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
  const backgroundRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial page load animations
      gsap.set([leftSideRef.current, cardRef.current], { opacity: 0, y: 50 });
      gsap.set(backgroundRef.current?.children || [], { scale: 0, opacity: 0 });

      // Animate background elements
      gsap.to(backgroundRef.current?.children || [], {
        scale: 1,
        opacity: 1,
        duration: 2,
        stagger: 0.3,
        ease: "back.out(1.7)",
      });

      // Animate main content
      gsap.to(leftSideRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.3,
        ease: "power3.out",
      });

      gsap.to(cardRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.5,
        ease: "power3.out",
      });

      // Floating animation for drawing elements
      gsap.to(".floating-element", {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        stagger: 0.5,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (showGuestModal && modalRef.current && modalContentRef.current) {
      gsap.set(modalRef.current, { opacity: 0 });
      gsap.set(modalContentRef.current, { scale: 0.8, opacity: 0 });

      gsap.to(modalRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(modalContentRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        delay: 0.1,
        ease: "back.out(1.7)",
      });
    }
  }, [showGuestModal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleGuestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGuestData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (guestErrors[name as keyof GuestData]) {
      setGuestErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (isSignUp) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required";
      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";
      if (!formData.username.trim())
        newErrors.username = "Username is required";
      if (formData.username.length < 3)
        newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (!formData.password.trim()) newErrors.password = "Password is required";
    if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateGuestForm = () => {
    const newErrors: Partial<GuestData> = {};

    if (!guestData.username.trim()) newErrors.username = "Username is required";
    if (guestData.username.length < 3)
      newErrors.username = "Username must be at least 3 characters";

    setGuestErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = validateForm();
    if (!valid) return;

    const endpoint = isSignUp ? "/sign-up" : "/sign-in";
    const url = `${baseAPI}/api/auth${endpoint}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors((prev) => ({
          ...prev,
          email: data.message.toLowerCase().includes("email")
            ? data.message
            : undefined,
          username: data.message.toLowerCase().includes("username")
            ? data.message
            : undefined,
          password: data.message.toLowerCase().includes("password")
            ? data.message
            : undefined,
        }));
        return;
      }
      // gsap.to(e.currentTarget.querySelector('button[type="submit"]'), {
      //   scale: 0.95,
      //   duration: 0.1,
      //   yoyo: true,
      //   repeat: 1,
      // });
      if (isSignUp) {
        console.log("User created!", data.message);
        setIsSignUp(false);
      } else {
        console.log("Signed in:", data);
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("user", JSON.stringify(data.user));

        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Signup Error", error);
      alert("Something went wrong. Please Try again.");
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Google sign in clicked");
  };

  const handleGuestLogin = () => {
    setShowGuestModal(true);
  };

  const handleCreateRoom = () => {
    if (validateGuestForm()) {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem("guestUsername", guestData.username);
      localStorage.setItem("roomCode", roomCode);
      console.log("Creating room:", { username: guestData.username, roomCode });
      navigate("/guest-lobby");
      // Navigate to game with new room
      setShowGuestModal(false);
    }
  };

  const handleJoinRoom = () => {
    if (validateGuestForm()) {
      if (!guestData.roomCode.trim()) {
        setGuestErrors((prev) => ({
          ...prev,
          roomCode: "Room code is required",
        }));
        return;
      }
      localStorage.setItem("guestUsername", guestData.username);
      localStorage.setItem("roomCode", guestData.roomCode.trim().toUpperCase());
      console.log("Joining room:", guestData);
      navigate("/guest-lobby");
      setShowGuestModal(false);
    }
  };

  const closeGuestModal = () => {
    if (modalContentRef.current && modalRef.current) {
      gsap.to(modalContentRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      });

      gsap.to(modalRef.current, {
        opacity: 0,
        duration: 0.3,
        delay: 0.1,
        ease: "power2.in",
        onComplete: () => setShowGuestModal(false),
      });
    }
  };

  const handleTabSwitch = (isSignUpTab: boolean) => {
    const button = document.querySelector(
      `button[data-tab="${isSignUpTab ? "signup" : "signin"}"]`,
    );
    if (button) {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    }
    setIsSignUp(isSignUpTab);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-[#667eea]  to-[#764ba2] flex items-center justify-center p-4"
    >
      {/* Background Elements */}
      <div ref={backgroundRef} className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-[#ef476f]/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-[#ffd166]/10 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-40 w-40 h-40 bg-[#06d6a0]/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-[#118ab2]/10 rounded-full blur-xl animate-pulse delay-700"></div>
      </div>

      <div className="relative w-full max-w-7xl flex items-center justify-center gap-16">
        {/* Left Side - Illustration/Info */}
        <div
          ref={leftSideRef}
          className="hidden lg:flex flex-col items-center justify-center flex-1 text-white"
        >
          <div className="relative mb-8">
            {/* Main illustration area */}
            <div className="w-96 h-96 bg-gradient-to-br from-[#ef476f]/20 to-[#118ab2]/20 rounded-3xl backdrop-blur-sm border border-white/10 flex items-center justify-center relative overflow-hidden">
              {/* Drawing elements */}
              <div className="floating-element absolute top-8 left-8 w-16 h-16 bg-[#ffd166]/30 rounded-full flex items-center justify-center">
                <Palette className="w-8 h-8 text-[#ffffff]" />
              </div>
              <div className="floating-element absolute top-16 right-12 w-12 h-12 bg-[#ef476f]/30 rounded-full flex items-center justify-center">
                <Brush className="w-6 h-6 text-[#ffffff]" />
              </div>
              <div className="floating-element absolute bottom-12 left-16 w-14 h-14 bg-[#06d6a4]/30 rounded-full flex items-center justify-center">
                <PenTool className="w-7 h-7 text-[#ffffff]" />
              </div>

              {/* Central drawing pad */}
              <div className="w-48 h-32 bg-white/90 rounded-2xl shadow-2xl flex items-center justify-center relative">
                <div className="absolute inset-4 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Palette className="w-8 h-8 text-[#ef476f] mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">
                      Draw & Guess
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="floating-element absolute bottom-8 right-8 w-20 h-6 bg-[#118ab2]/40 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-semibold">GUESS!</span>
              </div>
            </div>
          </div>

          <div className="text-center max-w-md">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#ffffff] to-[#ebddbe] bg-clip-text text-transparent">
              Drawlio!
            </h1>
            <p className="text-xl text-white mb-8 leading-relaxed">
              The ultimate drawing and guessing game
            </p>

            {/* Game features */}
            <div className="grid grid-cols-2 gap-6 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ef476f]/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#fdfdfd]" />
                </div>
                <div>
                  <p className="font-semibold text-white">Multiplayer</p>
                  <p className="text-sm text-gray-300">Play with friends</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#118ab2]/20 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-[#ffffff]" />
                </div>
                <div>
                  <p className="font-semibold text-white">Instant</p>
                  <p className="text-sm text-gray-300">Quick matches</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-2xl lg:max-w-2xl">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#ef476f] to-[#ffd166] rounded-2xl shadow-lg mb-4">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Skribble</h1>
            <p className="text-gray-200">Draw, Guess, and Have Fun!</p>
          </div>

          {/* Main Card */}
          <div
            ref={cardRef}
            className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-white/20"
          >
            {/* Tab Switcher */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
              <button
                data-tab="signup"
                onClick={() => handleTabSwitch(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  isSignUp
                    ? "bg-gradient-to-r from-[#ef476f] to-[#ffd166] text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-[#ef476f]"
                }`}
              >
                Sign Up
              </button>
              <button
                data-tab="signin"
                onClick={() => handleTabSwitch(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  !isSignUp
                    ? "bg-gradient-to-r from-[#ef476f] to-[#ffd166] text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-[#ef476f]"
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                            errors.firstName
                              ? "border-[#ef476f] focus:border-[#ef476f] bg-red-50"
                              : "border-gray-200 focus:border-[#118ab2] focus:bg-[#118ab2]/5"
                          }`}
                          placeholder="Firstname"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-[#ef476f] text-sm mt-1 animate-pulse">
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                            errors.lastName
                              ? "border-[#ef476f] focus:border-[#ef476f] bg-red-50"
                              : "border-gray-200 focus:border-[#118ab2] focus:bg-[#118ab2]/5"
                          }`}
                          placeholder="Lastname"
                        />
                      </div>
                      {errors.lastName && (
                        <p className="text-[#ef476f] text-sm mt-1 animate-pulse">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <GameController2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                          errors.username
                            ? "border-[#ef476f] focus:border-[#ef476f] bg-red-50"
                            : "border-gray-200 focus:border-[#118ab2] focus:bg-[#118ab2]/5"
                        }`}
                        placeholder="Choose a unique username"
                      />
                    </div>
                    {errors.username && (
                      <p className="text-[#ef476f] text-sm mt-1 animate-pulse">
                        {errors.username}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                      errors.email
                        ? "border-[#ef476f] focus:border-[#ef476f] bg-red-50"
                        : "border-gray-200 focus:border-[#118ab2] focus:bg-[#118ab2]/5"
                    }`}
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-[#ef476f] text-sm mt-1 animate-pulse">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                      errors.password
                        ? "border-[#ef476f] focus:border-[#ef476f] bg-red-50"
                        : "border-gray-200 focus:border-[#118ab2] focus:bg-[#118ab2]/5"
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[#ef476f] text-sm mt-1 animate-pulse">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#ef476f] to-[#ffd166] text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {isSignUp ? "Create Account" : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-[#118ab2] hover:text-[#118ab2] transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Guest Login */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">Want to try the game first?</p>
              <button
                onClick={handleGuestLogin}
                className="bg-gradient-to-r from-[#06d6a0] to-[#118ab2] text-white py-3 px-8 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5" />
                Play as Guest
              </button>
            </div>
          </div>

          {/* Fun Stats */}
          <div className="mt-8 text-center lg:hidden">
            <div className="flex justify-center items-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="text-sm">10K+ Players</span>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                <span className="text-sm">100K+ Drawings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Login Modal */}
      {showGuestModal && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeGuestModal}
        >
          <div
            ref={modalContentRef}
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#06d6a0] to-[#118ab2] rounded-2xl shadow-lg mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Join as Guest
              </h2>
              <p className="text-gray-600">
                Enter your username to start playing
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={guestData.username}
                    onChange={handleGuestInputChange}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                      guestErrors.username
                        ? "border-[#ef476f] focus:border-[#ef476f] bg-red-50"
                        : "border-gray-200 focus:border-[#118ab2] focus:bg-[#118ab2]/5"
                    }`}
                    placeholder="Enter your username"
                  />
                </div>
                {guestErrors.username && (
                  <p className="text-[#ef476f] text-sm mt-1 animate-pulse">
                    {guestErrors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Code (Optional)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="roomCode"
                    value={guestData.roomCode}
                    onChange={handleGuestInputChange}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                      guestErrors.roomCode
                        ? "border-[#ef476f] focus:border-[#ef476f] bg-red-50"
                        : "border-gray-200 focus:border-[#118ab2] focus:bg-[#118ab2]/5"
                    }`}
                    placeholder="Enter room code to join"
                  />
                </div>
                {guestErrors.roomCode && (
                  <p className="text-[#ef476f] text-sm mt-1 animate-pulse">
                    {guestErrors.roomCode}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleCreateRoom}
                  className="bg-gradient-to-r from-[#ef476f] to-[#ffd166] text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Room
                </button>

                <button
                  onClick={handleJoinRoom}
                  className="bg-gradient-to-r from-[#06d6a0] to-[#118ab2] text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Hash className="w-4 h-4" />
                  Join Room
                </button>
              </div>

              <button
                onClick={closeGuestModal}
                className="w-full text-gray-500 hover:text-gray-700 py-2 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
