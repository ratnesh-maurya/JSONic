"use client";

import { useState, useRef, useEffect } from "react";

interface ResizableContainerProps {
  leftChild: React.ReactNode;
  rightChild: React.ReactNode;
  initialLeftWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export const ResizableContainer = ({
  leftChild,
  rightChild,
  initialLeftWidth = 50,
  minWidth = 25,
  maxWidth = 75,
}: ResizableContainerProps) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightEdgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "auto";
      document.body.style.userSelect = "auto";
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth]);

  const handleRightEdgeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full gap-0 relative"
      onMouseLeave={() => {
        if (!isDragging) {
          document.body.style.cursor = "auto";
        }
      }}
    >
      {/* Left Panel */}
      <div
        style={{ width: `${leftWidth}%` }}
        className="flex flex-col overflow-hidden relative"
      >
        {leftChild}
        {/* Right edge of left panel - draggable */}
        <div
          ref={rightEdgeRef}
          onMouseDown={handleRightEdgeMouseDown}
          onMouseEnter={() => {
            if (!isDragging) {
              document.body.style.cursor = "col-resize";
            }
          }}
          onMouseLeave={() => {
            if (!isDragging) {
              document.body.style.cursor = "auto";
            }
          }}
          className={`absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 bg-gradient-to-r from-transparent via-blue-500/0 to-transparent hover:via-blue-500/70 transition-all duration-200 cursor-col-resize ${isDragging ? "w-1.5 via-blue-500" : ""
            }`}
          title="Drag to resize"
        />
      </div>

      {/* Right Panel */}
      <div
        style={{ width: `${100 - leftWidth}%` }}
        className="flex flex-col overflow-hidden"
      >
        {rightChild}
      </div>
    </div>
  );
};

