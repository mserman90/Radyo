import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Stars, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { RadioStation } from '../types';

interface Globe3DProps {
  stations: RadioStation[];
  onStationSelect: (station: RadioStation) => void;
  currentStation: RadioStation | null;
}

const GLOBE_RADIUS = 5;

// --- Shaders for Atmosphere ---
const vertexShader = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec3 vNormal;
void main() {
  float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
  gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 1.5;
}
`;

const latLonToVector3 = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
};

const StationMarker: React.FC<{
  station: RadioStation;
  isSelected: boolean;
  onClick: (s: RadioStation) => void;
}> = ({ station, isSelected, onClick }) => {
  const position = useMemo(() => {
    return latLonToVector3(station.geo_lat || 0, station.geo_long || 0, GLOBE_RADIUS);
  }, [station.geo_lat, station.geo_long]);

  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (ref.current) {
        ref.current.lookAt(0,0,0);
        // Pulse effect for selected
        if (isSelected) {
           const s = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
           ref.current.scale.set(s, s, s);
        } else {
           ref.current.scale.set(1, 1, 1);
        }
    }
  });

  if (!station.geo_lat || !station.geo_long) return null;

  return (
    <group ref={ref} position={position}>
      <mesh 
        rotation={[Math.PI / 2, 0, 0]} 
        position={[0, 0, isSelected ? 0.4 : 0.15]}
        onClick={(e) => { e.stopPropagation(); onClick(station); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Beam/Pin style marker */}
        <cylinderGeometry args={[0.02, 0.02, isSelected ? 0.8 : 0.3, 8]} />
        <meshBasicMaterial 
          color={isSelected ? "#00ffff" : (hovered ? "#ffffff" : "#ff0055")} 
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      {/* Glowing base */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
        <circleGeometry args={[isSelected ? 0.1 : 0.05, 16]} />
        <meshBasicMaterial color={isSelected ? "#00ffff" : "#ff0055"} transparent opacity={0.6} />
      </mesh>

      {hovered && !isSelected && (
        <Html distanceFactor={12} position={[0, 0, 0.5]}>
          <div className="px-3 py-1 bg-black/90 text-white text-xs font-bold rounded border border-cyan-500/30 whitespace-nowrap backdrop-blur-md shadow-[0_0_10px_rgba(0,210,255,0.3)]">
            {station.name}
          </div>
        </Html>
      )}
    </group>
  );
};

const RealisticEarth = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  // Load high-res textures
  const [colorMap, normalMap, specularMap, cloudsMap] = useTexture([
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
  ]);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0005; // Earth rotation
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0007; // Clouds move slightly faster
    }
  });

  return (
    <group>
      {/* Base Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          specular={new THREE.Color(0x333333)}
          shininess={5}
        />
      </mesh>

      {/* Clouds Layer */}
      <mesh ref={cloudsRef} scale={[1.015, 1.015, 1.015]}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere Halo (Fresnel Shader) */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent={true}
        />
      </mesh>
    </group>
  );
};

export const Globe3D: React.FC<Globe3DProps> = ({ stations, onStationSelect, currentStation }) => {
  return (
    <div className="w-full h-full absolute inset-0 bg-[#020205]">
      <Canvas camera={{ position: [0, 0, 14], fov: 45 }} gl={{ antialias: true }}>
        {/* Lighting suitable for space */}
        <ambientLight intensity={0.1} color="#ffffff" />
        {/* Sun light */}
        <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" castShadow />
        {/* Rim light for dark side */}
        <spotLight position={[-10, 10, -5]} intensity={1} color="#4455ff" angle={0.5} />

        <Stars radius={300} depth={60} count={10000} factor={7} saturation={0} fade speed={0.5} />
        
        <Suspense fallback={null}>
          <RealisticEarth />
          <group rotation={[0, 0, 0]}>
             {/* We wrap markers in a group that rotates with earth if we wanted them fixed to surface logic, 
                 but since we calc pos based on lat/lon every render/memo, we actually need to rotate the container 
                 OR rotate the camera. 
                 
                 However, the RealisticEarth component rotates internally. 
                 To make markers stick to the rotating earth, we must apply the same rotation to a container holding markers.
             */}
             <EarthRotator>
                {stations.map((station) => (
                  <StationMarker 
                    key={station.stationuuid} 
                    station={station} 
                    isSelected={currentStation?.stationuuid === station.stationuuid}
                    onClick={onStationSelect}
                  />
                ))}
             </EarthRotator>
          </group>
        </Suspense>
        
        <OrbitControls 
          enablePan={false} 
          minDistance={7} 
          maxDistance={25} 
          rotateSpeed={0.6}
          zoomSpeed={0.6}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
      
      <div className="absolute bottom-4 right-4 text-[10px] text-white/20 pointer-events-none">
        Texture credits: NASA / Three.js
      </div>
    </div>
  );
};

// Helper to sync marker rotation with earth rotation
const EarthRotator: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0005;
    }
  });
  return <group ref={ref}>{children}</group>;
}
