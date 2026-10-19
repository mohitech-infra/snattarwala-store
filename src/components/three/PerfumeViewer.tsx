"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stage, useGLTF } from "@react-three/drei"
import { Suspense, useState } from "react"
import { Loader2 } from "lucide-react"

interface PerfumeViewerProps {
  modelUrl?: string
  fallbackImageUrl?: string
  autoRotate?: boolean
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

export function PerfumeViewer({ modelUrl, fallbackImageUrl, autoRotate = true }: PerfumeViewerProps) {
  const [modelError, setModelError] = useState(false)

  if (!modelUrl || modelError) {
    if (fallbackImageUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-secondary/50 rounded-lg overflow-hidden">
          <img src={fallbackImageUrl} alt="Perfume" className="w-full h-full object-cover" />
        </div>
      )
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary/50 rounded-lg">
        <span className="text-muted-foreground font-heading">3D Model Unavailable</span>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-transparent">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      }>
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 45 }}>
          <Stage environment="city" intensity={0.5}>
            <Model url={modelUrl} />
          </Stage>
          <OrbitControls 
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 2.5}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
