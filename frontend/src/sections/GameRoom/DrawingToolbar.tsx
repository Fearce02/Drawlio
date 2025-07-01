import React, { useRef, useEffect } from "react";
import { Pencil, Eraser, Palette, Minus, Plus } from "lucide-react";
import { gsap } from "gsap";

interface DrawingToolbarProps {
  currentTool: "pencil" | "eraser";
  currentColor: string;
  brushSize: number;
  isDrawing: boolean;
  onToolChange: (tool: "pencil" | "eraser") => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  currentTool,
  currentColor,
  brushSize,
  isDrawing,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const colorsRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<HTMLDivElement>(null);
  const disabledRef = useRef<HTMLDivElement>(null);

  const colors = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
    "#800000",
    "#008000",
    "#000080",
    "#808000",
    "#800080",
  ];

  const previousColorRef = useRef(currentColor);

  useEffect(() => {
    if (currentTool === "eraser") {
      previousColorRef.current = currentColor;
    } else if (currentTool === "pencil") {
      // Always restore the previous color when switching to pencil
      // Only change if current color is white (eraser color) or if no previous color is set
      if (currentColor === "#ffffff" || !previousColorRef.current) {
        onColorChange(previousColorRef.current || "#000000");
      }

      // Ensure color palette is visible when pencil is selected
      if (isDrawing && colorsRef.current) {
        gsap.to(colorsRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }
  }, [currentTool, currentColor, onColorChange, isDrawing]);

  useEffect(() => {
    if (toolbarRef.current) {
      gsap.fromTo(
        toolbarRef.current,
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)", delay: 0.2 },
      );
    }
  }, []);

  useEffect(() => {
    if (isDrawing) {
      if (disabledRef.current) {
        gsap.to(disabledRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => {
            if (disabledRef.current) {
              disabledRef.current.style.display = "none";
            }
          },
        });
      }

      const elements = [
        toolsRef.current,
        colorsRef.current,
        brushRef.current,
      ].filter(Boolean);
      gsap.fromTo(
        elements,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          delay: 0.3,
        },
      );
    } else {
      if (disabledRef.current) {
        disabledRef.current.style.display = "block";
        gsap.to(disabledRef.current, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        });
      }

      const elements = [
        toolsRef.current,
        colorsRef.current,
        brushRef.current,
      ].filter(Boolean);
      gsap.to(elements, {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.in",
      });
    }
  }, [isDrawing]);

  const handleToolChange = (tool: "pencil" | "eraser") => {
    if (tool === "pencil") {
      // Always restore the previous color when switching to pencil
      // Only change if current color is white (eraser color) or if no previous color is set
      if (currentColor === "#ffffff" || !previousColorRef.current) {
        onColorChange(previousColorRef.current || "#000000");
      }
    }
    onToolChange(tool);

    // Ensure color palette is visible when switching to pencil
    if (tool === "pencil" && isDrawing && colorsRef.current) {
      gsap.to(colorsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    const button = document.querySelector(`[data-tool="${tool}"]`);
    if (button) {
      gsap.fromTo(
        button,
        { scale: 1 },
        {
          scale: 0.95,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
        },
      );
    }
  };

  const handleColorChange = (color: string) => {
    onColorChange(color);

    // Add ripple effect to color button
    const colorButton = document.querySelector(`[data-color="${color}"]`);
    if (colorButton) {
      gsap.fromTo(
        colorButton,
        { scale: 1 },
        {
          scale: 1.2,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: "back.out(1.7)",
        },
      );
    }
  };

  if (!isDrawing) {
    return (
      <div
        ref={toolbarRef}
        className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 p-4 transform"
      >
        <div ref={disabledRef} className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
            <Palette className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500">
            Drawing tools will be available when it's your turn
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={toolbarRef}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4 transform"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <Palette className="w-4 h-4 mr-2" />
          Drawing Tools
        </h3>
      </div>

      {/* Tool Selection */}
      <div ref={toolsRef} className="space-y-2 opacity-0">
        <label className="text-sm font-medium text-gray-700">Tool</label>
        <div className="flex space-x-2">
          <button
            data-tool="pencil"
            onClick={() => handleToolChange("pencil")}
            className={`flex items-center px-3 py-2 rounded-lg border transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              currentTool === "pencil"
                ? "bg-blue-500 text-white border-blue-500 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-md"
            }`}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Pencil
          </button>
          <button
            data-tool="eraser"
            onClick={() => handleToolChange("eraser")}
            className={`flex items-center px-3 py-2 rounded-lg border transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              currentTool === "eraser"
                ? "bg-red-500 text-white border-red-500 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-md"
            }`}
          >
            <Eraser className="w-4 h-4 mr-2" />
            Eraser
          </button>
        </div>
      </div>

      {/* Color Picker */}
      {currentTool === "pencil" && (
        <div ref={colorsRef} className="space-y-2 opacity-0">
          <label className="text-sm font-medium text-gray-700">Color</label>
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                data-color={color}
                onClick={() => handleColorChange(color)}
                className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 transform hover:scale-110 active:scale-95 ${
                  currentColor === color
                    ? "border-gray-800 shadow-lg"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Brush Size */}
      <div ref={brushRef} className="space-y-2 opacity-0">
        <label className="text-sm font-medium text-gray-700">
          Brush Size: {brushSize}px
        </label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onBrushSizeChange(Math.max(1, brushSize - 1))}
            className="p-1 rounded border border-gray-300 hover:border-gray-400 transition-all duration-200 transform hover:scale-110 active:scale-95"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <button
            onClick={() => onBrushSizeChange(Math.min(20, brushSize + 1))}
            className="p-1 rounded border border-gray-300 hover:border-gray-400 transition-all duration-200 transform hover:scale-110 active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-center">
          <div
            className="rounded-full bg-gray-800 transition-all duration-300"
            style={{
              width: `${Math.max(4, brushSize)}px`,
              height: `${Math.max(4, brushSize)}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
