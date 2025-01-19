import { useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export function useModelLoader(modelPaths) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dracoLoader = new DRACOLoader();
    // Using the official Three.js CDN for Draco decoder
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    dracoLoader.setDecoderConfig({ type: 'js' }); // Explicitly set decoder type
    
    const loadModels = async () => {
      try {
        // Load all models concurrently with Draco compression
        await Promise.all(modelPaths.map(path => 
          new Promise((resolve, reject) => {
            try {
              const model = useGLTF.preload(path, true, {
                draco: dracoLoader,
              });
              resolve(model);
            } catch (error) {
              console.error(`Error loading model ${path}:`, error);
              reject(error);
            }
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