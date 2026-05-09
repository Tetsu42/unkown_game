import { Scene, manager } from '@tialops/maki'
import GlitchEffect from '../effects/GlitchEffect.js'
import Cat from '../Cat.js'

//les messages
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

const ROOM_BOUNDS = {
    left: 80,
    right: 720,
    top: 50,
    bottom: 450
}

export default class GameScene extends Scene {
    constructor() {
        super({ key: 'GameScene' })
    }

    preload() {
        super.preload()
        if (Array.isArray(this._makiPlayers)) {
            this._makiPlayers.length = 0
        }
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

        for (const item of FURNITURE_OBJECTS) {
            const textureKey = this.getFurnitureTextureKey(item.src)
            if (!this.textures.exists(textureKey)) {
                this.load.image(textureKey, `assets/${item.src}`)
            }
        }
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
        this.cat = new Cat(
            this,
            350,
            250,
            this.lia.sprite,
            wallGroup,
            () => this.interactables
        )
        this.physics.add.collider(this.cat, wallGroup)
        this.syncInteractableCatColliders()
    }

    initializeState() {
        this.interactables = []
        this.currentInteractable = null
        this.carriedInteractable = null
        this.dialogueActive = false
        this.dialogueLines = []
        this.dialogueIndex = 0
        this.introActive = false
        this.isTransitioning = false
        this.lastFacing = 'down'
        this.canPlaceCarriedObject = false
        this.catCatchDistance = 60
        this.caughtDistance = false
        this.catImmobilized = false
        this.fillProgress = 0
        this.fillMaxTime = 3000
    }

    update() {
        if (this.isTransitioning) {
            return
        }

        if (this.introActive) {
            this.lia.sprite.setVelocity(0)
            return
        }

        this.checkCatBounds()

        // Vérifier si on est dans une zone d'un interactable
        let found = null
        for (let i = 0; i < this.interactables.length; i++) {
            const zone = this.interactables[i]
            if (zone === this.carriedInteractable) continue
            const zoneBounds = zone.getBounds()
            const interactRange = new Phaser.Geom.Rectangle(
                zoneBounds.x - 18,
                zoneBounds.y - 18,
                zoneBounds.width + 36,
                zoneBounds.height + 36
            )
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.lia.sprite.getBounds(), interactRange)) {
                found = zone
                break
            }
        }
        this.currentInteractable = found

        this.interactPrompt.setText(found && !this.carriedInteractable
            ? `E : interagir | R : déplacer (${found.dialogueName || 'objet'})`
            : 'Appuie sur E pour parler')
        this.interactPrompt.setVisible(!!found && !this.dialogueActive && !this.carriedInteractable)

        if (this.dialogueActive) {
            this.lia.sprite.setVelocity(0)
            return
        }

        this.maki.move(this.lia)
        this.applyWasdMovement()
        this.updateCarriedObjectPosition()
        this.updateCatCatch()
        this.updateActionPrompt()
    }

    attemptCatchCat() {
        if (!this.cat) return

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

        this.caughtDistance = distance < this.catCatchDistance

        if (this.caughtDistance && this.catImmobilized) {
            this.fillProgress += this.game.loop.delta

            const gaugeFillWidth = (this.fillProgress / this.fillMaxTime) * 80
            this.gaugeFill.setDisplaySize(Math.min(gaugeFillWidth, 80), 8)
            this.gaugeBackground.x = this.cat.x
            this.gaugeBackground.y = this.cat.y - 40
            this.gaugeFill.x = this.gaugeBackground.x - 40
            this.gaugeFill.y = this.gaugeBackground.y
            this.gaugeBackground.setVisible(true)

            if (this.fillProgress >= this.fillMaxTime) {
                this.triggerVictory()
            }
        } else if (this.catImmobilized && !this.caughtDistance) {
            if (typeof this.cat.free === 'function') this.cat.free()
            this.catImmobilized = false
            this.fillProgress = 0
            this.gaugeFill.setDisplaySize(0, 8)
            this.gaugeBackground.setVisible(false)
        } else {
            this.gaugeFill.setDisplaySize(0, 8)
            this.gaugeBackground.setVisible(false)
        }
    }

    triggerVictory() {
        if (this.isTransitioning) {
            return
        }

        this.isTransitioning = true

        if (this.glitchRepeater) {
            this.glitchRepeater.remove()
        }

        if (this.cat) {
            this.cat.setVelocity(0, 0)
        }

        if (this.lia && this.lia.sprite) {
            this.lia.sprite.setVelocity(0, 0)
        }

        this.physics.world.pause()

        this.scene.start('VictoryScene')
    }
    
    applyWasdMovement() {
        const sprite = this.lia.sprite
        let moved = false

        if (this.keys.left.isDown) {
            sprite.setVelocityX(-this.lia.speed)
            sprite.anims.play(`${this.lia.name}-left`, true)
            this.lastFacing = 'left'
            moved = true
        } else if (this.keys.right.isDown) {
            sprite.setVelocityX(this.lia.speed)
            sprite.anims.play(`${this.lia.name}-right`, true)
            this.lastFacing = 'right'
            moved = true
        }

        if (this.keys.up.isDown) {
            sprite.setVelocityY(-this.lia.speed)
            sprite.anims.play(`${this.lia.name}-up`, true)
            this.lastFacing = 'up'
            moved = true
        } else if (this.keys.down.isDown) {
            sprite.setVelocityY(this.lia.speed)
            sprite.anims.play(`${this.lia.name}-down`, true)
            this.lastFacing = 'down'
            moved = true
        }

        if (!moved) {
            sprite.anims.stop()
        }
    }

    canStartDialogue() {
        return !!this.currentInteractable && !this.carriedInteractable
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

            this.createInteractable(item, dialogue.lines, dialogue.name)
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
        this.gaugeBackground = this.add.rectangle(0, 0, 80, 8, 0x333333, 0.8)
        this.gaugeBackground.setScrollFactor(1)
        this.gaugeBackground.setDepth(500)
        
        this.gaugeFill = this.add.rectangle(0, 0, 0, 8, 0x44ff44, 0.9)
        this.gaugeFill.setScrollFactor(1)
        this.gaugeFill.setDepth(501)
        this.gaugeFill.setOrigin(0, 0.5)
        
        this.catchPrompt = this.add.text(16, 16, '', {
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

        this.onSpaceDown = () => {
            if (this.introActive) {
                this.dismissIntro()
                return
            }

            if (!this.dialogueActive) {
                GlitchEffect.apply(this.lia.sprite, 300, 15)
            }
        }

        this.onEDown = () => {
            if (this.introActive) {
                this.dismissIntro()
                return
            }
            if (this.carriedInteractable) {
                return
            }
            if (this.dialogueActive) {
                this.advanceDialogue()
                return
            }

            if (this.canStartDialogue()) {
                this.startDialogue()
            }
        }

        this.onRDown = () => {
            if (this.introActive || this.dialogueActive || this.isTransitioning) {
                return
            }

            if (this.carriedInteractable) {
                this.placeCarriedObject()
                return
            }

            if (this.currentInteractable) {
                this.pickUpInteractable(this.currentInteractable)
                return
            }

            if (this.caughtDistance && !this.catImmobilized) {
                this.attemptCatchCat()
            }
        }

        this.input.keyboard.on('keydown-SPACE', this.onSpaceDown)
        this.input.keyboard.on('keydown-E', this.onEDown)
        this.input.keyboard.on('keydown-R', this.onRDown)
    }

    setupGlitchEffects() {
        this.glitchRepeater = this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: () => {
                if (!this.dialogueActive) {
                    GlitchEffect.applyRGBShift(this.lia.sprite, 500)
                }
            }
        })
    }

    setupShutdownCleanup() {
        this.events.once('shutdown', () => {
            if (this.glitchRepeater) this.glitchRepeater.remove()
            if (this.input?.keyboard) {
                if (this.onSpaceDown) this.input.keyboard.off('keydown-SPACE', this.onSpaceDown)
                if (this.onEDown) this.input.keyboard.off('keydown-E', this.onEDown)
                if (this.onRDown) this.input.keyboard.off('keydown-R', this.onRDown)
            }
            if (this.lia && this.lia.sprite) {
                this.lia.sprite.destroy()
            }
            if (this.cat) {
                this.cat.destroy()
            }

            for (const zone of this.interactables) {
                if (zone?.playerCollider) {
                    zone.playerCollider.destroy()
                }
                if (zone?.catCollider) {
                    zone.catCollider.destroy()
                }
                if (zone?.movableSprite && zone.createdMovableSprite) {
                    zone.movableSprite.destroy()
                }
            }

            this.cat = null
            this.currentInteractable = null
            this.carriedInteractable = null
            this.interactables = []
        })
    }

    getFurnitureTextureKey(src) {
        return `furniture:${src}`
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

    createInteractable(item, lines, name) {
        const zone = this.add.zone(item.x + (item.w / 2), item.y + (item.h / 2), item.w, item.h)
        zone.dialogueLines = Array.isArray(lines) ? lines : [lines]
        zone.dialogueName = name || 'Objet'
        zone.objectWidth = item.w
        zone.objectHeight = item.h
        zone.textureKey = this.getFurnitureTextureKey(item.src)
        zone.sourcePath = item.src
        zone.movableSprite = this.findExistingFurnitureSprite(item)
        zone.createdMovableSprite = false
        this.attachInteractablePhysics(zone)
        this.interactables.push(zone)
        this.ensureCatCollision(zone)
        return zone
    }

    // ✅ KEY FIX: Proper physics attachment
    attachInteractablePhysics(zone) {
        if (!zone) return

        if (!zone.body) {
            this.physics.world.enable(zone)
        } else if (!zone.body.enabled) {
            zone.body.enable = true
        }

        zone.body.setAllowGravity(false)
        zone.body.moves = false
        zone.body.immovable = true

        if (zone.body.setSize) {
            zone.body.setSize(zone.objectWidth, zone.objectHeight)
        }
        if (zone.body.updateFromGameObject) {
            zone.body.updateFromGameObject()
        }

        zone.playerCollider = this.physics.add.collider(this.lia.sprite, zone)
        this.ensureCatCollision(zone)
    }

    ensureCatCollision(zone) {
        if (!zone || !this.cat || !this.physics?.add?.collider) return

        if (zone.catCollider) {
            return
        }

        zone.catCollider = this.physics.add.collider(this.cat, zone)
    }

    syncInteractableCatColliders() {
        for (const zone of this.interactables) {
            this.ensureCatCollision(zone)
        }
    }

    findExistingFurnitureSprite(item) {
        const targetX = item.x + (item.w / 2)
        const targetY = item.y + (item.h / 2)
        const expectedKey = item.src

        const candidates = this.children.list.filter(obj => {
            if (!obj || typeof obj.x !== 'number' || typeof obj.y !== 'number') return false
            if (!obj.texture || typeof obj.texture.key !== 'string') return false
            const key = obj.texture.key
            if (!(key === expectedKey || key.endsWith(expectedKey))) return false
            return Math.abs(obj.x - targetX) <= 4 && Math.abs(obj.y - targetY) <= 4
        })

        return candidates.length ? candidates[0] : null
    }

    createMovableSpriteForZone(zone) {
        if (zone.movableSprite) {
            return zone.movableSprite
        }

        zone.movableSprite = this.add.rectangle(zone.x, zone.y, zone.objectWidth, zone.objectHeight, 0x87ceeb, 0.35)
        zone.movableSprite.setStrokeStyle(2, 0x7dd3fc, 0.95)
        zone.createdMovableSprite = true

        zone.movableSprite.setDepth(850)
        zone.movableSprite.setAlpha(0.9)
        return zone.movableSprite
    }

    // ✅ SIMPLIFIED: Keep body active so the cat still collides with the object
    pickUpInteractable(zone) {
        if (!zone) return
        if (this.dialogueActive) {
            this.endDialogue()
        }

        const sprite = this.createMovableSpriteForZone(zone)
        this.carriedInteractable = zone
        
        // ✅ Détruire le collider joueur
        if (zone.playerCollider) {
            zone.playerCollider.destroy()
            zone.playerCollider = null
        }
        
        // ✅ Garder le body actif pour préserver la collision avec le chat
        if (zone.body) {
            zone.body.enable = true
            zone.body.setAllowGravity(false)
            zone.body.moves = false
            zone.body.immovable = true
        }
        
        sprite.setDepth(900)
        sprite.setAlpha(0.62)
        this.updateCarriedObjectPosition()
    }

    updateCarriedObjectPosition() {
        if (!this.carriedInteractable) return

        const target = this.getCarryTargetPosition()
        const zone = this.carriedInteractable
        const sprite = this.createMovableSpriteForZone(zone)

        zone.setPosition(target.x, target.y)
        
        if (zone.body && zone.body.enabled) {
            try {
                if (typeof zone.body.reset === 'function') {
                    zone.body.reset(target.x, target.y)
                } else if (typeof zone.body.updateFromGameObject === 'function' && zone.body.gameObject) {
                    zone.body.updateFromGameObject()
                }
            } catch (e) {
                // ignore
            }
        }
        sprite.setPosition(target.x, target.y)

        this.canPlaceCarriedObject = this.isPlacementValid(zone, target.x, target.y)
        if (this.canPlaceCarriedObject) {
            if (typeof sprite.clearTint === 'function') sprite.clearTint()
            if (typeof sprite.setFillStyle === 'function') sprite.setFillStyle(0x7dd3fc, 0.35)
            sprite.setAlpha(0.62)
        } else {
            if (typeof sprite.setTint === 'function') sprite.setTint(0xff7a7a)
            if (typeof sprite.setFillStyle === 'function') sprite.setFillStyle(0xef4444, 0.45)
            sprite.setAlpha(0.55)
        }
    }

    getCarryTargetPosition() {
        const player = this.lia.sprite
        const closeOffset = 24
        const verticalAdjust = -8

        switch (this.lastFacing) {
            case 'left':
                return { x: player.x - closeOffset, y: player.y + verticalAdjust }
            case 'right':
                return { x: player.x + closeOffset, y: player.y + verticalAdjust }
            case 'up':
                return { x: player.x, y: player.y - 28 }
            default:
                return { x: player.x, y: player.y + 18 }
        }
    }

    // ✅ SIMPLIFIED: Just re-enable the zone physics
    placeCarriedObject() {
        if (!this.carriedInteractable) return

        const zone = this.carriedInteractable
        const sprite = this.createMovableSpriteForZone(zone)

        if (!this.canPlaceCarriedObject) {
            this.catchPrompt.setText('Impossible de poser ici')
            this.catchPrompt.setVisible(true)
            return
        }

        sprite.setDepth(850)
        if (typeof sprite.clearTint === 'function') sprite.clearTint()
        if (typeof sprite.setFillStyle === 'function') sprite.setFillStyle(0x87ceeb, 0.35)
        sprite.setAlpha(0.9)

        // ✅ Juste réactiver la physique de la zone
        this.attachInteractablePhysics(zone)

        this.carriedInteractable = null
        this.canPlaceCarriedObject = false
        this.catchPrompt.setVisible(false)
    }

    isPlacementValid(zone, centerX, centerY) {
        if (!zone) return false

        const width = zone.objectWidth
        const height = zone.objectHeight

        const candidate = new Phaser.Geom.Rectangle(
            centerX - width / 2,
            centerY - height / 2,
            width,
            height
        )

        if (
            candidate.left < ROOM_BOUNDS.left ||
            candidate.right > ROOM_BOUNDS.right ||
            candidate.top < ROOM_BOUNDS.top ||
            candidate.bottom > ROOM_BOUNDS.bottom
        ) {
            return false
        }

        const wallGroup = manager.getWallGroup(this, 'room1')
        const walls = wallGroup?.getChildren ? wallGroup.getChildren() : []
        for (const wall of walls) {
            if (!wall || typeof wall.getBounds !== 'function') continue
            const bounds = wall.getBounds()
            const wallRect = new Phaser.Geom.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height)
            if (Phaser.Geom.Intersects.RectangleToRectangle(candidate, wallRect)) {
                return false
            }
        }

        for (const otherZone of this.interactables) {
            if (!otherZone || otherZone === zone) continue
            const otherRect = new Phaser.Geom.Rectangle(
                otherZone.x - (otherZone.objectWidth / 2),
                otherZone.y - (otherZone.objectHeight / 2),
                otherZone.objectWidth,
                otherZone.objectHeight
            )
            if (Phaser.Geom.Intersects.RectangleToRectangle(candidate, otherRect)) {
                return false
            }
        }

        return true
    }

    updateActionPrompt() {
        if (this.introActive || this.dialogueActive) {
            this.catchPrompt.setVisible(false)
            return
        }

        if (this.carriedInteractable) {
            this.catchPrompt.setText(this.canPlaceCarriedObject ? 'Appuie sur R pour poser l\'objet' : 'Zone non plaçable')
            this.catchPrompt.setVisible(true)
            return
        }

        if (this.currentInteractable) {
            this.catchPrompt.setVisible(false)
            return
        }

        if (this.caughtDistance && !this.catImmobilized) {
            this.catchPrompt.setText('Appuie sur R pour attraper le chat')
            this.catchPrompt.setVisible(true)
            return
        }

        this.catchPrompt.setVisible(false)
    }

    startDialogue() {
        if (!this.currentInteractable) return

        this.dialogueActive = true
        this.dialogueIndex = 0
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
        if (!this.cat) return
        if (this.isTransitioning) return

        const ROOM_LEFT = ROOM_BOUNDS.left
        const ROOM_RIGHT = ROOM_BOUNDS.right
        const ROOM_TOP = ROOM_BOUNDS.top
        const ROOM_BOTTOM = ROOM_BOUNDS.bottom

        if (this.cat.x < ROOM_LEFT || 
            this.cat.x > ROOM_RIGHT || 
            this.cat.y < ROOM_TOP || 
            this.cat.y > ROOM_BOTTOM) {
            
            console.log(`Le chat s'est échappé à (${this.cat.x.toFixed(0)}, ${this.cat.y.toFixed(0)})! Game Over!`)
            this.triggerGameOver()
        }
    }

    triggerGameOver() {
        if (this.isTransitioning) {
            return
        }

        this.isTransitioning = true

        if (this.glitchRepeater) {
            this.glitchRepeater.remove()
        }

        if (this.cat) {
            this.cat.setVelocity(0, 0)
        }

        if (this.lia && this.lia.sprite) {
            this.lia.sprite.setVelocity(0, 0)
        }

        this.physics.world.pause()

        this.scene.start('GameOverScene')
    }
}