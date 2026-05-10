import Phaser from 'phaser';

export default class Cat extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, player, wallGroup = null, obstacleProvider = null) {
        super(scene, x, y, 'cat_down1');
        this.scene = scene;
        this.player = player;
        this.wallGroup = wallGroup;
        this.obstacleProvider = obstacleProvider;

        this.baseSpeed = 80;
        this.fleeSpeed = 168;
        this.fleeDistance = 240;

        this.foodCollected = 0;
        this.isAggressive = false;

        this.repathDelay = 70;
        this.repathTimer = 0;
        this.stuckTimer = 0;
        this.lastX = x;
        this.lastY = y;
        this.stuckCooldown = 0;

        this.isImmobilized = false;
        this.direction = 'down';
        this.moveVector = new Phaser.Math.Vector2(0, 1);

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.body.setAllowGravity(false);
        this.setScale(0.35);
        this.createAnimations();
        this.anims.play('cat_down', true);
    }

    createAnimations() {
        const directions = ['down', 'up', 'left', 'right'];
        directions.forEach(dir => {
            const animKey = `cat_${dir}`;
            if (this.scene.anims.exists(animKey)) return;
            const frames = [];
            for (let i = 1; i <= 6; i++) {
                frames.push({ key: `cat_${dir}${i}` });
            }
            this.scene.anims.create({
                key: animKey,
                frames: frames,
                frameRate: 8,
                repeat: -1
            });
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        this.updateAI(delta);
        this.checkFoodConsumption();
    }

    checkFoodConsumption() {
        // Vérifier si le joueur porte un aliment
        const carried = this.scene.carriedInteractable;
        if (carried && this.scene.isFoodItem && this.scene.isFoodItem(carried)) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, carried.x, carried.y);
            if (dist < 35) {
                const idx = this.scene.foodItems.indexOf(carried);
                if (idx !== -1) this.eat(carried, idx);
                else this.eat(carried, 0);
                return;
            }
        }

        // Sécurité : au cas où d'autres aliments traîneraient (normalement aucun)
        if (!this.scene.foodItems || this.scene.foodItems.length === 0) return;
        for (let i = this.scene.foodItems.length - 1; i >= 0; i--) {
            const food = this.scene.foodItems[i];
            const dist = Phaser.Math.Distance.Between(this.x, this.y, food.x, food.y);
            if (dist < 35) {
                this.eat(food, i);
            }
        }
    }

    eat(food, index) {
        this.foodCollected++;

        // Destruction des colliders
        if (food.playerCollider) food.playerCollider.destroy();
        if (food.catCollider) food.catCollider.destroy();

        // Destruction du sprite visuel
        if (food.movableSprite) food.movableSprite.destroy();

        // Destruction éventuelle de l'image décorative
        const existingImg = this.scene.children.list.find(child =>
            child.texture && child.texture.key === food.textureKey &&
            Math.abs(child.x - food.x) < 5 && Math.abs(child.y - food.y) < 5
        );
        if (existingImg) existingImg.destroy();

        // Si l'objet mangé était porté, nettoyer la référence
        if (this.scene.carriedInteractable === food) {
            this.scene.carriedInteractable = null;
            this.scene.canPlaceCarriedObject = false;
            if (this.scene.catchPrompt) this.scene.catchPrompt.setVisible(false);
        }

        // Destruction de la zone physique
        food.destroy();

        // Retrait des listes
        this.scene.foodItems.splice(index, 1);
        const interactIdx = this.scene.interactables.indexOf(food);
        if (interactIdx !== -1) this.scene.interactables.splice(interactIdx, 1);

        // Feedback UI
        if (this.scene.catchPrompt) {
            this.scene.catchPrompt.setText(`Le chat a mangé ! (${this.foodCollected}/3)`);
            this.scene.catchPrompt.setVisible(true);
            this.scene.time.delayedCall(1500, () => this.scene.catchPrompt.setVisible(false));
        }

        if (this.foodCollected >= 3) this.becomeAggressive();
    }

    becomeAggressive() {
        this.isAggressive = true;
        // On réduit la distance de fuite à 0 pour qu'il ne fuie plus, mais on utilise un comportement de poursuite
        this.fleeDistance = 0;
        this.baseSpeed = 200;
        this.fleeSpeed = 250;
        this.setTint(0xff5555);
    }

    updateAI(delta) {
        // poursuit le joeur
        if (this.isAggressive && !this.isImmobilized && this.player) {
            const target = this.player;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const len = Math.hypot(dx, dy);
            if (len > 0.01) {
                const vx = (dx / len) * this.baseSpeed;
                const vy = (dy / len) * this.baseSpeed;
                this.setVelocity(vx, vy);
                this.playMovementAnimation(vx, vy);
            } else {
                this.setVelocity(0, 0);
            }
            return;
        }

        // Attirance vers la nourriture portée
        const carried = this.scene.carriedInteractable;
        const isCarryingFood = carried && this.scene.isFoodItem && this.scene.isFoodItem(carried);

        if (isCarryingFood && !this.isImmobilized) {
            const target = carried;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const len = Math.hypot(dx, dy);
            if (len > 0.01) {
                const vx = (dx / len) * this.baseSpeed;
                const vy = (dy / len) * this.baseSpeed;
                this.setVelocity(vx, vy);
                this.playMovementAnimation(vx, vy);
            } else {
                this.setVelocity(0, 0);
            }
            return;
        }

        //Comportement normal
        if (!this.player || this.isImmobilized) {
            this.setVelocity(0, 0);
            return;
        }

        const dx = this.x - this.player.x;
        const dy = this.y - this.player.y;
        const distSq = dx * dx + dy * dy;
        const fleeDistanceSq = this.fleeDistance * this.fleeDistance;
        const isFleeing = distSq < fleeDistanceSq;
        const speed = isFleeing ? this.fleeSpeed : this.baseSpeed;

        const moved = Phaser.Math.Distance.Between(this.x, this.y, this.lastX, this.lastY);
        if (this.body.blocked.none === false || (speed > 0 && moved < 2)) {
            this.stuckTimer += delta;
        } else {
            this.stuckTimer = 0;
        }

        this.lastX = this.x;
        this.lastY = this.y;
        this.repathTimer -= delta;

        if (this.repathTimer <= 0) {
            this.pickNewDirectionFast(isFleeing, this.player);
            this.repathTimer = (isFleeing ? this.repathDelay * 0.2 : this.repathDelay) + Phaser.Math.Between(0, 20);
        }

        if (this.stuckTimer > 150) {
            this.forceUnstuck(isFleeing, this.player);
        }

        const vx = this.moveVector.x * speed;
        const vy = this.moveVector.y * speed;
        this.setVelocity(vx, vy);
        this.playMovementAnimation(vx, vy);
    }

    pickNewDirectionFast(isFleeing, player) {
        const NUM_ANGLES = 8;
        const STEP = 30;
        let bestVector = null;
        let bestScore = -Infinity;

        for (let i = 0; i < NUM_ANGLES; i++) {
            const angle = (i / NUM_ANGLES) * Math.PI * 2;
            const vx = Math.cos(angle);
            const vy = Math.sin(angle);

            if (this.isDirectionBlocked(vx, vy, STEP)) continue;

            let score = isFleeing 
                ? Phaser.Math.Distance.Between(this.x + vx * STEP, this.y + vy * STEP, player.x, player.y)
                : (vx * this.moveVector.x + vy * this.moveVector.y);

            if (score > bestScore) {
                bestScore = score;
                bestVector = { vx, vy };
            }
        }

        if (bestVector) {
            this.moveVector.set(bestVector.vx, bestVector.vy).normalize();
        }
    }

    isDirectionBlocked(vx, vy, stepSize) {
        const testX = this.x + vx * stepSize;
        const testY = this.y + vy * stepSize;
        const blockers = [];
        if (this.wallGroup?.getChildren) blockers.push(...this.wallGroup.getChildren());
        if (typeof this.obstacleProvider === 'function') {
            const extra = this.obstacleProvider();
            if (Array.isArray(extra)) blockers.push(...extra);
        }

        for (const blocker of blockers) {
            if (!blocker?.getBounds || blocker === this) continue;
            const b = blocker.getBounds();
            if (testX >= b.left - 5 && testX <= b.right + 5 && testY >= b.top - 5 && testY <= b.bottom + 5) {
                return true;
            }
        }
        return false;
    }

    forceUnstuck(isFleeing, player) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.moveVector.set(Math.cos(angle), Math.sin(angle));
        this.stuckTimer = 0;
    }

    playMovementAnimation(vx, vy) {
        let dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
        if (this.direction !== dir) {
            this.direction = dir;
            this.anims.play(`cat_${dir}`, true);
        }
    }

    isTrulyBlocked() {
        return this.stuckTimer > 100 || (this.body && !this.body.blocked.none);
    }
}