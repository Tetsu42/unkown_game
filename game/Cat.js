import Phaser from 'phaser';

export default class Cat extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, player, wallGroup = null) {
        super(scene, x, y, 'cat_down1');
        this.scene = scene;
        this.player = player;
        this.wallGroup = wallGroup;
        this.baseSpeed = 70;
        this.fleeSpeed = 140;
        this.fleeDistance = 170;
        this.repathDelay = 90;
        this.repathTimer = 0;
        this.stuckTimer = 0;
        this.lastX = x;
        this.lastY = y;
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
        const distSq = (dx * dx) + (dy * dy);
        const fleeDistanceSq = this.fleeDistance * this.fleeDistance;
        const isFleeing = distSq < fleeDistanceSq;
        const speed = isFleeing ? this.fleeSpeed : this.baseSpeed;

        const movedSinceLast = Phaser.Math.Distance.Between(this.x, this.y, this.lastX, this.lastY);
        const currentSpeed = this.body && this.body.velocity
            ? Math.abs(this.body.velocity.x) + Math.abs(this.body.velocity.y)
            : 0;
        if (this.body.blocked.left || this.body.blocked.right || this.body.blocked.up || this.body.blocked.down || (currentSpeed > 0 && movedSinceLast < 0.2)) {
            this.stuckTimer += delta;
        } else {
            this.stuckTimer = 0;
        }

        this.lastX = this.x;
        this.lastY = this.y;
        this.repathTimer -= delta;

        if (this.stuckTimer > 120) {
            this.repathTimer = 0;
            this.stuckTimer = 0;
        }

        if (this.repathTimer <= 0 || this.isTargetBlocked(this.moveTarget.x, this.moveTarget.y)) {
            this.pickNewDirection(isFleeing, player, dx, dy);
            // En mode fuite, recalcul plus fréquent
            this.repathTimer = (isFleeing ? this.repathDelay * 0.5 : this.repathDelay) + Phaser.Math.Between(0, 60);
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

    pickNewDirection(isFleeing, player, dx, dy) {
        // Directions principales et diagonales
        const baseAngles = [0, Math.PI/2, Math.PI, -Math.PI/2, Math.PI/4, -Math.PI/4, 3*Math.PI/4, -3*Math.PI/4];
        let candidates = baseAngles.map(a => new Phaser.Math.Vector2(Math.cos(a), Math.sin(a)));

        // En mode fuite, on tente aussi des angles intermédiaires
        if (isFleeing) {
            for (let i = 0; i < 8; i++) {
                const a = baseAngles[i] + Phaser.Math.FloatBetween(-0.35, 0.35);
                candidates.push(new Phaser.Math.Vector2(Math.cos(a), Math.sin(a)));
            }
        }

        const forward = new Phaser.Math.Vector2(dx, dy);
        if (forward.lengthSq() > 0.001) {
            forward.normalize();
        }

        let bestVector = null;
        let bestScore = -Infinity;
        let firstFreeVector = null;

        for (const candidate of candidates) {
            const vector = candidate.clone().normalize();
            const stepDistance = 28;
            const targetX = this.x + vector.x * stepDistance;
            const targetY = this.y + vector.y * stepDistance;

            // Vérifie que la direction n'est pas bloquée
            let blocked = this.isTargetBlocked(targetX, targetY);
            if (!blocked && !firstFreeVector) {
                firstFreeVector = vector.clone();
            }
            if (isFleeing && blocked) {
                // On tente quand même, mais on baisse le score
                blocked = false;
            }
            if (blocked) continue;

            // Vérifie qu'il y a de l'espace derrière la direction choisie (pour ne pas se coincer)
            let safe = true;
            if (isFleeing) {
                for (let step = 2; step <= 5; step++) {
                    const checkX = this.x + vector.x * stepDistance * step;
                    const checkY = this.y + vector.y * stepDistance * step;
                    if (this.isTargetBlocked(checkX, checkY)) {
                        safe = false;
                        break;
                    }
                }
            }

            let score = 0;
            if (isFleeing) {
                const futureDx = targetX - player.x;
                const futureDy = targetY - player.y;
                score += Math.sqrt((futureDx * futureDx) + (futureDy * futureDy));
                score += Phaser.Math.Clamp(vector.dot(forward), -1, 1) * 16;
                score += Phaser.Math.FloatBetween(0, 2);
                if (!safe) score -= 30;
            } else {
                score += 12;
                score += Phaser.Math.FloatBetween(0, 1);
                if (this.moveVector.lengthSq() > 0) {
                    score += Phaser.Math.Clamp(vector.dot(this.moveVector), -1, 1) * 10;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestVector = vector;
                this.moveTarget.set(targetX, targetY);
            }
        }

        if (!bestVector) {
            // Si aucune direction de fuite n'est possible, tente de trouver un point d'évasion libre plus loin
            if (isFleeing) {
                const escape = this.findEscapePoint(player);
                if (escape) {
                    this.moveVector.set(escape.x - this.x, escape.y - this.y).normalize();
                    this.moveTarget.set(escape.x, escape.y);
                    return;
                }
            }

            // Prenez la première direction libre trouvée
            if (firstFreeVector) {
                this.moveVector.copy(firstFreeVector).normalize();
                this.moveTarget.set(this.x + firstFreeVector.x * 28, this.y + firstFreeVector.y * 28);
            } else {
                // Si vraiment tout est bloqué, on tente une direction aléatoire
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                this.moveVector.set(Math.cos(angle), Math.sin(angle));
                this.moveTarget.set(this.x, this.y);
            }
            return;
        }

        this.moveVector.copy(bestVector).normalize();
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

    isTargetBlocked(x, y) {
        // Sécurité : si le corps n'est pas prêt, on ne bloque pas
        if (!this.body) return false;

        // Si on n'a pas de groupe de murs fourni, on se contente du blocked
        if (!this.wallGroup) {
            return this.body.blocked.left || this.body.blocked.right || this.body.blocked.up || this.body.blocked.down;
        }

        const children = typeof this.wallGroup.getChildren === 'function' ? this.wallGroup.getChildren() : [];
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

    // Recherche simple d'un point d'évasion qui augmente la distance au joueur
    findEscapePoint(player) {
        const currentDist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const step = 28;
        let best = null;
        let bestDist = currentDist;
        // Cherche points sur une grille circulaire
        for (let r = 1; r <= 6; r++) {
            for (let a = 0; a < 16; a++) {
                const ang = (a / 16) * Math.PI * 2;
                const tx = this.x + Math.cos(ang) * step * r;
                const ty = this.y + Math.sin(ang) * step * r;
                if (this.isTargetBlocked(tx, ty)) continue;
                const d = Phaser.Math.Distance.Between(tx, ty, player.x, player.y);
                if (d > bestDist + 16) {
                    bestDist = d;
                    best = { x: tx, y: ty };
                }
            }
            if (best) break;
        }
        return best;
    }
}
