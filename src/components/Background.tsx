import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect } from 'react';

const Background = () => {
  const { scene } = useThree();

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/background.jpeg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2); // 원하는 반복 조정
      texture.colorSpace = THREE.SRGBColorSpace;
      scene.background = texture;
    });
  }, [scene]);

  return null;
};

export default Background;