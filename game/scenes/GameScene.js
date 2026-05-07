import { Scene, manager } from '@tialops/maki'
import GlitchEffect from '../effects/GlitchEffect.js'

const FURNITURE_DIALOGUES = {
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

const FURNITURE_OBJECTS = [
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

        this.setupPlayer()
        this.setupInteractables()
        this.setupDialogueUi()
        this.setupIntroUi()
        this.setupInput()
        this.setupGlitchEffects()
        this.setupShutdownCleanup()
    }

    update() {
        if (this.introActive) {
            this.lia.sprite.setVelocity(0)
            return
        }

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

    setupPlayer() {
        if (typeof this.lia.speed === 'undefined') this.lia.speed = 150

        this.lia.sprite.setPosition(200, 200)
        this.lia.sprite.setScale(0.5)

        const sprite = this.lia.sprite
        sprite.body.setSize(25, 46)
        sprite.body.setOffset(3, 20)

        this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'room1'))
    }

    setupInteractables() {
        for (const item of FURNITURE_OBJECTS) {
            const dialogue = FURNITURE_DIALOGUES[item.src]
            if (!dialogue) continue

            this.createInteractable(item.x, item.y, item.w, item.h, dialogue.lines, dialogue.name)
        }
    }

    setupDialogueUi() {
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

        this.dialoguePanel = this.createOverlayPanel(130)
        this.dialogueName = this.createOverlayLabel(448, 'Red')
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
    }

    setupIntroUi() {
        this.introActive = true
        this.introPanel = this.createOverlayPanel(150)
        this.introTitle = this.createOverlayLabel(448, 'Avertissement')
        this.introText = this.add.text(70, 480, 'Bienvenue, joueur. Vous êtes tombé dans un monde en pleine défaillance, où chaque bug raconte une histoire. Pour vous en sortir, il faudra réparer ce chaos en résolvant toutes les erreurs.', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            wordWrap: { width: 650 }
        })
        this.introText.setScrollFactor(0)
        this.introText.setDepth(1001)
        this.introText.setVisible(true)

        this.introHint = this.add.text(650, 598, 'E ou Espace pour commencer', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#cbd5e1'
        })
        this.introHint.setScrollFactor(0)
        this.introHint.setDepth(1001)
        this.introHint.setOrigin(0, 1)
        this.introHint.setVisible(true)
    }

    setupInput() {
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E
        })

        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.introActive) {
                this.dismissIntro()
                return
            }
            console.log('Glitch applied!')
            if (!this.dialogueActive) {
                GlitchEffect.apply(this.lia.sprite, 300, 15)
            }
        })

        this.input.keyboard.on('keydown-E', () => {
            if (this.introActive) {
                this.dismissIntro()
                return
            }
            if (this.dialogueActive) {
                this.advanceDialogue()
                return
            }

            if (this.canStartDialogue()) {
                this.startDialogue()
            }
        })
    }

    setupGlitchEffects() {
        GlitchEffect.applyRGBShift(this.lia.sprite, 500)

        this.glitchRepeater = this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: () => {
                if (!this.dialogueActive) {
                    GlitchEffect.apply(this.lia.sprite, 300, 15)
                }
            }
        })
    }

    setupShutdownCleanup() {
        this.events.on('shutdown', () => {
            if (this.glitchRepeater) this.glitchRepeater.remove()
        })
    }

    createOverlayPanel(height) {
        const panel = this.add.rectangle(400, 500, 760, height, 0x111827, 0.92)
        panel.setScrollFactor(0)
        panel.setDepth(1000)
        panel.setStrokeStyle(2, 0x9ca3af, 1)
        panel.setVisible(true)
        return panel
    }

    createOverlayLabel(y, text) {
        const label = this.add.text(70, y, text, {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#fcd34d'
        })
        label.setScrollFactor(0)
        label.setDepth(1001)
        label.setVisible(true)
        return label
    }

    createInteractable(x, y, w, h, lines, name) {
        const zone = this.add.zone(x + (w / 2), y + (h / 2), w, h)
        this.physics.world.enable(zone)
        zone.body.setAllowGravity(false)
        zone.body.moves = false
        zone.dialogueLines = Array.isArray(lines) ? lines : [lines]
        zone.dialogueName = name || 'Objet'
        this.interactables.push(zone)
        return zone
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

    dismissIntro() {
        this.introActive = false
        this.introPanel.setVisible(false)
        this.introTitle.setVisible(false)
        this.introText.setVisible(false)
        this.introHint.setVisible(false)
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
