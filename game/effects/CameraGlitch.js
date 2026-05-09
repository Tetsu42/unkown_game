import GlitchEffect from './GlitchEffect.js'

/**
 * Utilitaire d'effet "glitch" pour la caméra.
 * Combine : camera.shake + petit jitter de followOffset + overlay flicker + RGB shift sur sprites.
 */
export default class CameraGlitch {
    /**
     * Applique un effet de bug sur la caméra
     * @param {Phaser.Cameras.Scene2D.Camera} camera
     * @param {Phaser.Scene} scene
     * @param {Object} opts
     */
    static apply(camera, scene, opts = {}) {
        const duration = typeof opts.duration === 'number' ? opts.duration : 350
        const intensity = typeof opts.intensity === 'number' ? opts.intensity : 0.02
        const jitter = typeof opts.jitter === 'number' ? opts.jitter : 8
        const step = typeof opts.step === 'number' ? opts.step : 40
        const rgb = typeof opts.rgb === 'number' ? opts.rgb : 350

        // Secousse principale
        try { camera.shake(duration, intensity) } catch (e) { /* ignore */ }

        // Enregistrer follow offset si disponible
        const hasSetFollowOffset = typeof camera.setFollowOffset === 'function'
        const origFollowX = camera.followOffset ? camera.followOffset.x : 0
        const origFollowY = camera.followOffset ? camera.followOffset.y : 0

        // Overlay discret pour simuler scintillement / stutter
        const overlay = scene.add.rectangle(0, 0, camera.width, camera.height, 0xffffff, 0.02)
        overlay.setOrigin(0)
        overlay.setScrollFactor(0)
        overlay.setDepth(2000)
        overlay.x = camera.worldView.x
        overlay.y = camera.worldView.y

        const steps = Math.max(1, Math.ceil(duration / step))
        let count = 0

        const t = scene.time.addEvent({
            delay: step,
            loop: true,
            callback: () => {
                if (count++ >= steps) {
                    t.remove()
                    overlay.destroy()
                    try {
                        if (hasSetFollowOffset) camera.setFollowOffset(origFollowX, origFollowY)
                        else if (camera.followOffset) {
                            camera.followOffset.x = origFollowX
                            camera.followOffset.y = origFollowY
                        }
                    } catch (e) { }
                    return
                }

                // petit jitter de la caméra
                const rx = (Math.random() - 0.5) * jitter
                const ry = (Math.random() - 0.5) * (jitter * 0.6)
                try {
                    if (hasSetFollowOffset) camera.setFollowOffset(origFollowX + rx, origFollowY + ry)
                    else if (camera.followOffset) {
                        camera.followOffset.x = origFollowX + rx
                        camera.followOffset.y = origFollowY + ry
                    }
                } catch (e) { }

                // bouger l'overlay pour suivre la vue
                overlay.x = camera.worldView.x
                overlay.y = camera.worldView.y
                overlay.alpha = Math.random() > 0.6 ? 0.02 : 0.12

                // Parfois, appliquer un RGB shift sur des sprites importants
                try {
                    if (scene && scene.lia && Math.random() > 0.5) GlitchEffect.applyRGBShift(scene.lia.sprite, rgb)
                    if (scene && scene.cat && Math.random() > 0.75) GlitchEffect.applyRGBShift(scene.cat, rgb)
                } catch (e) { }
            }
        })

        return t
    }
}

export { CameraGlitch }
