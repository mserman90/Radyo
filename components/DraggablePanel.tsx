import React, { useState, useRef } from 'react';
import { X, Minus, Maximize2, GripHorizontal, scaling } from 'lucide-react';

interface DraggablePanelProps {
  title: string;
  children: React.ReactNode;
  initialPos?: { x: number; y: number };
  width?: string;
  height?: string;
  onClose?: () => void;
  icon?: React.ReactNode;
  resizable?: boolean;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({ 
  title, 
  children, 
  initialPos = { x: 20, y: 20 },
  width = "w-96",
  height = "h-auto",
  onClose,
  icon,
  resizable = false
}) => {
  const [position, setPosition] = useState(initialPos);
  const [customSize, setCustomSize] = useState<{w: number, h: number} | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // --- Drag Logic ---
  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // --- Resize Logic ---
  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setIsResizing(true);
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: rect.width,
        h: rect.height
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (isResizing) {
      e.preventDefault();
      e.stopPropagation();
      
      const deltaX = e.clientX - resizeStart.current.x;
      const deltaY = e.clientY - resizeStart.current.y;

      setCustomSize({
        w: Math.max(300, resizeStart.current.w + deltaX), // Min width 300px
        h: Math.max(200, resizeStart.current.h + deltaY)  // Min height 200px
      });
    }
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    setIsResizing(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      ref={panelRef}
      style={{ 
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: 'none',
        width: customSize ? `${customSize.w}px` : undefined,
        height: !isMinimized && customSize ? `${customSize.h}px` : undefined,
        // If resized, override max-height constraints from classes
        maxHeight: customSize ? 'none' : undefined 
      }}
      className={`
        absolute top-0 left-0 z-50 flex flex-col 
        shadow-2xl shadow-black/50 transition-opacity duration-200 
        ${!customSize ? width : ''} 
        ${!isMinimized && !customSize ? height : ''}
        ${isMinimized ? 'h-auto w-auto' : ''}
      `}
    >
      {/* Header / Drag Handle */}
      <div 
        className={`
          flex items-center justify-between px-4 py-3 
          bg-black/80 backdrop-blur-xl border border-white/10 
          cursor-grab active:cursor-grabbing select-none shrink-0
          ${isMinimized ? 'rounded-lg' : 'rounded-t-lg'}
          ${isDragging ? 'border-cyan-500/50' : 'border-white/10'}
        `}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
      >
        <div className="flex items-center gap-3 text-cyan-400 font-bold tracking-wider text-sm pr-8">
          <GripHorizontal className="w-4 h-4 text-gray-500" />
          {icon}
          <span className="uppercase whitespace-nowrap">{title}</span>
        </div>
        
        <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors group"
          >
            {isMinimized ? <Maximize2 className="w-3 h-3 text-gray-400 group-hover:text-white" /> : <Minus className="w-3 h-3 text-gray-400 group-hover:text-white" />}
          </button>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/20 rounded-md transition-colors group"
            >
              <X className="w-3 h-3 text-gray-400 group-hover:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {!isMinimized && (
        <div 
          className="flex-1 overflow-hidden bg-black/60 backdrop-blur-md border-x border-b border-white/10 rounded-b-lg flex flex-col relative"
          onPointerDown={(e) => e.stopPropagation()} // Allow interaction within content
        >
          {children}

          {/* Resize Handle */}
          {resizable && (
            <div 
              className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-50 flex items-end justify-end p-1 group"
              onPointerDown={handleResizeStart}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
            >
              {/* Visual indicator for resize handle */}
              <div className="w-2 h-2 border-b-2 border-r-2 border-white/20 group-hover:border-cyan-400 transition-colors rounded-br-sm" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};