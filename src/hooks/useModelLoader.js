import { useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

export function useModelLoader(modelPaths) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load all models concurrently
        await Promise.all(modelPaths.map(path => useGLTF.preload(path)));
        
        // Add a 1-second delay after loading completes
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      } catch (error) {
        console.error('Error loading models:', error);
        setIsLoading(false);
      }
    };

    loadModels();

    // Cleanup
    return () => {
      modelPaths.forEach(path => useGLTF.clear(path));
    };
  }, [modelPaths]);

  return isLoading;
} 