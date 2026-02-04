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
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
    "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFC0CB", "#A52A2A",
    "#808080", "#800000", "#008000", "#000080", "#800080", "#FFD700"
  ];

  const previousColorRef = useRef(currentColor);

  useEffect(() => {
    if (currentTool === "eraser") {
      previousColorRef.current = currentColor;
    } else if (currentTool === "pencil") {
      if (currentColor === "#ffffff" || !previousColorRef.current) {
        onColorChange(previousColorRef.current || "#000000");
      }
      if (isDrawing && colorsRef.current) {
        gsap.to(colorsRef.current, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
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
            if (disabledRef.current) disabledRef.current.style.display = "none";
          },
        });
      }

      const elements = [toolsRef.current, colorsRef.current, brushRef.current].filter(Boolean);
      gsap.fromTo(
        elements,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)", delay: 0.3 },
      );
    } else {
      if (disabledRef.current) {
        disabledRef.current.style.display = "block";
        gsap.to(disabledRef.current, { opacity: 1, duration: 0.5, ease: "power2.out" });
      }
      const elements = [toolsRef.current, colorsRef.current, brushRef.current].filter(Boolean);
      gsap.to(elements, { y: 20, opacity: 0, duration: 0.4, stagger: 0.05, ease: "power2.in" });
    }
  }, [isDrawing]);

  const handleToolChange = (tool: "pencil" | "eraser") => {
    if (tool === "pencil") {
      if (currentColor === "#ffffff" || !previousColorRef.current) {
        onColorChange(previousColorRef.current || "#000000");
      }
    }
    onToolChange(tool);

    if (tool === "pencil" && isDrawing && colorsRef.current) {
      gsap.to(colorsRef.current, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
    }

    const button = document.querySelector(`[data-tool="${tool}"]`);
    if (button) {
      gsap.fromTo(button, { scale: 1 }, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.inOut" });
    }
  };

  const handleColorChange = (color: string) => {
    onColorChange(color);
    const colorButton = document.querySelector(`[data-color="${color}"]`);
    if (colorButton) {
      gsap.fromTo(colorButton, { scale: 1 }, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1, ease: "back.out(1.7)" });
    }
  };

  if (!isDrawing) {
    return (
      <div
        ref={toolbarRef}
        className="bg-[#F3EDF7] rounded-[24px] shadow-sm border border-[#CAC4D0] p-6 text-center h-full flex flex-col justify-center items-center"
      >
        <div ref={disabledRef}>
          <div className="w-16 h-16 mx-auto mb-4 bg-[#EADDFF] rounded-full flex items-center justify-center text-[#21005D]">
            <Palette className="w-8 h-8" />
          </div>
          <p className="text-[#1C1B1F] font-medium">Wait for your turn to draw!</p>
          <p className="text-[#49454F] text-sm mt-1">Tools will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={toolbarRef}
      className="bg-white rounded-[24px] shadow-sm border border-[#CAC4D0] p-5 space-y-6"
    >
      <div className="flex items-center justify-between pb-2 border-b border-[#E7E0EC]">
        <h3 className="font-bold text-[#1C1B1F] flex items-center">
          <Palette className="w-5 h-5 mr-2 text-[#6750A4]" />
          Drawing Tools
        </h3>
      </div>

      {/* Tool Selection */}
      <div ref={toolsRef} className="space-y-2">
        <label className="text-xs font-bold text-[#6750A4] uppercase tracking-wider">Mode</label>
        <div className="flex space-x-2">
          <button
            data-tool="pencil"
            onClick={() => handleToolChange("pencil")}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-full font-medium transition-all ${
              currentTool === "pencil"
                ? "bg-[#6750A4] text-white shadow-md"
                : "bg-[#F3EDF7] text-[#1C1B1F] hover:bg-[#EADDFF]"
            }`}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Draw
          </button>
          <button
            data-tool="eraser"
            onClick={() => handleToolChange("eraser")}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-full font-medium transition-all ${
              currentTool === "eraser"
                ? "bg-[#B3261E] text-white shadow-md"
                : "bg-[#F3EDF7] text-[#1C1B1F] hover:bg-[#FFD8E4] hover:text-[#31111D]"
            }`}
          >
            <Eraser className="w-4 h-4 mr-2" />
            Erase
          </button>
        </div>
      </div>

      {/* Color Picker */}
      {currentTool === "pencil" && (
        <div ref={colorsRef} className="space-y-2">
          <label className="text-xs font-bold text-[#6750A4] uppercase tracking-wider">Colors</label>
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                data-color={color}
                onClick={() => handleColorChange(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                  currentColor === color
                    ? "border-[#6750A4] shadow-md scale-110 ring-2 ring-[#EADDFF]"
                    : "border-transparent hover:border-[#CAC4D0]"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Brush Size */}
      <div ref={brushRef} className="space-y-3">
        <label className="text-xs font-bold text-[#6750A4] uppercase tracking-wider">
          Size: {brushSize}px
        </label>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onBrushSizeChange(Math.max(1, brushSize - 1))}
            className="p-2 rounded-full bg-[#F3EDF7] text-[#1C1B1F] hover:bg-[#EADDFF]"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1 px-2">
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
              className="w-full h-2 bg-[#E7E0EC] rounded-lg appearance-none cursor-pointer accent-[#6750A4]"
            />
          </div>
          <button
            onClick={() => onBrushSizeChange(Math.min(20, brushSize + 1))}
            className="p-2 rounded-full bg-[#F3EDF7] text-[#1C1B1F] hover:bg-[#EADDFF]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-center h-8 items-center">
          <div
            className="rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(4, brushSize)}px`,
              height: `${Math.max(4, brushSize)}px`,
              backgroundColor: currentTool === 'eraser' ? '#B3261E' : currentColor
            }}
          />
        </div>
      </div>
    </div>
  );
};
