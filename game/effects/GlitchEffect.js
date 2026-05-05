/**
 * Effet glitch pour sprites Phaser
 * Crée un effet de bug/glitch avec déplacements aléatoires et distortions
 */
export class GlitchEffect {
    /**
     * Applique un effet glitch court à un sprite
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Le sprite à affecter
     * @param {number} duration - Durée de l'effet en ms (défaut: 300)
     * @param {number} intensity - Intensité du glitch en pixels (défaut: 10)
     */
    static apply(sprite, duration = 300, intensity = 10) {
        const scene = sprite.scene
        const originalX = sprite.x
        const originalY = sprite.y
        const originalAlpha = sprite.alpha
        
        const glitchSteps = Math.floor(duration / 30) // ~30ms par étape
        let step = 0
        
        const glitchInterval = scene.time.addTimer({
            delay: 30,
            callback: () => {
                if (step >= glitchSteps) {
                    glitchInterval.remove()
                    sprite.x = originalX
                    sprite.y = originalY
                    sprite.alpha = originalAlpha
                    return
                }
                
                // Déplacement aléatoire
                sprite.x = originalX + (Math.random() - 0.5) * intensity * 2
                sprite.y = originalY + (Math.random() - 0.5) * intensity * 2
                
                // Clignotement aléatoire
                sprite.alpha = Math.random() > 0.3 ? originalAlpha : originalAlpha * 0.5
                
                step++
            },
            loop: true
        })
    }

    /**
     * Lance un effet glitch continu
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Le sprite à affecter
     * @param {number} intensity - Intensité du glitch (défaut: 8)
     * @returns {Phaser.Time.TimerEvent} L'événement de timer pour arrêter le glitch
     */
    static startContinuous(sprite, intensity = 8) {
        const scene = sprite.scene
        const originalX = sprite.x
        const originalY = sprite.y
        
        return scene.time.addTimer({
            delay: 40,
            callback: () => {
                sprite.x = originalX + (Math.random() - 0.5) * intensity
                sprite.y = originalY + (Math.random() - 0.5) * intensity
                sprite.alpha = Math.random() > 0.2 ? 1 : 0.6
            },
            loop: true
        })
    }

    /**
     * Arrête un effet glitch continu
     * @param {Phaser.Time.TimerEvent} glitchTimer - Le timer retourné par startContinuous
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Le sprite
     */
    static stopContinuous(glitchTimer, sprite) {
        if (glitchTimer) {
            glitchTimer.remove()
            sprite.alpha = 1
        }
    }

    /**
     * Effet glitch avec effet de couleur RGB disturbed
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Le sprite
     * @param {number} duration - Durée en ms
     */
    static applyRGBShift(sprite, duration = 500) {
        const scene = sprite.scene
        const originalTint = sprite.tint

        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffffff]
        let colorIndex = 0
        
        const rgbInterval = scene.time.addTimer({
            delay: 50,
            callback: () => {
                sprite.setTint(colors[Math.floor(Math.random() * colors.length)])
                colorIndex++
                
                if (colorIndex * 50 >= duration) {
                    rgbInterval.remove()
                    sprite.setTint(originalTint)
                }
            },
            loop: true
        })
    }

    /**
     * Effet de "corruption" avec rotation et échelle
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Le sprite
     * @param {number} duration - Durée en ms
     */
    static applyCorruption(sprite, duration = 600) {
        const scene = sprite.scene
        const originalRotation = sprite.rotation
        const originalScale = sprite.scale
        
        scene.tweens.add({
            targets: sprite,
            rotation: originalRotation + Math.random() * 0.5,
            scale: originalScale * 1.1,
            duration: 100,
            ease: 'Power1.InOut',
            yoyo: true,
            repeat: Math.floor(duration / 200)
        })
    }
}

export default GlitchEffect
