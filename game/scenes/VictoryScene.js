import { Scene } from '@tialops/maki'

export default class VictoryScene extends Scene {
    constructor() {
        super({ key: 'VictoryScene' })
    }

    create() {
        const width = this.scale.width
        const height = this.scale.height
        this.isRestarting = false

        const restartGame = () => {
            if (this.isRestarting) return
            this.isRestarting = true
            restartButtonBg.disableInteractive()
            this.scene.stop('GameOverScene')
            this.scene.start('GameScene')
        }

        
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)

        // Titre "VICTOIRE"
        const title = this.add.text(width / 2, height / 2 - 100, 'VICTOIRE', {
            fontFamily: 'Arial',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#44ff44'
        })
        title.setOrigin(0.5, 0.5)
        title.setScrollFactor(0)
        title.setDepth(1000)

        
        const message = this.add.text(width / 2, height / 2, 'Vous avez résolu le bug!\nLe chat a été capturé avec succès.', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 600 }
        })
        message.setOrigin(0.5, 0.5)
        message.setScrollFactor(0)
        message.setDepth(1000)

        // Boutons
        const buttonWidth = 180
        const buttonHeight = 50
        const buttonY = height / 2 + 120
        const spacing = 40

        // Bouton SUIVANT (grisé)
        const nextButtonBg = this.add.rectangle(width / 2 - spacing - buttonWidth / 2, buttonY, buttonWidth, buttonHeight, 0x999999, 0.6)
        nextButtonBg.setScrollFactor(0)
        nextButtonBg.setDepth(1000)
        nextButtonBg.setStrokeStyle(2, 0x666666)

        const nextButtonText = this.add.text(width / 2 - spacing - buttonWidth / 2, buttonY, 'SUIVANT', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#888888'
        })
        nextButtonText.setOrigin(0.5, 0.5)
        nextButtonText.setScrollFactor(0)
        nextButtonText.setDepth(1001)

        // Bouton RECOMMENCER
        const restartButtonBg = this.add.rectangle(width / 2 + spacing + buttonWidth / 2, buttonY, buttonWidth, buttonHeight, 0x3366ff, 0.9)
        restartButtonBg.setScrollFactor(0)
        restartButtonBg.setDepth(1000)
        restartButtonBg.setStrokeStyle(2, 0x66ccff)
        restartButtonBg.setInteractive()

        const restartButtonText = this.add.text(width / 2 + spacing + buttonWidth / 2, buttonY, 'RECOMMENCER', {
            fontFamily: 'Arial',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffffff'
        })
        restartButtonText.setOrigin(0.5, 0.5)
        restartButtonText.setScrollFactor(0)
        restartButtonText.setDepth(1001)

        // Effet hover
        restartButtonBg.on('pointerover', () => {
            restartButtonBg.setFillStyle(0x5588ff, 0.9)
            restartButtonBg.setStrokeStyle(2, 0x88ddff)
        })
        restartButtonBg.on('pointerout', () => {
            restartButtonBg.setFillStyle(0x3366ff, 0.9)
            restartButtonBg.setStrokeStyle(2, 0x66ccff)
        })

        // Click pour recommencer
        restartButtonBg.once('pointerdown', restartGame)

        // Entrée/Espace pour recommencer
        this.input.keyboard.once('keydown-SPACE', restartGame)
        this.input.keyboard.once('keydown-ENTER', restartGame)
    }
}
