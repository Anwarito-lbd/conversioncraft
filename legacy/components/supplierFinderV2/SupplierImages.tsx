
import React from 'react';

interface SupplierImagesProps {
  images: string[];
  name: string;
}

const SupplierImages: React.FC<SupplierImagesProps> = ({ images, name }) => {
  const displayImages = images && images.length > 0 
    ? images 
    : [`https://picsum.photos/seed/${name.replace(/\s/g, '')}/400/400`, `https://picsum.photos/seed/${name.replace(/\s/g, '')}2/400/400`];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {displayImages.slice(0, 3).map((img, idx) => (
        <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group relative">
          <img 
            src={img} 
            alt={`${name} ${idx + 1}`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${idx}/200/200` }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
        </div>
      ))}
    </div>
  );
};

export default SupplierImages;
