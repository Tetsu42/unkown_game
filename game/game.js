import Phaser from 'phaser'
import GameScene from './scenes/GameScene.js'
import GameOverScene from './scenes/GameOverScene.js'
import VictoryScene from './scenes/VictoryScene.js'

new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#070708',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: [GameScene, GameOverScene, VictoryScene]
})
