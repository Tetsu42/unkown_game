import { Scene, manager } from '@tialops/maki'
import GlitchEffect from '../effects/GlitchEffect.js'

export default class GameScene extends Scene {
    preload() {
        super.preload()
        this.lia = this.maki.player('lia')
        manager.map(this, 'room1')
        manager.preload(this)
    }

    create() {
        super.create()
        manager.create(this)

        // Place lia in the center of the map (50×50 tiles × 16px = 800×800)
        this.lia.sprite.setPosition(400, 400)

        this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'room1'))

        this.dialogueLines = [
            'You seem honest, my friend.',
            'Why then is your sword so bloody?',
            'Is that so?'
        ]
        this.dialogueIndex = 0
        this.dialogueActive = false
        this.dialogueZone = this.add.zone(448, 400, 96, 96)
        this.physics.world.enable(this.dialogueZone)
        this.dialogueZone.body.setAllowGravity(false)
        this.dialogueZone.body.moves = false

        this.interactPrompt = this.add.text(16, 16, 'Appuie sur E pour parler', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            padding: { x: 10, y: 6 }
        })
        this.interactPrompt.setScrollFactor(0)
        this.interactPrompt.setDepth(1000)
        this.interactPrompt.setVisible(false)

        this.dialoguePanel = this.add.rectangle(400, 500, 760, 130, 0x111827, 0.92)
        this.dialoguePanel.setScrollFactor(0)
        this.dialoguePanel.setDepth(1000)
        this.dialoguePanel.setStrokeStyle(2, 0x9ca3af, 1)
        this.dialoguePanel.setVisible(false)

        this.dialogueName = this.add.text(70, 448, 'Red', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#fcd34d'
        })
        this.dialogueName.setScrollFactor(0)
        this.dialogueName.setDepth(1001)
        this.dialogueName.setVisible(false)

        this.dialogueText = this.add.text(70, 480, '', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            wordWrap: { width: 650 }
        })
        this.dialogueText.setScrollFactor(0)
        this.dialogueText.setDepth(1001)
        this.dialogueText.setVisible(false)

        this.dialogueHint = this.add.text(650, 588, 'E pour continuer', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#cbd5e1'
        })
        this.dialogueHint.setScrollFactor(0)
        this.dialogueHint.setDepth(1001)
        this.dialogueHint.setOrigin(0, 1)
        this.dialogueHint.setVisible(false)

        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E
        })

        // ===== EXEMPLES D'EFFETS GLITCH =====
        
        // Appui sur SPACE pour appliquer un glitch court
        this.input.keyboard.on('keydown-SPACE', () => {
            console.log('Glitch applied!') 
            if (!this.dialogueActive) {
                GlitchEffect.apply(this.lia.sprite, 300, 15)
            }
        })

        this.input.keyboard.on('keydown-E', () => {
            if (this.dialogueActive) {
                this.advanceDialogue()
                return
            }

            if (this.canStartDialogue()) {
                this.startDialogue()
            }
        })
        
        // Décommente pour appliquer un glitch au démarrage:
        // GlitchEffect.apply(this.lia.sprite, 300, 10)
        
        // Décommente pour un glitch continu qui démarre au démarrage:
        // this.glitchTimer = GlitchEffect.startContinuous(this.lia.sprite, 8)
        
        //effet RGB shift:
        GlitchEffect.applyRGBShift(this.lia.sprite, 500)
        
        //effet corruption:
        // GlitchEffect.applyCorruption(this.lia.sprite, 600)

        // Lancer un glitch toutes les 10 secondes (10000 ms)
        this.glitchRepeater = this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: () => {
                if (!this.dialogueActive) {
                    GlitchEffect.apply(this.lia.sprite, 300, 15)
                }
            }
        })

        // Nettoyage du timer à l'arrêt de la scène
        this.events.on('shutdown', () => {
            if (this.glitchRepeater) this.glitchRepeater.remove()
        })
    }

    update() {
        const inDialogueArea = Phaser.Geom.Intersects.RectangleToRectangle(
            this.lia.sprite.getBounds(),
            this.dialogueZone.getBounds()
        )

        this.interactPrompt.setVisible(inDialogueArea && !this.dialogueActive)

        if (this.dialogueActive) {
            this.lia.sprite.setVelocity(0)
            return
        }

        //mouvement via WASD 
        if (this.keys.left.isDown) {
            this.lia.sprite.setVelocityX(-this.lia.speed)
        }else if (this.keys.right.isDown) {
            this.lia.sprite.setVelocityX(this.lia.speed)
        } else if (this.keys.up.isDown) {
            this.lia.sprite.setVelocityY(-this.lia.speed)
        } else if (this.keys.down.isDown) {
            this.lia.sprite.setVelocityY(this.lia.speed)
        } else {
            this.lia.sprite.setVelocity(0)
        }

        //mouvement via flèches directionnelles
        this.maki.move(this.lia)
    }

    canStartDialogue() {
        const playerBounds = this.lia.sprite.getBounds()
        const triggerBounds = this.dialogueZone.getBounds()

        return Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, triggerBounds)
    }

    startDialogue() {
        this.dialogueActive = true
        this.dialogueIndex = 0
        this.refreshDialogueUI()
    }

    advanceDialogue() {
        this.dialogueIndex += 1

        if (this.dialogueIndex >= this.dialogueLines.length) {
            this.endDialogue()
            return
        }

        this.refreshDialogueUI()
    }

    endDialogue() {
        this.dialogueActive = false
        this.dialoguePanel.setVisible(false)
        this.dialogueName.setVisible(false)
        this.dialogueText.setVisible(false)
        this.dialogueHint.setVisible(false)
        this.interactPrompt.setVisible(false)
    }

    refreshDialogueUI() {
        this.dialoguePanel.setVisible(true)
        this.dialogueName.setVisible(true)
        this.dialogueText.setVisible(true)
        this.dialogueHint.setVisible(true)
        this.dialogueName.setText('Red')
        this.dialogueText.setText(this.dialogueLines[this.dialogueIndex])
        this.dialogueHint.setText(
            this.dialogueIndex === this.dialogueLines.length - 1
                ? 'Espace pour fermer'
                : 'Espace pour continuer'
        )
    }
}
