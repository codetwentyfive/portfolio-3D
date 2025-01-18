import { useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export function useModelLoader(modelPaths) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    
    const loadModels = async () => {
      try {
        // Configure GLTF loader with Draco compression
        useGLTF.preload(modelPaths[0], true, {
          draco: dracoLoader,
        });

        // Load all models concurrently with Draco compression
        await Promise.all(modelPaths.map(path => 
          useGLTF.preload(path, true, {
            draco: dracoLoader,
          })
        ));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        setIsLoading(false);
      }
    };

    loadModels();

    // Cleanup
    return () => {
      modelPaths.forEach(path => {
        useGLTF.clear(path);
      });
      dracoLoader.dispose();
    };
  }, [modelPaths]);

  return isLoading;
} 