import Phaser from 'phaser';

export default class Cat extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, player, wallGroup = null) {
        super(scene, x, y, 'cat_down1');
        this.scene = scene;
        this.player = player;
        this.wallGroup = wallGroup;

        // FIX 1 : vitesse de fuite nettement supérieure au joueur (130)
        this.baseSpeed = 80;
        this.fleeSpeed = 168;

        // FIX 2 : détection plus tôt → le chat commence à fuir avant d'être attrapé
        this.fleeDistance = 240;

        // FIX 3 : repath très fréquent en fuite pour réagir vite
        this.repathDelay = 70;
        this.repathTimer = 0;

        // Stuck detection
        this.stuckTimer = 0;
        this.lastX = x;
        this.lastY = y;
        this.stuckCooldown = 0;

        // Immobilisation
        this.isImmobilized = false;
        this.immobilizedTime = 0;

        this.direction = 'down';
        this.moveVector = new Phaser.Math.Vector2(0, 1);
        this.moveTarget = new Phaser.Math.Vector2(0, 0);

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
            const frames = [];
            for (let i = 1; i <= 6; i++) {
                frames.push({ key: `cat_${dir}${i}` });
            }
            this.scene.anims.create({
                key: `cat_${dir}`,
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

        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distSq = dx * dx + dy * dy;
        const fleeDistanceSq = this.fleeDistance * this.fleeDistance;
        const isFleeing = distSq < fleeDistanceSq;
        const speed = isFleeing ? this.fleeSpeed : this.baseSpeed;

        // --- Détection de blocage ---
        const isPhysicallyBlocked =
            this.body.blocked.left ||
            this.body.blocked.right ||
            this.body.blocked.up ||
            this.body.blocked.down;

        const moved = Phaser.Math.Distance.Between(this.x, this.y, this.lastX, this.lastY);

        if (isPhysicallyBlocked || (speed > 0 && moved < 0.5)) {
            this.stuckTimer += delta;
        } else {
            this.stuckTimer = 0;
        }

        this.lastX = this.x;
        this.lastY = this.y;
        this.repathTimer -= delta;
        if (this.stuckCooldown > 0) this.stuckCooldown -= delta;

        // FIX 4 : récupération de blocage très rapide (60 ms au lieu de 120)
        if (this.stuckTimer > 60 && this.stuckCooldown <= 0) {
            this.repathTimer = 0;
            this.stuckTimer = 0;
            this.stuckCooldown = 200; // évite de re-trigger en boucle
        }

        if (this.repathTimer <= 0) {
            this.pickNewDirection(isFleeing, player, dx, dy);
            // FIX 5 : repath très fréquent en fuite
            this.repathTimer = (isFleeing ? this.repathDelay * 0.4 : this.repathDelay)
                + Phaser.Math.Between(0, 40);
        }

        if (this.moveVector.lengthSq() === 0) {
            this.setVelocity(0, 0);
            this.anims.stop();
            return;
        }

        const vx = this.moveVector.x * speed;
        const vy = this.moveVector.y * speed;
        this.setVelocity(vx, vy);
        this.playMovementAnimation(vx, vy);
    }

    /**
     * Compte combien de pas sont libres dans une direction donnée.
     * C'est la clé pour détecter les culs-de-sac AVANT d'y entrer.
     */
    countFreeSteps(startX, startY, vx, vy, maxSteps = 12, stepSize = 26) {
        let count = 0;
        for (let i = 1; i <= maxSteps; i++) {
            const tx = startX + vx * stepSize * i;
            const ty = startY + vy * stepSize * i;
            if (this.isTargetBlocked(tx, ty)) break;
            count++;
        }
        return count;
    }

    /**
     * Mesure l'ouverture latérale à une position donnée.
     * Faible ouverture = coin / couloir étroit.
     */
    lateralOpenness(posX, posY, vx, vy, steps = 4, stepSize = 26) {
        const perpX = -vy;
        const perpY = vx;
        const left = this.countFreeSteps(posX, posY, perpX, perpY, steps, stepSize);
        const right = this.countFreeSteps(posX, posY, -perpX, -perpY, steps, stepSize);
        return left + right;
    }

    pickNewDirection(isFleeing, player, dx, dy) {
        // FIX 6 : 24 directions au lieu de 8+8 → couverture plus fine
        const NUM_ANGLES = 24;
        const STEP = 26;

        let bestVector = null;
        let bestScore = -Infinity;
        let firstFreeVector = null;

        for (let i = 0; i < NUM_ANGLES; i++) {
            const angle = (i / NUM_ANGLES) * Math.PI * 2;
            const vx = Math.cos(angle);
            const vy = Math.sin(angle);

            // Étape 1 : rejeter immédiatement les directions mur au premier pas
            const firstFree = this.countFreeSteps(this.x, this.y, vx, vy, 1, STEP);
            if (firstFree === 0) continue;

            if (!firstFreeVector) {
                firstFreeVector = new Phaser.Math.Vector2(vx, vy);
            }

            // Étape 2 : profondeur libre en avant (anti cul-de-sac)
            const freeDepth = this.countFreeSteps(this.x, this.y, vx, vy, 14, STEP);

            // Étape 3 : ouverture latérale après 2 pas (anti coin)
            const midX = this.x + vx * STEP * 2;
            const midY = this.y + vy * STEP * 2;
            const lateral = this.lateralOpenness(midX, midY, vx, vy, 4, STEP);

            let score = 0;

            if (isFleeing) {
                // Distance future au joueur (maximiser = s'éloigner)
                const futureX = this.x + vx * STEP * 4;
                const futureY = this.y + vy * STEP * 4;
                const futureDist = Phaser.Math.Distance.Between(futureX, futureY, player.x, player.y);

                // FIX 7 : poids forts sur profondeur et ouverture → jamais de coin
                score += futureDist * 1.8;       // s'éloigner du joueur
                score += freeDepth * 22;          // fuir vers du vide (évite cul-de-sac)
                score += lateral * 10;            // éviter les coins étroits
                score += Phaser.Math.FloatBetween(0, 4); // légère variété

            } else {
                // Déambulation normale
                score += freeDepth * 8;
                score += lateral * 3;
                if (this.moveVector.lengthSq() > 0) {
                    const dot = vx * this.moveVector.x + vy * this.moveVector.y;
                    score += Phaser.Math.Clamp(dot, -1, 1) * 12; // préfère continuer tout droit
                }
                score += Phaser.Math.FloatBetween(0, 3);
            }

            if (score > bestScore) {
                bestScore = score;
                bestVector = new Phaser.Math.Vector2(vx, vy);
                this.moveTarget.set(this.x + vx * STEP, this.y + vy * STEP);
            }
        }

        if (bestVector) {
            this.moveVector.copy(bestVector).normalize();
            return;
        }

        // FIX 8 : secours — prendre la première direction libre trouvée
        if (firstFreeVector) {
            this.moveVector.copy(firstFreeVector).normalize();
            this.moveTarget.set(
                this.x + firstFreeVector.x * STEP,
                this.y + firstFreeVector.y * STEP
            );
            return;
        }

        // Dernier recours : direction aléatoire
        const fallback = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.moveVector.set(Math.cos(fallback), Math.sin(fallback));
        this.moveTarget.set(this.x, this.y);
    }

    playMovementAnimation(vx, vy) {
        let dir = 'down';
        if (Math.abs(vx) > Math.abs(vy)) {
            dir = vx > 0 ? 'right' : 'left';
        } else {
            dir = vy > 0 ? 'down' : 'up';
        }

        if (this.direction !== dir || this.anims.currentAnim?.key !== `cat_${dir}`) {
            this.direction = dir;
            this.anims.play(`cat_${dir}`, true);
        }
    }

    immobilize() {
        this.isImmobilized = true;
        this.immobilizedTime = 0;
        this.moveVector.set(0, 0);
        this.setVelocity(0, 0);
        this.anims.stop();
    }

    free() {
        this.isImmobilized = false;
        this.immobilizedTime = 0;
    }

    isTargetBlocked(x, y) {
        if (!this.body) return false;

        if (!this.wallGroup) {
            return (
                this.body.blocked.left ||
                this.body.blocked.right ||
                this.body.blocked.up ||
                this.body.blocked.down
            );
        }

        const children = typeof this.wallGroup.getChildren === 'function'
            ? this.wallGroup.getChildren()
            : [];
        if (!children.length) return false;

        const paddingX = Math.max(6, (this.body.width || 16) * 0.45);
        const paddingY = Math.max(6, (this.body.height || 16) * 0.45);

        for (const wall of children) {
            if (!wall || typeof wall.getBounds !== 'function') continue;
            const bounds = wall.getBounds();
            if (
                x >= bounds.left - paddingX &&
                x <= bounds.right + paddingX &&
                y >= bounds.top - paddingY &&
                y <= bounds.bottom + paddingY
            ) {
                return true;
            }
        }

        return false;
    }
}