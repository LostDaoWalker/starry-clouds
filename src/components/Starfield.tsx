import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function Starfield() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.z = 34

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    for (let index = 0; index < 520; index += 1) {
      positions.push((Math.random() - 0.5) * 90, (Math.random() - 0.5) * 52, (Math.random() - 0.5) * 70)
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0x55ff9c,
      size: 0.18,
      transparent: true,
      opacity: 0.78,
    })
    const stars = new THREE.Points(geometry, material)
    scene.add(stars)

    const cloudGeometry = new THREE.TorusKnotGeometry(7.8, 0.18, 120, 8)
    const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0x35f08f, wireframe: true, transparent: true, opacity: 0.18 })
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial)
    scene.add(cloud)

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', resize)

    let frame = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      stars.rotation.y += 0.0009
      stars.rotation.x += 0.00025
      cloud.rotation.x += 0.002
      cloud.rotation.y += 0.003
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      geometry.dispose()
      material.dispose()
      cloudGeometry.dispose()
      cloudMaterial.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div className="starfield" ref={mountRef} aria-hidden="true" />
}
