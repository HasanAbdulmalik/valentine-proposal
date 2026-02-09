import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Heart Math
const getHeartPosition = (t, scale = 1) => {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  // MOVED UP: Changed y offset from -4.5 to -2.5 so it doesn't cut off
  return new THREE.Vector3(
      (x * 0.7) * scale, 
      ((y * 0.7) * scale) - 2.5, 
      0
  ); 
};

export const ParticleSystem = ({ shape, color }) => {
  const points = useRef();
  
  // Separation of powers:
  // 0 -> 4000: The Active Shape (Heart/Text)
  // 4000 -> 5500: The Permanent Background Dust
  const mainCount = 4000;
  const dustCount = 1500;
  const totalCount = mainCount + dustCount;

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < totalCount; i++) {
      const isDust = i >= mainCount;
      
      // Initial Position
      const t = Math.random() * Math.PI * 2;
      const innerScale = Math.sqrt(Math.random());
      
      let pos;
      if (isDust) {
          // Dust starts spread out
          pos = new THREE.Vector3(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
          );
      } else {
          // Main particles start in heart
          pos = getHeartPosition(t, innerScale);
          pos.z += (Math.random() - 0.5) * 8; 
      }

      temp.push({ 
        current: pos.clone(), 
        target: pos.clone(),
        isDust: isDust,
        // Dust gets random drift speeds
        drift: new THREE.Vector3((Math.random()-0.5)*0.02, (Math.random()-0.5)*0.02, (Math.random()-0.5)*0.02)
      });
    }
    return temp;
  }, []);

  useEffect(() => {
    // UPDATE TARGETS BASED ON SHAPE
    if (shape === "HEART") {
      particles.forEach((p, i) => {
        if (p.isDust) return; // Leave dust alone
        const t = Math.random() * Math.PI * 2;
        const innerScale = Math.sqrt(Math.random());
        p.target = getHeartPosition(t, innerScale);
        p.target.z += (Math.random() - 0.5) * 8;
      });
    } 
    else if (shape === "EXPLODE") {
      particles.forEach((p) => {
        if (p.isDust) return;
        p.target = new THREE.Vector3(
          (Math.random() - 0.5) * 120,
          (Math.random() - 0.5) * 120,
          (Math.random() - 0.5) * 80
        );
      });
    } 
    else if (shape === "TEXT") {
       // Cloud Background for Text Mode
       particles.forEach((p) => {
          if (p.isDust) return;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos((Math.random() * 2) - 1);
          const r = 30 + Math.random() * 30; 

          p.target = new THREE.Vector3(
             r * Math.sin(phi) * Math.cos(theta),
             r * Math.sin(phi) * Math.sin(theta),
             r * Math.cos(phi)
          );
       });
    }
  }, [shape, particles]);

  useFrame((state) => {
    if (!points.current) return;
    const positions = points.current.geometry.attributes.position.array;
    const time = state.clock.elapsedTime;

    // --- 1. SYSTEMATIC COLOR CHANGE (Rainbow Mode) ---
    const currentColor = new THREE.Color(points.current.material.color);
    let targetColorObj;

    if (shape === "HEART") {
        // Auto-cycle Hue based on time
        const hue = (time * 0.1) % 1; // Slow rainbow cycle
        targetColorObj = new THREE.Color().setHSL(hue, 0.8, 0.5); 
    } else {
        // Use the specific stage color passed from App.jsx
        targetColorObj = new THREE.Color(color);
    }
    
    // Smooth transition
    currentColor.lerp(targetColorObj, 0.05);
    points.current.material.color.set(currentColor);


    // --- 2. ROTATION ---
    points.current.rotation.y += 0.002; 
    points.current.rotation.z = Math.sin(time * 0.5) * 0.05; 

    // --- 3. PARTICLE MOVEMENT ---
    particles.forEach((p, i) => {
      if (p.isDust) {
          // Dust floats endlessly
          p.current.add(p.drift);
          // Wrap around if too far (Infinite space effect)
          if (p.current.x > 40) p.current.x = -40;
          if (p.current.x < -40) p.current.x = 40;
          if (p.current.y > 40) p.current.y = -40;
          if (p.current.y < -40) p.current.y = 40;
      } else {
          // Main particles move to target
          p.current.lerp(p.target, 0.05);
      }

      // Heartbeat (Only affects Heart Particles in Heart Shape)
      if (shape === "HEART" && !p.isDust) {
        const beat = 1 + Math.pow(Math.sin(time * 3), 4) * 0.15; 
        
        // Correct scaling for the new offset (-2.5)
        const x = p.current.x * beat;
        const y = (p.current.y + 2.5) * beat - 2.5; // Shift up, scale, shift down
        const z = p.current.z * beat;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      } else {
        positions[i * 3] = p.current.x;
        positions[i * 3 + 1] = p.current.y;
        positions[i * 3 + 2] = p.current.z;
      }
    });
    
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(totalCount * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.2} 
        color="#ff007f"
        transparent 
        opacity={0.8} 
        blending={THREE.AdditiveBlending} 
      />
    </points>
  );
};