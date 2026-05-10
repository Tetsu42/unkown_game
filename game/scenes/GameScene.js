import { Scene, manager } from '@tialops/maki'
import GlitchEffect from '../effects/GlitchEffect.js'
import CameraGlitch from '../effects/CameraGlitch.js'
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
    'bedroom/chair.png': {
        name: 'Chaise',
        lines: ['Une chaise confortable. Parfait pour s\'asseoir un moment.']
    },
    'bedroom/chairleft.png': {
        name: 'Chaise gauche',
        lines: ['Un appui-bras de chaise. C\'est une partie d\'un ensemble.']
    },
    'bedroom/chairright.png': {
        name: 'Chaise droite',
        lines: ['Un appui-bras de chaise. C\'est une partie d\'un ensemble.']
    },
    'bedroom/doll.png': {
        name: 'Poupée',
        lines: ['Une poupée immobile. Son regard est un peu étrange.']
    },
    'random/harp.png': {
        name: 'Harpe',
        lines: [
            'Une harpe élégante.',
            'Tu as envie de la toucher, mais tu hésites.'
        ]
    },
    'bedroom/bed.png': {
        name: 'Petit lit',
        lines: ['Un petit lit. Il semble avoir déjà servi longtemps.']
    },
    'kitchen/food.png': {
        name: 'Nourriture',
        lines: ['De la nourriture. Ça sent bon.']
    },
    'random/guitar.png': {
        name: 'Guitare',
        lines: ['Une guitare. Peut-être que quelqu\'un la joue parfois.']
    },
    'bedroom/desk.png': {
        name: 'Bureau',
        lines: ['Un bureau de travail. Bien organisé.']
    },
    'random/canape.png': {
        name: 'Canapé',
        lines: ['Un canapé confortable pour se relaxer.']
    },
    'random/table.png': {
        name: 'Table',
        lines: ['Une table basse. Pratique pour poser les choses.']
    },
    'random/canape2.png': {
        name: 'Canapé 2',
        lines: ['Un autre canapé. Peut-être un endroit pour se reposer.']
    },
    'random/plants.png': {
        name: 'Vase de fleurs',
        lines: [
            'Un vase avec de jolies fleurs.',
            'Ça apporte un peu de vie à cette pièce.'
        ]
    },
    'bedroom/queenbed2.png': {
        name: 'Grand lit',
        lines: ['Un grand lit spacieux. Très confortable.']
    },
    'bedroom/mirror.png': {
        name: 'Miroir',
        lines: ['Un miroir. Tu y vois ton reflet.']
    },
    'bedroom/library.png': {
        name: 'Bibliothèque',
        lines: ['Une bibliothèque remplie de livres. Beaucoup de lectures possibles.']
    },
    'bedroom/chair2.png': {
        name: 'Chaise 2',
        lines: ['Une autre chaise. Confortable et pratique.']
    },
    'bedroom/lamp.png': {
        name: 'Lampe',
        lines: ['Une lampe qui éclaire faiblement la pièce.']
    },
    'bedroom/fenetre.png': {
        name: 'Fenêtre',
        lines: ['Une fenêtre. Elle donne sur l\'extérieur.']
    },
    'bedroom/rideau.png': {
        name: 'Rideau',
        lines: ['Un rideau. Il filtre la lumière du jour.']
    },
    'bedroom/bacon_dish.png': {
        name: 'Assiette de bacon',
        lines: ['Une assiette avec du bacon. Délicieux!']
    },
    'bedroom/burrito.png': {
        name: 'Burrito',
        lines: ['Un burrito savoureux. Ça donne faim!']
    }
}

const FURNITURE_OBJECTS = [
    { src: 'random/piano.png', x: 112, y: 112, w: 32, h: 48 },
    { src: 'bedroom/chair.png', x: 624, y: 304, w: 32, h: 32 },
    { src: 'bedroom/chairleft.png', x: 656, y: 320, w: 16, h: 32 },
    { src: 'bedroom/chairright.png', x: 608, y: 320, w: 16, h: 32 },
    { src: 'bedroom/doll.png', x: 656, y: 176, w: 32, h: 32 },
    { src: 'random/harp.png', x: 496, y: 192, w: 32, h: 32 },
    { src: 'bedroom/bed.png', x: 496, y: 304, w: 16, h: 48 },
    { src: 'kitchen/food.png', x: 672, y: 16, w: 16, h: 32 },
    { src: 'random/guitar.png', x: 544, y: 16, w: 16, h: 48 },
    { src: 'bedroom/desk.png', x: 640, y: 448, w: 32, h: 32 },
    { src: 'random/canape.png', x: 320, y: 224, w: 22, h: 46 },
    { src: 'random/table.png', x: 352, y: 224, w: 32, h: 32 },
    { src: 'random/canape2.png', x: 336, y: 192, w: 46, h: 32 },
    { src: 'random/plants.png', x: 176, y: 304, w: 32, h: 48 },
    { src: 'bedroom/queenbed2.png', x: 240, y: 528, w: 46, h: 60, movable: false },
    { src: 'bedroom/mirror.png', x: 752, y: 288, w: 16, h: 16 },
    { src: 'bedroom/library.png', x: 592, y: 432, w: 32, h: 43 },
    { src: 'bedroom/chair2.png', x: 656, y: 464, w: 16, h: 31 },
    { src: 'bedroom/lamp.png', x: 288, y: 512, w: 16, h: 48 },
    { src: 'bedroom/bacon_dish.png', x: 480, y: 576, w: 16, h: 16 },
    { src: 'bedroom/burrito.png', x: 112, y: 576, w: 16, h: 16 } 
]

const ASH_NPC = {
    texture: 'ash_front_face',
    x: 248,
    y: 200,
    w: 24,
    h: 42,
    name: 'Ash',
    lines: [
        'Hey, le bug de la caméra vient du chat qui fout le chaos...',
        'Pour régler ça, il faut l\'attraper.',
        'Bonne chance... tu vas en avoir besoin.'
    ]
}

const GIRL_NPC = {
    texture: 'girl1', // clé de texture (sans .png)
    x: 600,
    y: 500,
    w: 15,
    h: 20,
    name: 'Jeune fille',
    lines: [
        'Hé hé petite !',
        'Que dit un chat qui rentre dans une pharmacie ?',
        'Je voudrais du sirop pour matou (ma toux).'
    ]
}

const OLD_NPC = {
    texture: 'old',
    x: 580,
    y: 50,
    w: 24,
    h: 32,
    name: 'Vieil homme',
    lines: [
        'Tu veux capturer ce chat fugace ?',
        'Les chats aiment trois choses : dormir, jouer... et manger !',
        'Trouve de quoi lui remplir la panse, et il deviendra moins farouche...'
    ]
}





export default class GameScene extends Scene {
    constructor() {
        super({ key: 'GameScene' })
        // this.load.setAudioContext(window.AudioContext || window.webkitAudioContext);
    }

   preload() {
        super.preload()
        if (!this.textures.exists(GIRL_NPC.texture)) {
            this.load.image(GIRL_NPC.texture, '/sprites/girl1.png');
        }
        if (!this.textures.exists(OLD_NPC.texture)) {
            this.load.image(OLD_NPC.texture, '/sprites/old.png');
        }
        if (Array.isArray(this._makiPlayers)) {
            this._makiPlayers.length = 0
        }
        this.lia = this.maki.player('lia')
        manager.map(this, 'room1')
        manager.preload(this)

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

        if (!this.textures.exists(ASH_NPC.texture)) {
            this.load.image(ASH_NPC.texture, 'assets/sprites/ash_front_face.png')
        }
    }

    create() {

        super.create()
        
        // Vérifier et charger la musique de fond
        if (this.cache.audio.exists('bgMusic')) {
            if (!this.registry.get('musicPlaying')) {
                this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.5 });
                this.bgMusic.play();
                this.registry.set('musicPlaying', true);
            } else {
                this.bgMusic = this.sound.get('bgMusic');
            }
        } else {
            console.warn('La musique bgMusic n\'a pas été chargée. Tentative de rechargement...');
            // Fallback : recharger la musique si elle n'existe pas
            this.load.audio('bgMusic', '/CH-AY-NA.mp3?t=' + Date.now());
            this.load.once('filecomplete-audio-bgMusic', () => {
                this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.5 });
                this.bgMusic.play();
                this.registry.set('musicPlaying', true);
            });
            this.load.start();
        }
        manager.create(this)
        
        this.initializeState()
        this.setupPlayer()
        this.setupInteractables()
        this.setupAshNpc()
        this.setupGirlNpc();
        this.setupOldNpc();
        this.setupDialogueUi()
        this.setupIntroUi()
        this.setupInput()
        this.setupCatchUi()
        this.setupGlitchEffects()
        this.setupShutdownCleanup()

        const wallGroup = manager.getWallGroup(this, 'room1')
        this.computeRoomBounds(wallGroup)

        this.cat = new Cat(
            this,
            350,
            250,
            this.lia.sprite,
            wallGroup,
            () => this.interactables
        )
        this.physics.add.collider(this.cat, wallGroup)
        this.setupAshCollision()
        this.syncInteractableCatColliders()
    }

    initializeState() {
        this.interactables = []
        this.foodItems = []
        this.currentInteractable = null
        this.carriedInteractable = null
        this.catCatchActive = false
        this.dialogueActive = false
        this.dialogueLines = []
        this.dialogueIndex = 0
        this.introActive = false
        this.isTransitioning = false
        this.lastFacing = 'down'
        this.canPlaceCarriedObject = false
        this.catCatchDistance = 60
        this.caughtDistance = false
        this.fillProgress = 0
        this.fillMaxTime = 3000
         this.catchGraceTimer = 0
        this.roomBounds = { left: 0, right: 800, top: 0, bottom: 800 }
    }

    computeRoomBounds(wallGroup) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        const walls = wallGroup.getChildren()
        for (const wall of walls) {
            const bounds = wall.getBounds()
            minX = Math.min(minX, bounds.x)
            maxX = Math.max(maxX, bounds.x + bounds.width)
            minY = Math.min(minY, bounds.y)
            maxY = Math.max(maxY, bounds.y + bounds.height)
        }
        if (isFinite(minX)) {
            this.roomBounds = { left: minX, right: maxX, top: minY, bottom: maxY }
        }
    }

    update() {
        if (this.isTransitioning) return
        if (this.introActive) {
            this.lia.sprite.setVelocity(0)
            return
        }

        this.checkCatBounds()

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
            ? (found.isMovable === false
                ? `E : interagir (${found.dialogueName || 'objet'})`
                : `E : interagir | R : déplacer (${found.dialogueName || 'objet'})`)
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
    if (!this.cat) return;
    const dist = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, this.lia.sprite.x, this.lia.sprite.y);
    if (dist >= this.catCatchDistance) return;

    this.catCatchActive = true;
    this.fillProgress = 0;
    this.gaugeBackground.setVisible(true);
    this.gaugeFill.setVisible(true);
    this.gaugeFill.setSize(0, 8);            // largeur nulle au début
    this.updateGaugePosition();
    }   

    updateCatCatch() {
    if (!this.cat || !this.lia) return;

    const dist = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, this.lia.sprite.x, this.lia.sprite.y);
    this.caughtDistance = dist < this.catCatchDistance;

    // Grâce : on laisse un petit délai si le chat sort très brièvement
    if (!this.caughtDistance && this.catCatchActive) {
        this.catchGraceTimer = (this.catchGraceTimer || 0) - this.game.loop.delta;
        if (this.catchGraceTimer <= 0) {
            // annulation définitive
            this.catCatchActive = false;
            this.fillProgress = 0;
            this.gaugeBackground.setVisible(false);
            this.gaugeFill.setVisible(false);
            this.gaugeFill.setSize(0, 8);
            delete this.catchGraceTimer;
        }
        return;
    }

    //gauge

    if (this.catCatchActive && this.caughtDistance) {
    
        this.catchGraceTimer = 200;

        const delta = Math.min(this.game.loop.delta, 33);
        this.fillProgress += delta;
        const percent = Math.min(1, this.fillProgress / this.fillMaxTime);
        const width = percent * 80;
        this.gaugeFill.setSize(Math.max(2, width), 8); 
        this.updateGaugePosition();

        if (this.fillProgress >= this.fillMaxTime) {
            this.triggerVictory();
        }
    } else if (!this.catCatchActive && this.gaugeBackground.visible) {
        // nettoyage si la jauge est encore visible par erreur
        this.gaugeBackground.setVisible(false);
        this.gaugeFill.setVisible(false);
        this.gaugeFill.setSize(0, 8);
    }
    }

    updateGaugePosition() {
        if (!this.cat) return;
        // La jauge est centrée horizontalement sur le chat, à 40px au‑dessus
        this.gaugeBackground.x = this.cat.x;
        this.gaugeBackground.y = this.cat.y - 40;
        // Le remplissage commence au bord gauche de la jauge
        this.gaugeFill.x = this.gaugeBackground.x - 40;
        this.gaugeFill.y = this.gaugeBackground.y;
    }

    triggerVictory() {
        if (this.isTransitioning) return
        this.isTransitioning = true
        if (this.glitchRepeater) this.glitchRepeater.remove()
        if (this.cat) this.cat.setVelocity(0, 0)
        if (this.lia && this.lia.sprite) this.lia.sprite.setVelocity(0, 0)
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
        if (!moved) sprite.anims.stop()
    }

    canStartDialogue() {
        return !!this.currentInteractable && !this.carriedInteractable
    }

    setupPlayer() {
        if (typeof this.lia.speed === 'undefined') this.lia.speed = 110
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
            const zone = this.createInteractable(item, dialogue.lines, dialogue.name)
            if (this.isFoodItem(zone)) {
                this.foodItems.push(zone)
            }
        }
    }

    isFoodItem(zone) {
        const foodSrc = ['kitchen/food.png', 'bedroom/bacon_dish.png', 'bedroom/burrito.png']
        return zone && foodSrc.includes(zone.sourcePath)
    }
    eatFoodImmediately(zone) {
        const idx = this.interactables.indexOf(zone)
        if (idx !== -1) this.interactables.splice(idx, 1)
        const foodIdx = this.foodItems.indexOf(zone)
        if (foodIdx !== -1) this.foodItems.splice(foodIdx, 1)

        if (zone.movableSprite) zone.movableSprite.destroy()
        const existingImg = this.children.list.find(child =>
            child.texture && child.texture.key === zone.textureKey &&
            Math.abs(child.x - zone.x) < 5 && Math.abs(child.y - zone.y) < 5
        )
        if (existingImg) existingImg.destroy()
        zone.destroy()

        this.cat.foodCollected++
        if (this.cat.foodCollected >= 3) this.cat.becomeAggressive()

        this.catchPrompt.setText(`Le chat a mangé ! (${this.cat.foodCollected}/3)`)
        this.catchPrompt.setVisible(true)
        this.time.delayedCall(1500, () => this.catchPrompt.setVisible(false))
    }

    setupAshNpc() {
        this.ashSprite = this.add.image(ASH_NPC.x, ASH_NPC.y, ASH_NPC.texture)
        this.ashSprite.setScale(this.lia.sprite.scaleX, this.lia.sprite.scaleY)
        this.ashSprite.setDepth(this.lia.sprite.depth)
        this.physics.world.enable(this.ashSprite)
        this.ashSprite.body.setAllowGravity(false)
        this.ashSprite.body.setImmovable(true)
        this.ashSprite.body.moves = false

        const zone = this.add.zone(ASH_NPC.x, ASH_NPC.y, ASH_NPC.w, ASH_NPC.h)
        zone.dialogueLines = ASH_NPC.lines
        zone.dialogueName = ASH_NPC.name
        zone.objectWidth = ASH_NPC.w
        zone.objectHeight = ASH_NPC.h
        zone.isMovable = false
        zone.isNpc = true
        this.interactables.push(zone)
    }


    setupGirlNpc() {
        this.girlSprite = this.add.image(GIRL_NPC.x, GIRL_NPC.y, GIRL_NPC.texture);
        // this.girlSprite.setScale(this.lia.sprite.scaleX, this.lia.sprite.scaleY);
        this.girlSprite.setDepth(this.lia.sprite.depth);
        this.physics.world.enable(this.girlSprite);
        this.girlSprite.body.setAllowGravity(false);
        this.girlSprite.body.setImmovable(true);
        this.girlSprite.body.moves = false;

        const zone = this.add.zone(GIRL_NPC.x, GIRL_NPC.y, GIRL_NPC.w, GIRL_NPC.h);
        zone.dialogueLines = GIRL_NPC.lines;
        zone.dialogueName = GIRL_NPC.name;
        zone.objectWidth = GIRL_NPC.w;
        zone.objectHeight = GIRL_NPC.h;
        zone.isMovable = false;
        zone.isNpc = true;
        this.interactables.push(zone);
    }

    setupOldNpc() {
        this.oldSprite = this.add.image(OLD_NPC.x, OLD_NPC.y, OLD_NPC.texture);
        this.oldSprite.setScale(this.lia.sprite.scaleX, this.lia.sprite.scaleY);
        this.oldSprite.setDepth(this.lia.sprite.depth);
        this.physics.world.enable(this.oldSprite);
        this.oldSprite.body.setAllowGravity(false);
        this.oldSprite.body.setImmovable(true);
        this.oldSprite.body.moves = false;

        const zone = this.add.zone(OLD_NPC.x, OLD_NPC.y, OLD_NPC.w, OLD_NPC.h);
        zone.dialogueLines = OLD_NPC.lines;
        zone.dialogueName = OLD_NPC.name;
        zone.objectWidth = OLD_NPC.w;
        zone.objectHeight = OLD_NPC.h;
        zone.isMovable = false;
        zone.isNpc = true;
        this.interactables.push(zone);
    }
    setupAshCollision() {
        if (!this.ashSprite || !this.cat || !this.lia?.sprite) return
        this.physics.add.collider(this.lia.sprite, this.ashSprite)
        this.physics.add.collider(this.cat, this.ashSprite)
        if (this.girlSprite) this.physics.add.collider(this.lia.sprite, this.girlSprite);
        if (this.girlSprite) this.physics.add.collider(this.cat, this.girlSprite);
        if (this.oldSprite) this.physics.add.collider(this.lia.sprite, this.oldSprite);
        if (this.oldSprite) this.physics.add.collider(this.cat, this.oldSprite);
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
    this.gaugeBackground = this.add.rectangle(0, 0, 80, 8, 0x333333, 0.8);
    this.gaugeBackground.setScrollFactor(1);
    this.gaugeBackground.setDepth(2000);       // plus haut pour être visible
    this.gaugeBackground.setVisible(false);

    this.gaugeFill = this.add.rectangle(0, 0, 0, 8, 0x44ff44, 0.9);
    this.gaugeFill.setOrigin(0, 0.5);          // ancre à gauche
    this.gaugeFill.setScrollFactor(1);
    this.gaugeFill.setDepth(2001);
    this.gaugeFill.setVisible(false);

    this.catchPrompt = this.add.text(16, 16, '', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        padding: { x: 10, y: 6 }
    });
    this.catchPrompt.setScrollFactor(0);
    this.catchPrompt.setDepth(1000);
    this.catchPrompt.setVisible(false);
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
    });

    this.onSpaceDown = () => {
        if (this.introActive) this.dismissIntro();
        else if (!this.dialogueActive) GlitchEffect.apply(this.lia.sprite, 300, 15);
    };

    this.onEDown = () => {
        if (this.introActive) this.dismissIntro();
        else if (this.carriedInteractable) return;
        else if (this.dialogueActive) this.advanceDialogue();
        else if (this.canStartDialogue()) this.startDialogue();
    };

    this.onRDown = () => {
    if (this.introActive || this.dialogueActive || this.isTransitioning) return;

    if (this.carriedInteractable) {
        this.placeCarriedObject();
        return;
    }

    if (this.currentInteractable) {
        if (this.currentInteractable.isMovable === false) {
            this.showFunnyMessage(`Tu n'as pas la force de déplacer ce ${this.currentInteractable.dialogueName}...`);
            return;
        }
        this.pickUpInteractable(this.currentInteractable);
        return;
    }

    // Capture du chat
    if (this.caughtDistance) {
        this.attemptCatchCat();
    }
    };

    this.input.keyboard.on('keydown-SPACE', this.onSpaceDown);
    this.input.keyboard.on('keydown-E', this.onEDown);
    this.input.keyboard.on('keydown-R', this.onRDown);
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
            if (this.girlSprite) this.girlSprite.destroy();
            if (this.oldSprite) this.oldSprite.destroy();
            if (this.glitchRepeater) this.glitchRepeater.remove()
            if (this.cameraGlitchRepeater) this.cameraGlitchRepeater.remove()
            if (this.input?.keyboard) {
                if (this.onSpaceDown) this.input.keyboard.off('keydown-SPACE', this.onSpaceDown)
                if (this.onEDown) this.input.keyboard.off('keydown-E', this.onEDown)
                if (this.onRDown) this.input.keyboard.off('keydown-R', this.onRDown)
            }
            if (this.lia && this.lia.sprite) this.lia.sprite.destroy()
            if (this.ashSprite) this.ashSprite.destroy()
            if (this.cat) this.cat.destroy()
            for (const zone of this.interactables) {
                if (zone?.playerCollider) zone.playerCollider.destroy()
                if (zone?.catCollider) zone.catCollider.destroy()
                if (zone?.movableSprite && zone.createdMovableSprite) zone.movableSprite.destroy()
            }
            this.cat = null
            this.currentInteractable = null
            this.carriedInteractable = null
            this.interactables = []
        })
    }

    getFurnitureTextureKey(src) { return `furniture:${src}` }  

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
        zone.isMovable = item.movable !== false
        zone.textureKey = this.getFurnitureTextureKey(item.src)
        zone.sourcePath = item.src
        zone.movableSprite = this.findExistingFurnitureSprite(item)
        zone.createdMovableSprite = false
        this.attachInteractablePhysics(zone)
        this.interactables.push(zone)
        this.ensureCatCollision(zone)
        return zone
    }

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
        if (zone.body.setSize) zone.body.setSize(zone.objectWidth, zone.objectHeight)
        if (zone.body.updateFromGameObject) zone.body.updateFromGameObject()
        zone.playerCollider = this.physics.add.collider(this.lia.sprite, zone)
        this.ensureCatCollision(zone)
    }

    ensureCatCollision(zone) {
        if (!zone || !this.cat || !this.physics?.add?.collider) return
        if (zone.catCollider) return
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
        if (zone.movableSprite) return zone.movableSprite
        zone.movableSprite = this.add.rectangle(zone.x, zone.y, zone.objectWidth, zone.objectHeight, 0x87ceeb, 0.35)
        zone.movableSprite.setStrokeStyle(2, 0x7dd3fc, 0.95)
        zone.createdMovableSprite = true
        zone.movableSprite.setDepth(850)
        zone.movableSprite.setAlpha(0.9)
        return zone.movableSprite
    }

    pickUpInteractable(zone) {
        if (!zone) return
        if (zone.isMovable === false) {
            this.catchPrompt.setText('C\'est trop lourd... Tu n\'as pas la force!')
            this.catchPrompt.setVisible(true)
            this.time.delayedCall(2000, () => this.catchPrompt.setVisible(false))
            return
        }
        if (this.dialogueActive) this.endDialogue()

        const sprite = this.createMovableSpriteForZone(zone)
        this.carriedInteractable = zone
        if (zone.playerCollider) {
            zone.playerCollider.destroy()
            zone.playerCollider = null
        }
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
                if (typeof zone.body.reset === 'function') zone.body.reset(target.x, target.y)
                else if (typeof zone.body.updateFromGameObject === 'function' && zone.body.gameObject) zone.body.updateFromGameObject()
            } catch (e) { }
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
            case 'left': return { x: player.x - closeOffset, y: player.y + verticalAdjust }
            case 'right': return { x: player.x + closeOffset, y: player.y + verticalAdjust }
            case 'up': return { x: player.x, y: player.y - 28 }
            default: return { x: player.x, y: player.y + 18 }
        }
    }

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
        const PADDING = 10
        if (candidate.left < this.roomBounds.left + PADDING ||
            candidate.right > this.roomBounds.right - PADDING ||
            candidate.top < this.roomBounds.top + PADDING ||
            candidate.bottom > this.roomBounds.bottom - PADDING) {
            return false
        }
        const wallGroup = manager.getWallGroup(this, 'room1')
        const walls = wallGroup?.getChildren ? wallGroup.getChildren() : []
        for (const wall of walls) {
            if (!wall || typeof wall.getBounds !== 'function') continue
            const bounds = wall.getBounds()
            const wallRect = new Phaser.Geom.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height)
            if (Phaser.Geom.Intersects.RectangleToRectangle(candidate, wallRect)) return false
        }
        const OBJECT_PADDING = 8
        for (const otherZone of this.interactables) {
            if (!otherZone || otherZone === zone) continue
            const otherRect = new Phaser.Geom.Rectangle(
                otherZone.x - (otherZone.objectWidth / 2) - OBJECT_PADDING,
                otherZone.y - (otherZone.objectHeight / 2) - OBJECT_PADDING,
                otherZone.objectWidth + OBJECT_PADDING * 2,
                otherZone.objectHeight + OBJECT_PADDING * 2
            )
            if (Phaser.Geom.Intersects.RectangleToRectangle(candidate, otherRect)) return false
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
        if (this.caughtDistance) {
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

    removeFoodItem(zone) {
        const idx = this.interactables.indexOf(zone);
        if (idx !== -1) this.interactables.splice(idx, 1);
        const foodIdx = this.foodItems.indexOf(zone);
        if (foodIdx !== -1) this.foodItems.splice(foodIdx, 1);
        
        if (zone.movableSprite) zone.movableSprite.destroy();
        const existingImg = this.children.list.find(child =>
            child.texture && child.texture.key === zone.textureKey &&
            Math.abs(child.x - zone.x) < 5 && Math.abs(child.y - zone.y) < 5
        );
        if (existingImg) existingImg.destroy();
        
        zone.destroy(); // supprime la zone et son body
    }

    dismissIntro() {
        this.introActive = false
        this.introPanel.setVisible(false)
        this.introTitle.setVisible(false)
        this.introText.setVisible(false)
        this.introHint.setVisible(false)
        try {
            CameraGlitch.apply(this.cameras.main, this, { duration: 420, intensity: 0.02, jitter: 10, rgb: 380 })
        } catch (e) { }
        if (!this.cameraGlitchRepeater) {
            this.cameraGlitchRepeater = this.time.addEvent({
                delay: 10000,
                loop: true,
                callback: () => {
                    if (!this.dialogueActive) {
                        CameraGlitch.apply(this.cameras.main, this, { duration: 420, intensity: 0.02, jitter: 10, rgb: 380 })
                    }
                }
            })
        }
    }

    refreshDialogueUI() {
        this.dialoguePanel.setVisible(true)
        this.dialogueName.setVisible(true)
        this.dialogueText.setVisible(true)
        this.dialogueHint.setVisible(true)
        this.dialogueText.setText(this.dialogueLines[this.dialogueIndex])
        this.dialogueHint.setText('E pour continuer')
    }

    checkCatBounds() {
        if (!this.cat || this.isTransitioning) return
        const b = this.roomBounds
        if (this.cat.x < b.left || this.cat.x > b.right || this.cat.y < b.top || this.cat.y > b.bottom) {
            this.triggerGameOver()
        }
    }

    triggerGameOver() {
        if (this.isTransitioning) return
        if (this.bgMusic) {
            this.bgMusic.stop();
            this.registry.set('musicPlaying', false);
        }
        this.isTransitioning = true
        if (this.glitchRepeater) this.glitchRepeater.remove()
        if (this.cat) this.cat.setVelocity(0, 0)
        if (this.lia && this.lia.sprite) this.lia.sprite.setVelocity(0, 0)
        this.physics.world.pause()
        this.scene.start('GameOverScene')
    }

    showFunnyMessage(text) {
        if (this.funnyMessageText) this.funnyMessageText.destroy()
        this.funnyMessageText = this.add.text(400, 100, text, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ff6b6b',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: { x: 15, y: 10 },
            align: 'center'
        })
        this.funnyMessageText.setOrigin(0.5, 0)
        this.funnyMessageText.setScrollFactor(0)
        this.funnyMessageText.setDepth(1100)
        this.time.delayedCall(2000, () => {
            if (this.funnyMessageText) {
                this.funnyMessageText.destroy()
                this.funnyMessageText = null
            }
        })
    }
}