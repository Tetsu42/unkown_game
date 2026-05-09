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
        this.setBounce(0);
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
    }

    updateAI(delta = 16) {
        const player = this.player;
        if (!player) {
            this.setVelocity(0, 0);
            return;
        }

        if (this.isImmobilized) {
            this.setVelocity(0, 0);
            this.anims.stop();
            return;
        }

        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distSq = dx * dx + dy * dy;
        const fleeDistanceSq = this.fleeDistance * this.fleeDistance;
        const isFleeing = distSq < fleeDistanceSq;
        const speed = isFleeing ? this.fleeSpeed : this.baseSpeed;

        // Vérifier blocage
        const isBlocked =
            this.body.blocked.left ||
            this.body.blocked.right ||
            this.body.blocked.up ||
            this.body.blocked.down;

        const moved = Phaser.Math.Distance.Between(this.x, this.y, this.lastX, this.lastY);

        if (isBlocked || (speed > 0 && moved < 2)) {
            this.stuckTimer += delta;
        } else {
            this.stuckTimer = 0;
        }

        this.lastX = this.x;
        this.lastY = this.y;
        this.repathTimer -= delta;
        if (this.stuckCooldown > 0) this.stuckCooldown -= delta;

        // Repath urgence
        if (this.stuckTimer > 40 && this.stuckCooldown <= 0) {
            this.repathTimer = 0;
            this.stuckTimer = 0;
            this.stuckCooldown = isFleeing ? 100 : 200;
        }

        // Repath normal (RÉDUIT: 8 directions au lieu de 32, tests minimaux)
        if (this.repathTimer <= 0) {
            this.pickNewDirectionFast(isFleeing, player);
            this.repathTimer = (isFleeing ? this.repathDelay * 0.2 : this.repathDelay) + Phaser.Math.Between(0, 20);
        }

        // Fallback si aucune direction
        if (this.moveVector.lengthSq() === 0) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            this.moveVector.set(Math.cos(angle), Math.sin(angle));
        }

        // Déblocage d'urgence si vraiment stuck
        if (this.stuckTimer > 150 && isBlocked && moved < 1) {
            this.forceUnstuck(isFleeing, player);
        }

        const vx = this.moveVector.x * speed;
        const vy = this.moveVector.y * speed;
        this.setVelocity(vx, vy);
        this.playMovementAnimation(vx, vy);
    }

    /**
     * VERSION OPTIMISÉE: Seulement 8 directions, pas de scoring complexe
     */
    pickNewDirectionFast(isFleeing, player) {
        const NUM_ANGLES = 8;
        const STEP = 30;
        
        let bestVector = null;
        let bestScore = -Infinity;
        let anyValid = null;

        for (let i = 0; i < NUM_ANGLES; i++) {
            const angle = (i / NUM_ANGLES) * Math.PI * 2;
            const vx = Math.cos(angle);
            const vy = Math.sin(angle);

            // Test rapide: le chemin immédiat est-il libre?
            if (this.isDirectionBlocked(vx, vy, STEP)) {
                continue; // Complètement bloqué, skip
            }

            anyValid = { vx, vy };
            let score = 0;

            if (isFleeing) {
                // Score simple: juste l'éloignement du joueur
                const futureX = this.x + vx * STEP;
                const futureY = this.y + vy * STEP;
                score = Phaser.Math.Distance.Between(futureX, futureY, player.x, player.y);
                score += Phaser.Math.FloatBetween(-10, 10); // Random pour variété
            } else {
                // Déambulation: préférer continuer droit
                if (this.moveVector.lengthSq() > 0) {
                    const dot = vx * this.moveVector.x + vy * this.moveVector.y;
                    score = dot + Phaser.Math.FloatBetween(-2, 2);
                } else {
                    score = Phaser.Math.FloatBetween(0, 3);
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestVector = { vx, vy };
            }
        }

        if (bestVector) {
            this.moveVector.set(bestVector.vx, bestVector.vy).normalize();
            return;
        }

        // Fallback: n'importe quelle direction valide
        if (anyValid) {
            this.moveVector.set(anyValid.vx, anyValid.vy).normalize();
            return;
        }

        // En fuite: s'éloigner coûte que coûte
        if (isFleeing && this.moveVector.lengthSq() === 0) {
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.moveVector.set(dx / dist, dy / dist).normalize();
                return;
            }
        }

        // Secours ultime: direction aléatoire
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.moveVector.set(Math.cos(angle), Math.sin(angle));
    }

    /**
     * Test ultra-rapide: 1 seule vérification au lieu de 12
     */
    isDirectionBlocked(vx, vy, stepSize) {
        // Test juste le premier pas
        const testX = this.x + vx * stepSize;
        const testY = this.y + vy * stepSize;

        const blockers = [];
        if (this.wallGroup && typeof this.wallGroup.getChildren === 'function') {
            blockers.push(...this.wallGroup.getChildren());
        }
        if (typeof this.obstacleProvider === 'function') {
            const extra = this.obstacleProvider();
            if (Array.isArray(extra)) blockers.push(...extra);
        }

        // Vérification minimale
        const padding = 8;
        for (const blocker of blockers) {
            if (!blocker?.getBounds) continue;
            const bounds = blocker.getBounds();
            if (testX >= bounds.left - padding && testX <= bounds.right + padding &&
                testY >= bounds.top - padding && testY <= bounds.bottom + padding) {
                return true;
            }
        }
        return false;
    }

    /**
     * Déblocage d'urgence simple et rapide
     */
    forceUnstuck(isFleeing, player) {
        // Fuite: s'éloigner du joueur
        if (isFleeing) {
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.moveVector.set(dx / dist, dy / dist).normalize();
                return;
            }
        }

        // Sinon: essayer 8 directions rapides
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const vx = Math.cos(angle);
            const vy = Math.sin(angle);

            // Test ultra-permissif: juste 3px
            const testX = this.x + vx * 3;
            const testY = this.y + vy * 3;

            const blockers = [];
            if (this.wallGroup?.getChildren) blockers.push(...this.wallGroup.getChildren());
            if (typeof this.obstacleProvider === 'function') {
                const extra = this.obstacleProvider();
                if (Array.isArray(extra)) blockers.push(...extra);
            }

            // Vérification minimale (2px padding)
            let blocked = false;
            for (const blocker of blockers) {
                if (!blocker?.getBounds) continue;
                const bounds = blocker.getBounds();
                if (testX >= bounds.left - 2 && testX <= bounds.right + 2 &&
                    testY >= bounds.top - 2 && testY <= bounds.bottom + 2) {
                    blocked = true;
                    break;
                }
            }
            
            if (!blocked) {
                this.moveVector.set(vx, vy).normalize();
                return;
            }
        }

        // Dernier recours
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.moveVector.set(Math.cos(angle), Math.sin(angle));
    }

    playMovementAnimation(vx, vy) {
        let dir = 'down';
        if (Math.abs(vx) > Math.abs(vy)) {
            dir = vx > 0 ? 'right' : 'left';
        } else {
            dir = vy > 0 ? 'down' : 'up';
        }

        if (this.direction !== dir) {
            this.direction = dir;
            this.anims.play(`cat_${dir}`, true);
        }
    }

    immobilize() {
        this.isImmobilized = true;
        this.moveVector.set(0, 0);
        this.setVelocity(0, 0);
        this.anims.stop();
    }

    free() {
        this.isImmobilized = false;
    }

    isTrulyBlocked() {
        if (!this.body) return false;

        return (
            this.stuckTimer > 120 ||
            this.body.blocked.left ||
            this.body.blocked.right ||
            this.body.blocked.up ||
            this.body.blocked.down
        );
    }
}
