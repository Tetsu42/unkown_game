import { Scene } from '@tialops/maki'

export default class GameOverScene extends Scene {
    constructor() {
        super({ key: 'GameOverScene' })
    }

    create() {
        const width = this.scale.width
        const height = this.scale.height
        this.isRestarting = false

        const restartGame = () => {
            if (this.isRestarting) return
            this.isRestarting = true
            buttonBg.disableInteractive()
            this.registry.set('musicPlaying', false)
            this.scene.stop('VictoryScene')
            this.scene.start('GameScene')
        }

        // Fond
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)

        // Titre "MISSION ÉCHOUÉE"
        const title = this.add.text(width / 2, height / 2 - 100, 'MISSION ÉCHOUÉE', {
            fontFamily: 'Arial',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ff4444'
        })
        title.setOrigin(0.5, 0.5)
        title.setScrollFactor(0)
        title.setDepth(1000)

        // Message d'échec
        const message = this.add.text(width / 2, height / 2, 'Vous avez échoué à votre mission.\nLe chat a été perdus...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 600 }
        })
        message.setOrigin(0.5, 0.5)
        message.setScrollFactor(0)
        message.setDepth(1000)

        // Bouton Recommencer
        const buttonWidth = 200
        const buttonHeight = 50
        const buttonY = height / 2 + 120

        const buttonBg = this.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x3366ff, 0.9)
        buttonBg.setScrollFactor(0)
        buttonBg.setDepth(1000)
        buttonBg.setStrokeStyle(2, 0x66ccff)
        buttonBg.setInteractive()

        const buttonText = this.add.text(width / 2, buttonY, 'Recommencer', {
            fontFamily: 'Arial',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffffff'
        })
        buttonText.setOrigin(0.5, 0.5)
        buttonText.setScrollFactor(0)
        buttonText.setDepth(1001)

        // Effet hover sur le bouton
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x5588ff, 0.9)
            buttonBg.setStrokeStyle(2, 0x88ddff)
        })
        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x3366ff, 0.9)
            buttonBg.setStrokeStyle(2, 0x66ccff)
        })

        // Click pour recommencer
        buttonBg.once('pointerdown', restartGame)

        // ou :Entrée/ Espace pour recommencer \(*-*)/
        this.input.keyboard.once('keydown-SPACE', restartGame)
        this.input.keyboard.once('keydown-ENTER', restartGame)
    }
}
