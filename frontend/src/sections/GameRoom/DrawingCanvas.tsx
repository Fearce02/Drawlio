import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import socket from "../../sockets/socket";

interface Point {
  x: number;
  y: number;
}

interface DrawingCanvasProps {
  isCurrentPlayerDrawing: boolean;
  currentTool: "pencil" | "eraser";
  currentColor: string;
  brushSize: number;
  roomCode: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isCurrentPlayerDrawing,
  currentTool,
  currentColor,
  brushSize,
  roomCode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // Setup canvas
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  useEffect(() => {
    initializeCanvas();
  }, []);

  useEffect(() => {
    if (isCurrentPlayerDrawing) {
      initializeCanvas(); // clear canvas on new turn if drawing
    }
  }, [isCurrentPlayerDrawing]);

  const clearCanvas = (emit = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animate the clear effect
    gsap.to(canvas, {
      scale: 0.95,
      duration: 0.2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // Clear the canvas after animation
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      },
    });

    // Emit the clear event to other players
    if (emit && isCurrentPlayerDrawing) {
      socket.emit("clearCanvas", { roomCode });
    }
  };

  const getMousePos = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  useEffect(() => {
    socket.on("clearCanvas", () => {
      clearCanvas(false);
    });
    return () => {
      socket.off("clearCanvas");
    };
  }, []);

  const drawLine = (
    from: Point,
    to: Point,
    color: string,
    width: number,
    emit: boolean,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    if (emit && isCurrentPlayerDrawing) {
      socket.emit("drawing", {
        roomCode,
        from,
        to,
        color,
        brushSize: width,
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCurrentPlayerDrawing) return;
    const pos = getMousePos(e);
    setLastPoint(pos);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint || !isCurrentPlayerDrawing) return;
    const currentPos = getMousePos(e);
    const color = currentTool === "eraser" ? "#ffffff" : currentColor;
    drawLine(lastPoint, currentPos, color, brushSize, true);
    setLastPoint(currentPos);
  };

  const handleMouseUp = () => {
    if (!isCurrentPlayerDrawing) return;
    setIsDrawing(false);
    setLastPoint(null);
  };

  // Handle remote drawing
  useEffect(() => {
    const handleRemoteDraw = ({
      from,
      to,
      color,
      brushSize,
    }: {
      from: Point;
      to: Point;
      color: string;
      brushSize: number;
    }) => {
      drawLine(from, to, color, brushSize, false);
    };

    socket.on("drawing", handleRemoteDraw);
    return () => {
      socket.off("drawing", handleRemoteDraw);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transform"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Drawing Canvas</h3>
        {isCurrentPlayerDrawing && (
          <button
            onClick={() => clearCanvas(true)}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Clear
          </button>
        )}
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className={`w-full h-auto border-2 border-gray-300 rounded-lg transition-all duration-300 ${
            isCurrentPlayerDrawing
              ? "cursor-crosshair border-blue-300"
              : "cursor-default"
          }`}
          style={{
            pointerEvents: isCurrentPlayerDrawing ? "auto" : "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {!isCurrentPlayerDrawing && (
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              background: "transparent",
              backdropFilter: "none",
            }}
          />
        )}
      </div>
    </div>
  );
};
