import React, { useState, useRef, useEffect } from 'react';
import AllianceBanner from './AllianceBanner';

interface AllianceBannerCustomizerProps {
  onBannerChange: (banner: {
    color: string;
    badge: string;
    trimColor: string;
    innerColor: string;
    shape: 'classic' | 'smooth' | 'inverse-pointed' | 'rounded' | 'inverse-rounded' | 'flared';
  }) => void;
}

export default function AllianceBannerCustomizer({ onBannerChange }: AllianceBannerCustomizerProps) {
  const [selectedColor, setSelectedColor] = useState('#C0C0C0'); // Default silver
  const [selectedBadge, setSelectedBadge] = useState('shield');
  const [selectedTrimColor, setSelectedTrimColor] = useState('#4A4A4A'); // Default dark gray
  const [selectedInnerColor, setSelectedInnerColor] = useState('#1E40AF'); // Default dark blue
  const [selectedShape, setSelectedShape] = useState<'classic' | 'smooth' | 'inverse-pointed' | 'rounded' | 'inverse-rounded' | 'flared'>('smooth');
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const shapes = [
    { id: 'classic', name: 'Classic', icon: '🛡️' },
    { id: 'smooth', name: 'Smooth', icon: '🎨' },
    { id: 'inverse-pointed', name: 'Inverse Point', icon: '🔻' },
    { id: 'rounded', name: 'Rounded', icon: '⭕' },
    { id: 'inverse-rounded', name: 'Inverse Round', icon: '🔵' },
    { id: 'flared', name: 'Flared', icon: '🎭' },
  ];

  const bannerColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Teal', value: '#14B8A6' },
  ];

  const trimColors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Gold', value: '#FFD700' },
    { name: 'Silver', value: '#C0C0C0' },
    { name: 'Bronze', value: '#CD7F32' },
    { name: 'Black', value: '#000000' },
    { name: 'Platinum', value: '#E5E4E2' },
    { name: 'Rose Gold', value: '#B76E79' },
    { name: 'Copper', value: '#B87333' },
  ];

  const innerColors = [
    { name: 'Blue', value: '#1E40AF' },
    { name: 'Red', value: '#991B1B' },
    { name: 'Green', value: '#065F46' },
    { name: 'Purple', value: '#5B21B6' },
    { name: 'Gold', value: '#B45309' },
    { name: 'Pink', value: '#9D174D' },
    { name: 'Indigo', value: '#3730A3' },
    { name: 'Teal', value: '#115E59' },
  ];

  const badges = [
    { id: 'shield', icon: '🛡️', name: 'Shield' },
    { id: 'sword', icon: '⚔️', name: 'Crossed Swords' },
    { id: 'crown', icon: '👑', name: 'Crown' },
    { id: 'star', icon: '⭐', name: 'Star' },
    { id: 'dragon', icon: '🐉', name: 'Dragon' },
    { id: 'castle', icon: '🏰', name: 'Castle' },
    { id: 'skull', icon: '💀', name: 'Skull' },
    { id: 'phoenix', icon: '🦅', name: 'Phoenix' },
    { id: 'bomb', icon: '💣', name: 'Bomb' },
    { id: 'fire', icon: '🔥', name: 'Fire' },
    { id: 'heartfire', icon: '❤️‍🔥', name: 'Heart Fire' },
    { id: 'knife', icon: '🔪', name: 'Knife' },
    { id: 'lightning', icon: '⚡', name: 'Lightning Bolt' },
    { id: 'crystal', icon: '💎', name: 'Crystal' },
    { id: 'wolf', icon: '🐺', name: 'Wolf' },
    { id: 'meteor', icon: '☄️', name: 'Meteor' },
    { id: 'unicorn', icon: '🦄', name: 'Unicorn' },
    { id: 'moon', icon: '🌙', name: 'Moon' },
    { id: 'trident', icon: '🔱', name: 'Trident' },
    { id: 'infinity', icon: '♾️', name: 'Infinity' },
  ];

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onBannerChange({
      color,
      badge: selectedBadge,
      trimColor: selectedTrimColor,
      innerColor: selectedInnerColor,
      shape: selectedShape
    });
  };

  const handleBadgeChange = (badge: string) => {
    setSelectedBadge(badge);
    onBannerChange({
      color: selectedColor,
      badge,
      trimColor: selectedTrimColor,
      innerColor: selectedInnerColor,
      shape: selectedShape
    });
  };

  const handleTrimColorChange = (trimColor: string) => {
    setSelectedTrimColor(trimColor);
    onBannerChange({
      color: selectedColor,
      badge: selectedBadge,
      trimColor,
      innerColor: selectedInnerColor,
      shape: selectedShape
    });
  };

  const handleInnerColorChange = (innerColor: string) => {
    setSelectedInnerColor(innerColor);
    onBannerChange({
      color: selectedColor,
      badge: selectedBadge,
      trimColor: selectedTrimColor,
      innerColor,
      shape: selectedShape
    });
  };

  const handleShapeChange = (shape: 'classic' | 'smooth' | 'inverse-pointed' | 'rounded' | 'inverse-rounded' | 'flared') => {
    setSelectedShape(shape);
    onBannerChange({
      color: selectedColor,
      badge: selectedBadge,
      trimColor: selectedTrimColor,
      innerColor: selectedInnerColor,
      shape
    });
  };

  const currentShapeIndex = shapes.findIndex(shape => shape.id === selectedShape);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentX(e.clientX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const dragDistance = currentX - startX;
    const threshold = 50;

    if (Math.abs(dragDistance) > threshold) {
      const newRotation = rotation + (dragDistance > 0 ? 60 : -60);
      setRotation(newRotation);

      // Update selected shape based on rotation
      const newIndex = (currentShapeIndex + (dragDistance > 0 ? -1 : 1) + shapes.length) % shapes.length;
      handleShapeChange(shapes[newIndex].id as typeof selectedShape);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, currentX, startX]);

  const selectedBadgeIcon = badges.find(b => b.id === selectedBadge)?.icon || badges[0].icon;

  return (
    <div className="space-y-4">
      {/* Banner Carousel */}
      <div className="relative h-64 w-full overflow-hidden">
        {/* Scroll Buttons */}
        <button
          onClick={() => {
            const newIndex = (currentShapeIndex - 1 + shapes.length) % shapes.length;
            handleShapeChange(shapes[newIndex].id as typeof selectedShape);
            setRotation(-newIndex * 256 + (window.innerWidth - 192) / 2);
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-800 bg-opacity-70 hover:bg-opacity-90 flex items-center justify-center text-white transition-all transform hover:scale-110"
          title="Previous banner"
        >
          ←
        </button>
        <button
          onClick={() => {
            const newIndex = (currentShapeIndex + 1) % shapes.length;
            handleShapeChange(shapes[newIndex].id as typeof selectedShape);
            setRotation(-newIndex * 256 + (window.innerWidth - 192) / 2);
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-800 bg-opacity-70 hover:bg-opacity-90 flex items-center justify-center text-white transition-all transform hover:scale-110"
          title="Next banner"
        >
          →
        </button>

        {/* Banner Carousel */}
        <div
          ref={carouselRef}
          className="absolute inset-0 flex items-center cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          style={{
            transform: `translateX(${rotation + (isDragging ? (currentX - startX) : 0)}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {shapes.map((shape, index) => {
            const x = index * 256;
            const scale = shape.id === selectedShape ? 1 : 0.8;
            const opacity = shape.id === selectedShape ? 1 : 0.6;

            return (
              <div
                key={shape.id}
                className="absolute cursor-pointer"
                onClick={() => {
                  handleShapeChange(shape.id as typeof selectedShape);
                  setRotation(-index * 256 + (window.innerWidth - 192) / 2);
                }}
                style={{
                  transform: `translateX(${x}px) scale(${scale})`,
                  opacity,
                  transition: 'all 0.3s ease-out'
                }}
              >
                <div className="w-48 h-64">
                  <AllianceBanner
                    color={selectedColor}
                    badge={selectedBadge}
                    badgeIcon={selectedBadgeIcon}
                    trimColor={selectedTrimColor}
                    innerColor={selectedInnerColor}
                    shape={shape.id as typeof selectedShape}
                    size="large"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Color Selection Sections */}
      <div className="flex items-center justify-center space-x-8">
        {/* Banner Color */}
        <div className="flex flex-col items-center">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Banner Color
          </label>
          <div className="flex flex-col items-center space-y-2">
            <input
              type="color"
              value={selectedInnerColor}
              onChange={(e) => handleInnerColorChange(e.target.value)}
              className="w-12 h-12 rounded-xl cursor-pointer"
              title="Choose banner color"
            />
            <select
              value={selectedInnerColor}
              onChange={(e) => handleInnerColorChange(e.target.value)}
              className="bg-gray-700 text-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-white"
            >
              {innerColors.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.name}
                </option>
              ))}
              <option value={selectedInnerColor}>Custom Color</option>
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="h-16 w-px bg-gray-700"></div>

        {/* Trim Color */}
        <div className="flex flex-col items-center">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Trim Color
          </label>
          <div className="flex flex-col items-center space-y-2">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-12 rounded-xl cursor-pointer"
              title="Choose trim color"
            />
            <select
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="bg-gray-700 text-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-white"
            >
              {bannerColors.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.name}
                </option>
              ))}
              <option value={selectedColor}>Custom Color</option>
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="h-16 w-px bg-gray-700"></div>

        {/* Outline Color */}
        <div className="flex flex-col items-center">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Outline Color
          </label>
          <div className="flex flex-col items-center space-y-2">
            <input
              type="color"
              value={selectedTrimColor}
              onChange={(e) => handleTrimColorChange(e.target.value)}
              className="w-12 h-12 rounded-xl cursor-pointer"
              title="Choose outline color"
            />
            <select
              value={selectedTrimColor}
              onChange={(e) => handleTrimColorChange(e.target.value)}
              className="bg-gray-700 text-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-white"
            >
              {trimColors.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.name}
                </option>
              ))}
              <option value={selectedTrimColor}>Custom Color</option>
            </select>
          </div>
        </div>
      </div>

      {/* Badge Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Badge Symbol
        </label>
        <div className="grid grid-cols-5 gap-2">
          {badges.map((badge) => (
            <button
              key={badge.id}
              onClick={() => handleBadgeChange(badge.id)}
              className={`w-full h-10 rounded-md bg-gray-700 flex items-center justify-center transition-all ${selectedBadge === badge.id
                ? 'ring-2 ring-white scale-105'
                : 'hover:bg-gray-600 hover:scale-105'
                }`}
              title={badge.name}
            >
              <span className="text-2xl">{badge.icon}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
