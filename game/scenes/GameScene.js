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

        // Défaut de vitesse si l'objet joueur ne fournit pas `speed`
        if (typeof this.lia.speed === 'undefined') this.lia.speed = 150

        // Place lia in the center of the map (50×50 tiles × 32px = 1600×1600)
        this.lia.sprite.setPosition(200, 200)

        //ajust la taille du sprite
        this.lia.sprite.setScale(0.5)

   
        // Hitbox ajustée pour la nouvelle échelle (mettre à jour si vous changez le scale)
        const sprite = this.lia.sprite
        sprite.body.setSize(25, 46)
        sprite.body.setOffset(3, 20)
        


        this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'room1'))

        this.dialogueLines = [
            'You seem honest, my friend.',
            'Why then is your sword so bloody?',
            'Is that so?'
        ]
        this.dialogueIndex = 0
        this.dialogueActive = false

        // Système d'interactables: on peut attacher des boîtes de dialogue à des objets
        this.interactables = []
        this.currentInteractable = null

        // Helper: crée une zone d'interaction alignée sur l'objet réel de la map.
        // x/y ici sont les coordonnées haut-gauche du sprite dans le JSON.
        this.createInteractable = (x, y, w, h, lines, name) => {
            const zone = this.add.zone(x + (w / 2), y + (h / 2), w, h)
            this.physics.world.enable(zone)
            zone.body.setAllowGravity(false)
            zone.body.moves = false
            zone.dialogueLines = Array.isArray(lines) ? lines : [lines]
            zone.dialogueName = name || 'Objet'
            this.interactables.push(zone)
            return zone
        }

        // Zones alignées sur les objets du layer furniture de `room1.json`
        const furnitureDialogues = {
            'random/piano.png': {
                name: 'Piano',
                lines: [
                    'C\'est un vieux piano.',
                    'Il semble encore pouvoir jouer une douce mélodie.'
                ]
            },
            'random/plants.png': {
                name: 'Vase de fleurs',
                lines: [
                    'Un vase avec de jolies fleurs.',
                    'Ça apporte un peu de vie à cette pièce.'
                ]
            },
            'random/harp.png': {
                name: 'Harpe',
                lines: [
                    'Une harpe élégante.',
                    'Tu as envie de la toucher, mais tu hésites.'
                ]
            },
            'bedroom/queenbed.png': {
                name: 'Lit',
                lines: ['Un grand lit confortable.']
            },
            'bedroom/lamp.png': {
                name: 'Lampe',
                lines: ['Une lampe qui éclaire faiblement la pièce.']
            },
            'bedroom/doll.png': {
                name: 'Poupée',
                lines: ['Une poupée immobile. Son regard est un peu étrange.']
            },
            'bedroom/bed.png': {
                name: 'Petit lit',
                lines: ['Un petit lit. Il semble avoir déjà servi longtemps.']
            }
        }

        const furnitureObjects = [
            { src: 'random/piano.png', x: 112, y: 112, w: 32, h: 48 },
            { src: 'bedroom/queenbed.png', x: 640, y: 128, w: 32, h: 48 },
            { src: 'bedroom/chair.png', x: 624, y: 304, w: 32, h: 32 },
            { src: 'bedroom/chairleft.png', x: 656, y: 320, w: 16, h: 32 },
            { src: 'bedroom/chairright.png', x: 608, y: 320, w: 16, h: 32 },
            { src: 'bedroom/lamp.png', x: 672, y: 112, w: 16, h: 48 },
            { src: 'bedroom/doll.png', x: 656, y: 176, w: 32, h: 32 },
            { src: 'random/harp.png', x: 496, y: 192, w: 32, h: 32 },
            { src: 'random/plants.png', x: 304, y: 176, w: 32, h: 48 },
            { src: 'bedroom/bed.png', x: 496, y: 304, w: 16, h: 48 }
        ]

        for (const item of furnitureObjects) {
            const dialogue = furnitureDialogues[item.src]
            if (!dialogue) continue

            this.createInteractable(item.x, item.y, item.w, item.h, dialogue.lines, dialogue.name)
        }

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
        // Vérifier si on est dans une zone d'un interactable
        let found = null
        for (let i = 0; i < this.interactables.length; i++) {
            const zone = this.interactables[i]
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.lia.sprite.getBounds(), zone.getBounds())) {
                found = zone
                break
            }
        }
        this.currentInteractable = found

        this.interactPrompt.setText(found
            ? `Appuie sur E pour parler à ${found.dialogueName || 'cet objet'}`
            : 'Appuie sur E pour parler')
        this.interactPrompt.setVisible(!!found && !this.dialogueActive)

        if (this.dialogueActive) {
            this.lia.sprite.setVelocity(0)
            return
        }

        // mouvement via WASD
        // reset velocity then apply axis-specific velocities so diagonal movement works
        this.lia.sprite.setVelocity(0)
        if (this.keys.left.isDown) {
            this.lia.sprite.setVelocityX(-this.lia.speed)
        }
        if (this.keys.right.isDown) {
            this.lia.sprite.setVelocityX(this.lia.speed)
        }
        if (this.keys.up.isDown) {
            this.lia.sprite.setVelocityY(-this.lia.speed)
        }
        if (this.keys.down.isDown) {
            this.lia.sprite.setVelocityY(this.lia.speed)
        }

        // mouvement via flèches directionnelles (séparé)
        this.maki.move(this.lia)
    }

    canStartDialogue() {
        return !!this.currentInteractable
    }

    startDialogue() {
        if (!this.currentInteractable) return

        this.dialogueActive = true
        this.dialogueIndex = 0
        // Charger les lignes et le nom depuis l'interactable
        this.dialogueLines = this.currentInteractable.dialogueLines || []
        this.dialogueName.setText(this.currentInteractable.dialogueName || 'Objet')
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
        // Le nom est déjà défini depuis l'interactable lors de startDialogue()
        this.dialogueText.setText(this.dialogueLines[this.dialogueIndex])
        this.dialogueHint.setText(
            this.dialogueIndex === this.dialogueLines.length - 1
                ? 'Espace pour fermer'
                : 'Espace pour continuer'
        )
    }
}
