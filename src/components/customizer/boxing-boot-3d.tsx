import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import * as THREE from "three";

export type BootColors = {
  upper: string;
  patent: string;
  accent: string;
  sole: string;
  lace: string;
};

type Props = {
  colors: BootColors;
  autoRotate?: boolean;
};

export function BoxingBoot3D({ colors, autoRotate = false }: Props) {
  const group = useRef<Group>(null);

  const mats = useMemo(() => {
    return {
      upper: new THREE.MeshStandardMaterial({ color: colors.upper, roughness: 0.65, metalness: 0.05 }),
      patent: new THREE.MeshStandardMaterial({ color: colors.patent, roughness: 0.15, metalness: 0.7 }),
      accent: new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.25, metalness: 0.9 }),
      sole: new THREE.MeshStandardMaterial({ color: colors.sole, roughness: 0.45, metalness: 0.05 }),
      lace: new THREE.MeshStandardMaterial({ color: colors.lace, roughness: 0.8, metalness: 0 }),
    };
  }, [colors.upper, colors.patent, colors.accent, colors.sole, colors.lace]);

  useFrame((_, delta) => {
    if (!group.current || !autoRotate) return;
    group.current.rotation.y += delta * 0.5;
  });

  // Simple high-top silhouette facing camera-friendly angle
  return (
    <group ref={group} position={[0, -0.2, 0]} rotation={[0.15, Math.PI * 0.15, 0]}>
      {/* sole */}
      <mesh position={[0.15, -0.55, 0]} material={mats.sole}>
        <boxGeometry args={[2.1, 0.18, 0.9]} />
      </mesh>
      <mesh position={[0.85, -0.5, 0]} material={mats.sole}>
        <boxGeometry args={[0.7, 0.15, 0.82]} />
      </mesh>

      {/* body */}
      <mesh position={[0, 0, 0]} material={mats.upper}>
        <boxGeometry args={[1.5, 1.0, 0.75]} />
      </mesh>
      {/* toe */}
      <mesh position={[0.8, -0.2, 0]} material={mats.upper}>
        <boxGeometry args={[0.65, 0.55, 0.72]} />
      </mesh>
      {/* high top */}
      <mesh position={[-0.55, 0.75, 0]} material={mats.upper}>
        <boxGeometry args={[0.8, 1.1, 0.72]} />
      </mesh>
      {/* tongue */}
      <mesh position={[0.05, 0.45, 0]} material={mats.upper}>
        <boxGeometry args={[0.5, 0.8, 0.4]} />
      </mesh>

      {/* patent */}
      <mesh position={[-0.65, 1.15, 0]} material={mats.patent}>
        <boxGeometry args={[0.6, 0.4, 0.78]} />
      </mesh>
      <mesh position={[0.15, -0.05, 0.4]} material={mats.patent}>
        <boxGeometry args={[1.2, 0.55, 0.08]} />
      </mesh>
      <mesh position={[0.15, -0.05, -0.4]} material={mats.patent}>
        <boxGeometry args={[1.2, 0.55, 0.08]} />
      </mesh>
      <mesh position={[-0.85, 0.1, 0]} material={mats.patent}>
        <boxGeometry args={[0.15, 0.8, 0.7]} />
      </mesh>
      <mesh position={[1.05, -0.25, 0]} material={mats.patent}>
        <boxGeometry args={[0.18, 0.4, 0.7]} />
      </mesh>

      {/* gold */}
      <mesh position={[0.4, -0.1, 0.42]} material={mats.accent}>
        <boxGeometry args={[0.55, 0.18, 0.06]} />
      </mesh>
      <mesh position={[0.4, -0.1, -0.42]} material={mats.accent}>
        <boxGeometry args={[0.55, 0.18, 0.06]} />
      </mesh>
      <mesh position={[0.65, -0.3, 0]} rotation={[0, 0, -0.35]} material={mats.accent}>
        <boxGeometry args={[0.35, 0.12, 0.6]} />
      </mesh>

      {/* laces */}
      {[0, 0.2, 0.4, 0.6].map((y) => (
        <mesh key={y} position={[0.1, y, 0]} material={mats.lace}>
          <boxGeometry args={[0.14, 0.05, 0.5]} />
        </mesh>
      ))}
    </group>
  );
}
