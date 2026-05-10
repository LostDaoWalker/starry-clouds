import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

type WorldEvent = {
  type: 'herb'
  message: string
}

type JadeSectWorldProps = {
  onWorldEvent: (event: WorldEvent) => void
}

export function JadeSectWorld({ onWorldEvent }: JadeSectWorldProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const eventRef = useRef(onWorldEvent)
  const [hint, setHint] = useState('WASD or arrows to move.')

  useEffect(() => {
    eventRef.current = onWorldEvent
  }, [onWorldEvent])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050907)

    const camera = new THREE.OrthographicCamera(-6, 6, 3.6, -3.6, 0.1, 50)
    camera.position.set(0, 8, 0)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 1))

    const textureLoader = new THREE.TextureLoader()
    const heroTexture = textureLoader.load('/assets/cultivator-hero.png')

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 6.4),
      new THREE.MeshBasicMaterial({ color: 0x07110b }),
    )
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)

    const player = new THREE.Sprite(new THREE.SpriteMaterial({ map: heroTexture, transparent: true }))
    player.scale.set(0.9, 0.9, 1)
    player.position.set(0, 0.56, 0.5)
    scene.add(player)

    const herb = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 18),
      new THREE.MeshBasicMaterial({ color: 0x8ddca7 }),
    )
    herb.rotation.x = -Math.PI / 2
    herb.position.set(2.2, 0.02, -1.2)
    scene.add(herb)

    const keys = new Set<string>()
    const onKeyDown = (event: KeyboardEvent) => keys.add(event.key.toLowerCase())
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase())
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    let frame = 0
    let collected = false
    const clock = new THREE.Clock()

    const animate = () => {
      frame = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.04)
      const speed = 2.8 * delta

      if (keys.has('w') || keys.has('arrowup')) player.position.z -= speed
      if (keys.has('s') || keys.has('arrowdown')) player.position.z += speed
      if (keys.has('a') || keys.has('arrowleft')) player.position.x -= speed
      if (keys.has('d') || keys.has('arrowright')) player.position.x += speed

      player.position.x = THREE.MathUtils.clamp(player.position.x, -5, 5)
      player.position.z = THREE.MathUtils.clamp(player.position.z, -2.8, 2.8)

      if (!collected && player.position.distanceTo(herb.position) < 0.65) {
        collected = true
        herb.visible = false
        setHint('Herb gathered.')
        eventRef.current({ type: 'herb', message: 'You picked one quiet spirit herb.' })
      }

      renderer.render(scene, camera)
    }
    animate()

    const resize = () => {
      const aspect = mount.clientWidth / mount.clientHeight
      camera.left = -3.6 * aspect
      camera.right = 3.6 * aspect
      camera.top = 3.6
      camera.bottom = -3.6
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    resize()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      floor.geometry.dispose()
      herb.geometry.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="world-wrap">
      <div className="world-canvas" ref={mountRef} />
      <div className="world-hint">{hint}</div>
    </div>
  )
}
