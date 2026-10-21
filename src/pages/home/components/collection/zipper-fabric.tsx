import * as THREE from 'three'
import { vertexShader, fragmentShader } from './shaders'

export interface FabricState {
    sliderY: number
    offset: number
    part: number
    velocity: number
    time: number
}

export function createZipperFabric(canvas: HTMLCanvasElement) {
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
        powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const uniforms = {
        uRes: { value: new THREE.Vector2(1, 1) },
        uDpr: { value: 1 },
        uSliderY: { value: 1.06 },
        uOffset: { value: 0 },
        uPart: { value: 0 },
        uVel: { value: 0 },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    }

    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        blending: THREE.NoBlending,
        depthTest: false,
        depthWrite: false,
    })
    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    scene.add(mesh)

    const resize = () => {
        const w = canvas.clientWidth
        const h = canvas.clientHeight
        if (!w || !h) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        renderer.setPixelRatio(dpr)
        renderer.setSize(w, h, false)
        uniforms.uRes.value.set(w * dpr, h * dpr)
        uniforms.uDpr.value = dpr
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const mouseTarget = new THREE.Vector2(0.5, 0.5)

    return {
        setMouse(x: number, y: number) {
            mouseTarget.set(x, y)
        },
        render(s: FabricState) {
            uniforms.uSliderY.value = s.sliderY
            uniforms.uOffset.value = s.offset
            uniforms.uPart.value = s.part
            uniforms.uVel.value = s.velocity
            uniforms.uTime.value = s.time
            uniforms.uMouse.value.lerp(mouseTarget, 0.1)
            renderer.render(scene, camera)
        },
        dispose() {
            ro.disconnect()
            geometry.dispose()
            material.dispose()
            renderer.dispose()
        },
    }
}