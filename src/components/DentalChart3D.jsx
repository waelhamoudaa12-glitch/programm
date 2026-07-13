import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text } from '@react-three/drei';

const Tooth = ({ position, id, color, onSelect }) => {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);

  // If a specific color is passed, use it, otherwise use default
  const toothColor = color || '#f8fafc';
  const highlightColor = color ? color : '#14b8a6';

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHover(false);
        }}
      >
        <boxGeometry args={[0.5, 0.8, 0.5]} />
        <meshStandardMaterial color={hovered ? highlightColor : toothColor} />
      </mesh>
      
      {/* Tooth Number */}
      <Text
        position={[0, position[1] > 0 ? 0.6 : -0.6, 0.3]} // Slightly above/below and in front
        fontSize={0.25}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
      >
        {id}
      </Text>
    </group>
  );
};

const Jaw = ({ onSelectTooth, toothColors }) => {
  const teeth = [];
  const radius = 2.5;
  
  // Universal Numbering System (1-32)
  const upperRight = [1, 2, 3, 4, 5, 6, 7, 8];
  const upperLeft = [9, 10, 11, 12, 13, 14, 15, 16];
  const lowerRight = [32, 31, 30, 29, 28, 27, 26, 25];
  const lowerLeft = [24, 23, 22, 21, 20, 19, 18, 17];

  const createArch = (numbers, yPos, startAngle, endAngle) => {
    const archTeeth = [];
    const count = numbers.length;
    for (let i = 0; i < count; i++) {
      // Interpolate angle between start and end
      const angle = startAngle + ((endAngle - startAngle) / (count - 1)) * i;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const id = numbers[i].toString();
      
      archTeeth.push(
        <Tooth 
          key={id} 
          id={id} 
          position={[x, yPos, z]} 
          color={toothColors[id]}
          onSelect={onSelectTooth} 
        />
      );
    }
    return archTeeth;
  };

  // Upper Jaw (y = 0.8)
  // Right side (18 to 11): from PI to PI/2
  const ur = createArch(upperRight, 0.8, Math.PI, Math.PI / 2 + 0.1);
  // Left side (21 to 28): from PI/2 to 0
  const ul = createArch(upperLeft, 0.8, Math.PI / 2 - 0.1, 0);

  // Lower Jaw (y = -0.8)
  // Right side (48 to 41): from PI to PI/2
  const lr = createArch(lowerRight, -0.8, Math.PI, Math.PI / 2 + 0.1);
  // Left side (31 to 38): from PI/2 to 0
  const ll = createArch(lowerLeft, -0.8, Math.PI / 2 - 0.1, 0);

  return (
    <group>
      {ur}
      {ul}
      {lr}
      {ll}
    </group>
  );
};

const DentalChart3D = ({ onSelectTooth, toothColors }) => {
  return (
    <Canvas camera={{ position: [0, 2, 7], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <Jaw onSelectTooth={onSelectTooth} toothColors={toothColors} />
      <OrbitControls 
        enablePan={false} 
        minDistance={3} 
        maxDistance={12} 
        maxPolarAngle={Math.PI / 1.5}
      />
      <Environment preset="city" />
      <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} />
    </Canvas>
  );
};

export default DentalChart3D;
