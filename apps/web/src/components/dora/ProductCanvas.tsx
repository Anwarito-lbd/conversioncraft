'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';

interface ProductCanvasProps {
    modelUrl: string;
}

const Model = ({ url }: { url: string }) => {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
};

const ProductCanvas: React.FC<ProductCanvasProps> = ({ modelUrl }) => {
    return (
        <div className="w-full h-full min-h-[400px] bg-slate-900 rounded-xl overflow-hidden relative">
            <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.6}>
                        <Model url={modelUrl} />
                    </Stage>
                </Suspense>
                <OrbitControls autoRotate />
            </Canvas>

            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                Interactive 3D View
            </div>
        </div>
    );
};

export default ProductCanvas;
