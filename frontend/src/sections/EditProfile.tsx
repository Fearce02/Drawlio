import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Camera, Save, X } from "lucide-react";
import { gsap } from "gsap";
// import { fadeInUp, slideInFromLeft, bounceIn, staggerFadeIn } from '../hooks/useGSAP';

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
    avatar: user.avatar,
  });

  const [isUnsaved, setIsUnsaved] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const baseApi = "http://localhost:8000";
  //   useEffect(() => {
  //     // Page entrance animations
  //     if (headerRef.current) {
  //       slideInFromLeft(headerRef.current, 0.1);
  //     }

  //     if (cardRef.current) {
  //       fadeInUp(cardRef.current, 0.3);
  //     }

  //     if (avatarRef.current) {
  //       bounceIn(avatarRef.current, 0.5);
  //     }

  //     if (formRef.current) {
  //       staggerFadeIn(".form-field", 0.7);
  //     }

  //     if (statsRef.current) {
  //       staggerFadeIn(".stat-card", 0.9);
  //     }

  //     if (buttonsRef.current) {
  //       fadeInUp(buttonsRef.current, 1.1);
  //     }
  //   }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsUnsaved(true);

    // Add a subtle animation to indicate change
    const inputElement = event?.currentTarget;
    if (inputElement) {
      gsap.to(inputElement, {
        scale: 1.02,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }
  };

  const handleSave = async () => {
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
      console.log(data);
      if (response.ok) {
        const updatedUser = {
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          username: data.user.username,
          email: data.user.email,
          avatar: data.user.avatar,
          level: data.user.stats.level,
          gamesPlayed: data.user.stats.gamesplayed,
          gamesWon: data.user.stats.gamesWon,
        };

        onSave(updatedUser);
        setIsUnsaved(false);
      } else {
        alert(data.message || "Failed to Save profile");
      }
    } catch (error) {
      console.error("Update Error: ", error);
      alert("Something went wrong while updating profile");
    }

    setIsUnsaved(false);

    // Success animation
    const saveButton = event?.currentTarget;
    if (saveButton) {
      gsap.to(saveButton, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
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

  const handleAvatarChange = () => {
    // In a real app, this would open a file picker or avatar selection modal
    const newAvatar = `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`;
    handleInputChange("avatar", newAvatar);

    // Avatar change animation
    if (avatarRef.current) {
      gsap.to(avatarRef.current.querySelector("img"), {
        scale: 0.8,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between mb-8">
        <button
          onClick={handleCancel}
          className="flex items-center space-x-3 text-[#073b4c] hover:text-[#ef476f] transition-all duration-300 font-medium transform hover:scale-105"
          onMouseEnter={(e) => {
            gsap.to(e.currentTarget.querySelector("svg"), {
              x: -5,
              duration: 0.3,
            });
          }}
          onMouseLeave={(e) => {
            gsap.to(e.currentTarget.querySelector("svg"), {
              x: 0,
              duration: 0.3,
            });
          }}
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-lg">Back</span>
        </button>
        {isUnsaved && (
          <div className="flex items-center space-x-3">
            <span className="text-lg text-[#ffd166] font-bold">
              Unsaved changes
            </span>
            <div className="w-3 h-3 bg-[#ffd166] rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      <div
        ref={cardRef}
        className="bg-white rounded-3xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#ef476f] px-8 py-12 text-white">
          <h1 className="text-3xl font-bold mb-4">Edit Profile</h1>
          <p className="text-pink-100 text-lg">
            Update your profile information and preferences
          </p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-10">
          {/* Avatar Section */}
          <div ref={avatarRef} className="text-center">
            <div className="relative inline-block mb-6">
              <img
                src={formData.avatar}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover ring-4 ring-[#ef476f]/20 transition-all duration-300"
              />
              <button
                onClick={handleAvatarChange}
                className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#ef476f] text-white rounded-full flex items-center justify-center hover:bg-[#e63946] transition-all duration-300 shadow-lg transform hover:scale-110"
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget.querySelector("svg"), {
                    rotation: 180,
                    duration: 0.3,
                  });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget.querySelector("svg"), {
                    rotation: 0,
                    duration: 0.3,
                  });
                }}
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 text-lg">
              Click the camera icon to change your avatar
            </p>
          </div>

          {/* Form Fields */}
          <div ref={formRef} className="space-y-8">
            <div className="form-field">
              <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#ef476f] text-lg transition-all duration-300 focus:scale-105"
                placeholder="Enter your UserName"
                onFocus={(e) => {
                  gsap.to(e.currentTarget, { scale: 1.02, duration: 0.3 });
                }}
                onBlur={(e) => {
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.3 });
                }}
              />
              <p className="text-gray-500 mt-2">
                This is how other players will see you
              </p>
            </div>
            <div className="form-field">
              <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                FirstName
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#ef476f] text-lg transition-all duration-300 focus:scale-105"
                placeholder="Enter your First Name"
                onFocus={(e) => {
                  gsap.to(e.currentTarget, { scale: 1.02, duration: 0.3 });
                }}
                onBlur={(e) => {
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.3 });
                }}
              />
            </div>
            <div className="form-field">
              <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                LastName
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#ef476f] text-lg transition-all duration-300 focus:scale-105"
                placeholder="Enter your Last Name"
                onFocus={(e) => {
                  gsap.to(e.currentTarget, { scale: 1.02, duration: 0.3 });
                }}
                onBlur={(e) => {
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.3 });
                }}
              />
            </div>

            <div className="form-field">
              <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#ef476f] text-lg transition-all duration-300 focus:scale-105"
                placeholder="Enter your email address"
                onFocus={(e) => {
                  gsap.to(e.currentTarget, { scale: 1.02, duration: 0.3 });
                }}
                onBlur={(e) => {
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.3 });
                }}
              />
              <p className="text-gray-500 mt-2">
                Used for account recovery and notifications
              </p>
            </div>
          </div>

          {/* Stats Display */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-2xl font-bold text-[#073b4c] mb-6">
              Your Stats
            </h3>
            <div
              ref={statsRef}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              <div
                className="stat-card bg-[#ef476f] p-6 rounded-2xl text-center text-white cursor-pointer transition-all duration-300 transform hover:scale-105"
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { y: -5, duration: 0.3 });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { y: 0, duration: 0.3 });
                }}
              >
                <p className="text-3xl font-bold mb-2">{user.level}</p>
                <p className="text-pink-100 font-medium">Level</p>
              </div>
              <div
                className="stat-card bg-[#118ab2] p-6 rounded-2xl text-center text-white cursor-pointer transition-all duration-300 transform hover:scale-105"
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { y: -5, duration: 0.3 });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { y: 0, duration: 0.3 });
                }}
              >
                <p className="text-3xl font-bold mb-2">{user.gamesPlayed}</p>
                <p className="text-blue-100 font-medium">Games Played</p>
              </div>
              <div
                className="stat-card bg-[#06d6a0] p-6 rounded-2xl text-center text-white cursor-pointer transition-all duration-300 transform hover:scale-105"
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { y: -5, duration: 0.3 });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { y: 0, duration: 0.3 });
                }}
              >
                <p className="text-3xl font-bold mb-2">{user.gamesWon}</p>
                <p className="text-emerald-100 font-medium">Games Won</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            ref={buttonsRef}
            className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200"
          >
            <button
              onClick={handleCancel}
              className="flex-1 px-8 py-4 border-2 border-gray-300 text-[#073b4c] rounded-full font-bold text-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-3 transform hover:scale-105"
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget.querySelector("svg"), {
                  rotation: 90,
                  duration: 0.3,
                });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget.querySelector("svg"), {
                  rotation: 0,
                  duration: 0.3,
                });
              }}
            >
              <X className="w-6 h-6" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!isUnsaved}
              className="flex-1 px-8 py-4 bg-[#ef476f] text-white rounded-full font-bold text-lg hover:bg-[#e63946] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transform hover:scale-105 disabled:transform-none"
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  gsap.to(e.currentTarget.querySelector("svg"), {
                    scale: 1.2,
                    duration: 0.3,
                  });
                }
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget.querySelector("svg"), {
                  scale: 1,
                  duration: 0.3,
                });
              }}
            >
              <Save className="w-6 h-6" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
