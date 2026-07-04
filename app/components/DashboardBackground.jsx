"use client";

import ColorBends from './ColorBends';
import DotField from './DotField';

export default function DashboardBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-white overflow-hidden">
      {/* Interactive Dot Field Pattern */}
      <div className="absolute inset-0 opacity-[0.8] pointer-events-auto">
        <DotField
          dotRadius={1.2}
          dotSpacing={6}
          cursorRadius={150}
          cursorForce={0.45}
          bulgeOnly
          bulgeStrength={39}
          glowRadius={50}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom="#3a3e43"
          gradientTo="#ececf6"
          glowColor="transparent"
        />
      </div>

      {/* Color Bends Animated Background */}
      <div className="absolute inset-0 opacity-30 mix-blend-multiply">
        <ColorBends
          color="#feffff"
          speed={0.2}
          frequency={1.0}
          noise={0.15}
          bandWidth={0.14}
          rotation={90}
          fadeTop={0.75}
          iterations={1}
          intensity={1.3}
        />
      </div>
    </div>
  );
}
