import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

type WorldEvent = {
  type: 'herb' | 'friend'
  message: string
}

type JadeSectWorldProps = {
  onWorldEvent: (event: WorldEvent) => void
}

const friends = [
  { name: 'Mimi', x: -3.8, z: -1.6, color: 0xffb7d8 },
  { name: 'Bao', x: 3.4, z: -2.1, color: 0xa9ffd2 },
  { name: 'Lulu', x: 1.8, z: 2.8, color: 0xffdc7d },
]

export function JadeSectWorld({ onWorldEvent }: JadeSectWorldProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const eventRef = useRef(onWorldEvent)
  const [hint, setHint] = useState('Move with WASD or arrow keys. Walk into herbs and friends.')

  useEffect(() => {
    eventRef.current = onWorldEvent
  }, [onWorldEvent])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x030907, 12, 28)

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, 8.2, 9.4)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const textureLoader = new THREE.TextureLoader()
    const heroTexture = textureLoader.load('/assets/cultivator-hero.png')
    const spiritTexture = textureLoader.load('/assets/peach-spirit.png')

    scene.add(new THREE.AmbientLight(0xbfffe0, 1.3))
    const moon = new THREE.DirectionalLight(0x88ffba, 2.8)
    moon.position.set(-4, 8, 6)
    scene.add(moon)

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(6.2, 6.8, 0.5, 64),
      new THREE.MeshStandardMaterial({
        color: 0x07140d,
        emissive: 0x062714,
        roughness: 0.7,
        metalness: 0.12,
      }),
    )
    platform.position.y = -0.28
    scene.add(platform)

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(6.25, 0.035, 10, 96),
      new THREE.MeshBasicMaterial({ color: 0x35f08f, transparent: true, opacity: 0.85 }),
    )
    ring.rotation.x = Math.PI / 2
    scene.add(ring)

    const path = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 5.3, 72, 1, 0.35, Math.PI * 1.75),
      new THREE.MeshBasicMaterial({ color: 0x10351f, transparent: true, opacity: 0.72, side: THREE.DoubleSide }),
    )
    path.rotation.x = -Math.PI / 2
    path.position.y = 0.012
    scene.add(path)

    const createSprite = (texture: THREE.Texture, scale: number) => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }))
      sprite.scale.set(scale, scale, 1)
      sprite.position.y = scale * 0.46
      return sprite
    }

    const player = createSprite(heroTexture, 1.45)
    player.position.set(0, player.position.y, 1.8)
    scene.add(player)

    const friendSprites = friends.map((friend) => {
      const group = new THREE.Group()
      const body = createSprite(spiritTexture, 1.06)
      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(0.46, 18, 18),
        new THREE.MeshBasicMaterial({ color: friend.color, transparent: true, opacity: 0.16 }),
      )
      aura.position.y = 0.62
      group.add(aura, body)
      group.position.set(friend.x, 0, friend.z)
      scene.add(group)
      return { ...friend, group }
    })

    const herbMaterial = new THREE.MeshStandardMaterial({ color: 0x35f08f, emissive: 0x11984e, roughness: 0.34 })
    const herbSpots = [
      new THREE.Vector3(-2.5, 0.15, 2.6),
      new THREE.Vector3(2.7, 0.15, 1.8),
      new THREE.Vector3(-0.7, 0.15, -3.2),
      new THREE.Vector3(4.2, 0.15, 0.1),
      new THREE.Vector3(-4.4, 0.15, -0.3),
    ]
    const herbs = herbSpots.map((position, index) => {
      const herb = new THREE.Group()
      const stem = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 6), herbMaterial)
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xb8ffd1, transparent: true, opacity: 0.58 }),
      )
      stem.position.y = 0.18
      glow.position.y = 0.55
      herb.add(stem, glow)
      herb.position.copy(position)
      herb.userData.id = index
      scene.add(herb)
      return herb
    })

    const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0x142a1b, transparent: true, opacity: 0.46 })
    for (let index = 0; index < 16; index += 1) {
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.65 + Math.random() * 0.8, 14, 10), cloudMaterial)
      const angle = (index / 16) * Math.PI * 2
      cloud.position.set(Math.cos(angle) * (7.4 + Math.random() * 4), -0.5 - Math.random(), Math.sin(angle) * (7.4 + Math.random() * 4))
      cloud.scale.y = 0.28
      scene.add(cloud)
    }

    const keys = new Set<string>()
    const onKeyDown = (event: KeyboardEvent) => keys.add(event.key.toLowerCase())
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase())
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const clock = new THREE.Clock()
    const collected = new Set<number>()
    let frame = 0
    let lastFriend = ''

    const popHint = (message: string) => {
      setHint(message)
      window.setTimeout(() => setHint('Move with WASD or arrow keys. Walk into herbs and friends.'), 2600)
    }

    const animate = () => {
      frame = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.04)
      const speed = 3.15 * delta
      const movement = new THREE.Vector3()
      if (keys.has('w') || keys.has('arrowup')) movement.z -= speed
      if (keys.has('s') || keys.has('arrowdown')) movement.z += speed
      if (keys.has('a') || keys.has('arrowleft')) movement.x -= speed
      if (keys.has('d') || keys.has('arrowright')) movement.x += speed
      player.position.add(movement)
      const distance = Math.hypot(player.position.x, player.position.z)
      if (distance > 5.45) {
        player.position.x = (player.position.x / distance) * 5.45
        player.position.z = (player.position.z / distance) * 5.45
      }
      player.position.y = 0.67 + Math.sin(clock.elapsedTime * 4) * 0.035

      herbs.forEach((herb) => {
        herb.rotation.y += delta * 1.8
        herb.position.y = 0.15 + Math.sin(clock.elapsedTime * 3 + herb.userData.id) * 0.04
        if (!collected.has(herb.userData.id) && player.position.distanceTo(herb.position) < 0.72) {
          collected.add(herb.userData.id)
          herb.visible = false
          popHint('+1 spirit herb. Tiny qi sparkle acquired.')
          eventRef.current({ type: 'herb', message: 'You picked a glowing spirit herb. So precious.' })
        }
      })

      friendSprites.forEach((friend, index) => {
        friend.group.position.x = friend.x + Math.sin(clock.elapsedTime + index) * 0.18
        friend.group.position.z = friend.z + Math.cos(clock.elapsedTime * 0.8 + index) * 0.18
        friend.group.rotation.y += delta * 0.8
        if (player.position.distanceTo(friend.group.position) < 0.9 && lastFriend !== friend.name) {
          lastFriend = friend.name
          popHint(`${friend.name} says: cultivation buddies forever.`)
          eventRef.current({ type: 'friend', message: `${friend.name} gave you a tiny respectful bow.` })
          window.setTimeout(() => {
            lastFriend = ''
          }, 1700)
        }
      })

      ring.rotation.z += delta * 0.12
      camera.position.x += (player.position.x * 0.22 - camera.position.x) * 0.035
      camera.lookAt(player.position.x * 0.22, 0, 0)
      renderer.render(scene, camera)
    }
    animate()

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      platform.geometry.dispose()
      ring.geometry.dispose()
      path.geometry.dispose()
      herbMaterial.dispose()
      cloudMaterial.dispose()
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
