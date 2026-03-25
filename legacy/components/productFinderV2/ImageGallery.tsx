
import React from 'react';

interface ImageGalleryProps {
    images: string[];
    name: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, name }) => {
  // Use provided images or fallback to placeholder if empty
  const displayImages = images && images.length > 0 ? images : [];
  
  // If actually empty (even after check), ensure at least one placeholder
  if (displayImages.length === 0) {
      displayImages.push(`https://placehold.co/400x400/1e293b/FFFFFF?text=${encodeURIComponent(name)}`);
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = `https://placehold.co/400x400/1e293b/FFFFFF?text=Product+Image`;
    e.currentTarget.onerror = null;
  };
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayImages.slice(0, 4).map((img, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-900 relative group">
                <img 
                    src={img} 
                    alt={`${name} ${i}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    onError={handleImageError}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
            </div>
        ))}
    </div>
  );
};

export default ImageGallery;
