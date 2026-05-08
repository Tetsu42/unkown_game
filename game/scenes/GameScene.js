import { Scene, manager } from '@tialops/maki'
import GlitchEffect from '../effects/GlitchEffect.js'
import Cat from '../Cat.js'

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
        // Précharger les sprites du chat
        const directions = ['down', 'up', 'left', 'right']
        directions.forEach(dir => {
            for (let i = 1; i <= 6; i++) {
                this.load.image(`cat_${dir}${i}`, `assets/cat/${dir}/cat_${dir}${i}.png`)
            }
        })
    }

    create() {
        super.create()
        manager.create(this)

        this.initializeState()
        this.setupPlayer()
        this.setupInteractables()
        this.setupDialogueUi()
        this.setupIntroUi()
        this.setupInput()
            this.setupCatchUi()
            this.setupGlitchEffects()
        this.setupShutdownCleanup()

        // Ajout du chat (le joueur est this.lia.sprite)
        const wallGroup = manager.getWallGroup(this, 'room1')
        this.cat = new Cat(this, 350, 250, this.lia.sprite, wallGroup)
        this.physics.add.collider(this.cat, wallGroup)
    }

    initializeState() {
        this.interactables = []
        this.currentInteractable = null
        this.dialogueActive = false
        this.dialogueLines = []
        this.dialogueIndex = 0
        this.introActive = false
            this.catCatchDistance = 100
            this.caughtDistance = false
            this.catImmobilized = false
            this.fillProgress = 0
            this.fillMaxTime = 3000 // 3 secondes pour remplir complètement
    }

    update() {
        if (this.introActive) {
            this.lia.sprite.setVelocity(0)
            return
        }

            // Vérifier si le chat est sorti de la pièce (Game Over)
            this.checkCatBounds()

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
            ? `Appuie sur E interagir avec ${found.dialogueName || 'cet objet'}`
            : 'Appuie sur E pour parler')
        this.interactPrompt.setVisible(!!found && !this.dialogueActive)

        if (this.dialogueActive) {
            this.lia.sprite.setVelocity(0)
            return
        }

        // mouvement via flèches géré par `maki.move`, puis surcharge par WASD
        this.maki.move(this.lia)
        this.applyWasdMovement()
        this.updateCatCatch()
    }


    attemptCatchCat() {
        if (!this.cat) return

        // Immobiliser le chat et démarrer la jauge
        if (typeof this.cat.immobilize === 'function') {
            this.cat.immobilize()
        }
        this.catImmobilized = true
        this.fillProgress = 0
        this.gaugeBackground.setVisible(true)
    }

    updateCatCatch() {
        if (!this.cat || !this.lia) return

        const distance = Phaser.Math.Distance.Between(
            this.cat.x, this.cat.y,
            this.lia.sprite.x, this.lia.sprite.y
        )

        // Vérifier si on est à proximité pour attraper
        this.caughtDistance = distance < this.catCatchDistance

        if (this.caughtDistance && this.catImmobilized) {
            // Remplir la jauge
            this.fillProgress += this.game.loop.delta

            // Mettre à jour la position et la largeur de la jauge
            const gaugeFillWidth = (this.fillProgress / this.fillMaxTime) * 80
            this.gaugeFill.setDisplaySize(Math.min(gaugeFillWidth, 80), 8)
            this.gaugeBackground.x = this.cat.x
            this.gaugeBackground.y = this.cat.y - 40
            this.gaugeFill.x = this.gaugeBackground.x - 40
            this.gaugeFill.y = this.gaugeBackground.y
            this.gaugeBackground.setVisible(true)

            // Vérifier si capture complète
            if (this.fillProgress >= this.fillMaxTime) {
                this.triggerVictory()
            }
        } else if (this.catImmobilized && !this.caughtDistance) {
            // Si le joueur s'éloigne, relâcher le chat
            if (typeof this.cat.free === 'function') this.cat.free()
            this.catImmobilized = false
            this.fillProgress = 0
            this.gaugeFill.setDisplaySize(0, 8)
            this.gaugeBackground.setVisible(false)
        } else {
            this.gaugeFill.setDisplaySize(0, 8)
            this.gaugeBackground.setVisible(false)
        }

        // Afficher la notification si près du chat
        if (this.caughtDistance && !this.dialogueActive) {
            this.catchPrompt.setText('Appuie sur R pour attraper le chat')
            this.catchPrompt.setVisible(true)
        } else {
            this.catchPrompt.setVisible(false)
        }
    }
    
    applyWasdMovement() {
        const sprite = this.lia.sprite
        let moved = false

        if (this.keys.left.isDown) {
            sprite.setVelocityX(-this.lia.speed)
            sprite.anims.play(`${this.lia.name}-left`, true)
            moved = true
        } else if (this.keys.right.isDown) {
            sprite.setVelocityX(this.lia.speed)
            sprite.anims.play(`${this.lia.name}-right`, true)
            moved = true
        }

        if (this.keys.up.isDown) {
            sprite.setVelocityY(-this.lia.speed)
            sprite.anims.play(`${this.lia.name}-up`, true)
            moved = true
        } else if (this.keys.down.isDown) {
            sprite.setVelocityY(this.lia.speed)
            sprite.anims.play(`${this.lia.name}-down`, true)
            moved = true
        }

        if (!moved) {
            sprite.anims.stop()
        }
    }

    canStartDialogue() {
        return !!this.currentInteractable
    }

    setupPlayer() {
        if (typeof this.lia.speed === 'undefined') this.lia.speed = 130

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
        this.dialoguePanel.setVisible(false)
        this.dialogueName = this.createOverlayLabel(448, 'Red')
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
    }

    setupCatchUi() {
        // Jauge de capture au-dessus du chat
        this.gaugeBackground = this.add.rectangle(0, 0, 80, 8, 0x333333, 0.8)
        this.gaugeBackground.setScrollFactor(1)
        this.gaugeBackground.setDepth(500)
        
        this.gaugeFill = this.add.rectangle(0, 0, 0, 8, 0x44ff44, 0.9)
        this.gaugeFill.setScrollFactor(1)
        this.gaugeFill.setDepth(501)
        this.gaugeFill.setOrigin(0, 0.5)
        
        // Notification de proximité
        this.catchPrompt = this.add.text(16, 50, '', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            padding: { x: 10, y: 6 }
        })
        this.catchPrompt.setScrollFactor(0)
        this.catchPrompt.setDepth(1000)
        this.catchPrompt.setVisible(false)
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
            e: Phaser.Input.Keyboard.KeyCodes.E,
            r: Phaser.Input.Keyboard.KeyCodes.R
        })

        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.introActive) {
                this.dismissIntro()
                return
            }

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
        this.input.keyboard.on('keydown-R', () => {
            if (this.caughtDistance && !this.catImmobilized) {
                this.attemptCatchCat()
            }
        })
    }

    setupGlitchEffects() {
        

        this.glitchRepeater = this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: () => {
                if (!this.dialogueActive) {
                    GlitchEffect.applyRGBShift(this.lia.sprite, 500)
                    // GlitchEffect.apply(this.lia.sprite, 300, 15)
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
        
        this.dialogueText.setText(this.dialogueLines[this.dialogueIndex])
        this.dialogueHint.setText(
            this.dialogueIndex === this.dialogueLines.length - 1
                ? 'Espace pour fermer'
                : 'Espace pour continuer'
        )
    }

        checkCatBounds() {
          
            const ROOM_WIDTH = 800
            const ROOM_HEIGHT = 800
            const CAT_ESCAPE_THRESHOLD = 32 

            if (!this.cat) return

            // check si le chat est sorti des limites de la pièce
            if (this.cat.x < -CAT_ESCAPE_THRESHOLD ||
                this.cat.x > ROOM_WIDTH + CAT_ESCAPE_THRESHOLD ||
                this.cat.y < -CAT_ESCAPE_THRESHOLD ||
                this.cat.y > ROOM_HEIGHT + CAT_ESCAPE_THRESHOLD) {

                console.log('Le chat s\'est échappé! Game Over!')
                this.triggerGameOver()
            }
        }

        triggerGameOver() {
            // Arrêter tous les événements et les  mouvements
            if (this.glitchRepeater) {
                this.glitchRepeater.remove()
            }

            if (this.cat) {
                this.cat.setVelocity(0, 0)
            }

            if (this.lia && this.lia.sprite) {
                this.lia.sprite.setVelocity(0, 0)
            }

           
            this.scene.start('GameOverScene')
        }
    }
