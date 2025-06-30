import React, { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";

interface DrawingCanvasProps {
  isDrawing: boolean;
  currentTool: "pencil" | "eraser";
  currentColor: string;
  brushSize: number;
  onDrawingChange?: (imageData: string) => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawing,
  currentTool,
  currentColor,
  brushSize,
  onDrawingChange,
  canvasRef,
}) => {
  const canvasRefInternal = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const drawingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Use external canvasRef if provided, otherwise use internal
  const activeCanvasRef = canvasRef || canvasRefInternal;

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.7)" },
      );
    }
  }, []);

  useEffect(() => {
    if (overlayRef.current) {
      if (isDrawing) {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => {
            if (overlayRef.current) {
              overlayRef.current.style.pointerEvents = "none";
            }
          },
        });
      } else {
        if (overlayRef.current) {
          overlayRef.current.style.pointerEvents = "auto";
        }
        // Show overlay only if game hasn't started yet
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
        });
      }
    }
  }, [isDrawing]);

  useEffect(() => {
    if (clearButtonRef.current && isDrawing) {
      gsap.fromTo(
        clearButtonRef.current,
        { scale: 0, rotation: -180 },
        {
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: "back.out(1.7)",
          delay: 0.3,
        },
      );
    }
  }, [isDrawing]);

  const getCanvasCoordinates = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      const canvas = activeCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    },
    [activeCanvasRef],
  );

  const drawLine = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const canvas = activeCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);

      if (currentTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = brushSize * 2;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSize;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Only emit drawing updates when user is drawing and not too frequently
      if (onDrawingChange && isDrawing) {
        // Throttle drawing updates to improve performance
        if (!drawingTimeoutRef.current) {
          drawingTimeoutRef.current = setTimeout(() => {
            onDrawingChange(canvas.toDataURL());
            drawingTimeoutRef.current = null;
          }, 50); // Update every 50ms instead of every stroke
        }
      }
    },
    [
      currentTool,
      currentColor,
      brushSize,
      onDrawingChange,
      activeCanvasRef,
      isDrawing,
    ],
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!isDrawing) return;

      setIsMouseDown(true);
      const point = getCanvasCoordinates(event);
      setLastPoint(point);

      // Draw a dot for single clicks with animation
      drawLine(point, point);

      // Add ripple effect
      if (activeCanvasRef.current) {
        const ripple = document.createElement("div");
        ripple.className =
          "absolute w-4 h-4 bg-blue-400 rounded-full pointer-events-none";
        ripple.style.left = `${event.nativeEvent.offsetX - 8}px`;
        ripple.style.top = `${event.nativeEvent.offsetY - 8}px`;
        activeCanvasRef.current.parentElement?.appendChild(ripple);

        gsap.fromTo(
          ripple,
          { scale: 0, opacity: 0.8 },
          {
            scale: 2,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            onComplete: () => ripple.remove(),
          },
        );
      }
    },
    [isDrawing, getCanvasCoordinates, drawLine],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDrawing || !isMouseDown || !lastPoint) return;

      const currentPoint = getCanvasCoordinates(event);
      drawLine(lastPoint, currentPoint);
      setLastPoint(currentPoint);

      if (activeCanvasRef.current && isDrawing) {
        const imageData = activeCanvasRef.current.toDataURL();
        onDrawingChange?.(imageData);
      }
    },
    [isDrawing, isMouseDown, lastPoint, getCanvasCoordinates, drawLine],
  );

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    setLastPoint(null);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animate clear effect
    gsap.to(canvas, {
      scale: 0.95,
      duration: 0.2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (onDrawingChange && isDrawing) {
          onDrawingChange(canvas.toDataURL());
        }
      },
    });
  }, [onDrawingChange, activeCanvasRef, isDrawing]);

  useEffect(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;

    // Initialize canvas with white background
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [activeCanvasRef]);

  useEffect(() => {
    const handleMouseMoveGlobal = (event: MouseEvent) => {
      if (!isDrawing || !isMouseDown || !lastPoint) return;

      const currentPoint = getCanvasCoordinates(event);
      drawLine(lastPoint, currentPoint);
      setLastPoint(currentPoint);
    };

    const handleMouseUpGlobal = () => {
      setIsMouseDown(false);
      setLastPoint(null);
    };

    if (isMouseDown) {
      document.addEventListener("mousemove", handleMouseMoveGlobal);
      document.addEventListener("mouseup", handleMouseUpGlobal);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMoveGlobal);
      document.removeEventListener("mouseup", handleMouseUpGlobal);
    };
  }, [isMouseDown, lastPoint, isDrawing, getCanvasCoordinates, drawLine]);

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transform"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Drawing Canvas</h3>
        {isDrawing && (
          <button
            ref={clearButtonRef}
            onClick={clearCanvas}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Clear
          </button>
        )}
      </div>

      <div className="relative">
        <canvas
          ref={activeCanvasRef}
          width={800}
          height={500}
          className={`w-full h-auto border-2 border-gray-300 rounded-lg transition-all duration-300 ${
            isDrawing
              ? "cursor-crosshair border-blue-300"
              : "cursor-not-allowed"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        <div
          ref={overlayRef}
          className="absolute inset-0 bg-gray-50 bg-opacity-90 flex items-center justify-center rounded-lg backdrop-blur-sm"
          style={{ pointerEvents: isDrawing ? "none" : "auto" }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-600 font-medium">
              Waiting for your turn to draw...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
