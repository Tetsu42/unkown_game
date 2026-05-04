import { Scene, manager } from '@tialops/maki'

export default class GameScene extends Scene {
    preload() {
        super.preload()
        this.lia = this.maki.player('lia')
        manager.map(this, 'default')
        manager.preload(this)
    }

    create() {
        super.create()
        manager.create(this)

        // Place lia in the center of the map (50×50 tiles × 16px = 800×800)
        this.lia.sprite.setPosition(400, 400)

        this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'default_map'))

        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        })

    }

    update() {

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
}
