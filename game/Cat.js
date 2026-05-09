import Phaser from 'phaser';

export default class Cat extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, player, wallGroup = null, obstacleProvider = null) {
        super(scene, x, y, 'cat_down1');
        this.scene = scene;
        this.player = player;
        this.wallGroup = wallGroup;
        this.obstacleProvider = obstacleProvider;

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
            const animKey = `cat_${dir}`;
            if (this.scene.anims.exists(animKey)) {
                return;
            }

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

        // Si immobilisé, ne pas bouger du tout
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

        // --- Détection de blocage ---
        const isPhysicallyBlocked =
            this.body.blocked.left ||
            this.body.blocked.right ||
            this.body.blocked.up ||
            this.body.blocked.down;

        const moved = Phaser.Math.Distance.Between(this.x, this.y, this.lastX, this.lastY);

        // Plus permissif : detection de blocage seulement si vraiment bloqué physiquement
        // OU aucun mouvement pendant longtemps malgré vitesse
        if (isPhysicallyBlocked || (speed > 0 && moved < 2)) {
            this.stuckTimer += delta;
        } else {
            this.stuckTimer = 0;
        }

        this.lastX = this.x;
        this.lastY = this.y;
        this.repathTimer -= delta;
        if (this.stuckCooldown > 0) this.stuckCooldown -= delta;

        // FIX 4 : récupération de blocage très rapide (40 ms au lieu de 60)
        // En fuite, faire un repath URGENT immédiatement
        if (this.stuckTimer > 40 && this.stuckCooldown <= 0) {
            this.repathTimer = 0;
            this.stuckTimer = 0;
            this.stuckCooldown = isFleeing ? 100 : 200;
        }

        if (this.repathTimer <= 0) {
            this.pickNewDirection(isFleeing, player, dx, dy);
            // FIX 5 : repath TRÈS TRÈS fréquent en fuite pour sortir des coins
            this.repathTimer = (isFleeing ? this.repathDelay * 0.15 : this.repathDelay)
                + Phaser.Math.Between(0, 20);
        }

        // Sécurité : si pas de direction valide, forcer une direction aléatoire pour ne JAMAIS rester bloqué
        if (this.moveVector.lengthSq() === 0) {
            const fallbackAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            this.moveVector.set(Math.cos(fallbackAngle), Math.sin(fallbackAngle));
        }

        // Ultra-sécurité : si vraiment stuck (aucun mouvement + physiquement bloqué), déblocage d'urgence
        if (this.stuckTimer > 150 && isPhysicallyBlocked && moved < 1) {
            this.forceUnstuck(isFleeing, player);
        }

        const vx = this.moveVector.x * speed;
        const vy = this.moveVector.y * speed;
        this.setVelocity(vx, vy);
        this.playMovementAnimation(vx, vy);
    }

    /**
     * Compte combien de pas sont libres dans une direction donnée.
     * Moins strict pour les premiers pas (pour sortir des coins).
     */
    countFreeSteps(startX, startY, vx, vy, maxSteps = 12, stepSize = 26) {
        let count = 0;
        for (let i = 1; i <= maxSteps; i++) {
            const tx = startX + vx * stepSize * i;
            const ty = startY + vy * stepSize * i;
            // Les 2 premiers pas sont moins strictement vérifiés (sortir des coins)
            const relaxedCheck = i <= 2;
            if (this.isTargetBlocked(tx, ty, relaxedCheck)) break;
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

    /**
     * Déblocage d'urgence : force une direction sans vérification stricte de collision
     */
    forceUnstuck(isFleeing, player) {
        const NUM_ANGLES = 64;  // 2x plus d'angles pour plus de précision
        
        // Si en fuite : préférer s'éloigner du joueur
        if (isFleeing) {
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const distFromPlayer = Math.sqrt(dx * dx + dy * dy);
            
            if (distFromPlayer > 0) {
                const fleeVx = dx / distFromPlayer;
                const fleeVy = dy / distFromPlayer;
                this.moveVector.set(fleeVx, fleeVy).normalize();
                   return;
            }
        }
        
        // Sinon : essayer les 64 directions et prendre la première viable physiquement
        for (let i = 0; i < NUM_ANGLES; i++) {
            const angle = (i / NUM_ANGLES) * Math.PI * 2;
            const vx = Math.cos(angle);
            const vy = Math.sin(angle);
            
               // Vérification ultra-permissive : juste tester 1px
               const testX = this.x + vx * 1;
               const testY = this.y + vy * 1;
            
               // Vérification EXTRÊME (minimal padding)
            if (!this.isTargetBlocked(testX, testY, true)) {
                this.moveVector.set(vx, vy).normalize();
                   return;
            }
        }
        
        // Dernier recours : prendre une direction aléatoire
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.moveVector.set(Math.cos(angle), Math.sin(angle)).normalize();
    }

    pickNewDirection(isFleeing, player, dx, dy) {
        // FIX 6 : 32 directions au lieu de 24 → couverture COMPLÈTE
        const NUM_ANGLES = 32;
        const STEP = 26;

        let bestVector = null;
        let bestScore = -Infinity;
        let firstFreeVector = null;
        let anyFreeVector = null;

    // Si vraiment stuck depuis longtemps, accepter même les directions semi-bloquées
    const isUrgentUnstuck = this.stuckTimer > 120;

    for (let i = 0; i < NUM_ANGLES; i++) {
            const angle = (i / NUM_ANGLES) * Math.PI * 2;
            const vx = Math.cos(angle);
            const vy = Math.sin(angle);

            // Étape 1 : rejeter immédiatement les directions mur au premier pas

               // En mode urgence : accepter aussi les directions avec peu d'espace
               const firstFree = this.countFreeSteps(this.x, this.y, vx, vy, 1, STEP);
               if (firstFree === 0 && !isUrgentUnstuck) continue;
            // Garder trace de n'importe quelle direction libre
            if (!anyFreeVector) {
                anyFreeVector = new Phaser.Math.Vector2(vx, vy);
            }

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

                // FIX 7 : poids TRÈS FORTS sur profondeur → jamais de coin en fuite
                score += futureDist * 2.5;       // s'éloigner du joueur (poids maximal)
                score += freeDepth * 35;         // fuir vers du vide (poids CRUCIAL)
                score += lateral * 15;           // éviter les coins étroits (poids++)
                score += Phaser.Math.FloatBetween(0, 5); // légère variété

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

        // Stratégie de secours progressive
        if (bestVector) {
            this.moveVector.copy(bestVector).normalize();
            return;
        }

        // Secours niveau 1 : prendre la première direction libre trouvée
        if (firstFreeVector) {
            this.moveVector.copy(firstFreeVector).normalize();
            this.moveTarget.set(
                this.x + firstFreeVector.x * STEP,
                this.y + firstFreeVector.y * STEP
            );
            return;
        }

        // Secours niveau 2 : n'importe quelle direction libre
        if (anyFreeVector) {
            this.moveVector.copy(anyFreeVector).normalize();
            this.moveTarget.set(
                this.x + anyFreeVector.x * STEP,
                this.y + anyFreeVector.y * STEP
            );
            return;
        }

        // Secours niveau 3 : si on fuit, essayer de garder la dernière direction de fuite
        if (isFleeing && this.moveVector.lengthSq() > 0) {
            // Garder le mouvement actuel, qui est déjà une fuite valide
            return;
        }

        // Secours ULTIME : direction aléatoire pour TOUJOURS avoir un mouvement
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

    isTargetBlocked(x, y, relaxed = false) {
        if (!this.body) return false;

        // Padding réduit en mode relaxé pour permettre de sortir des coins
        let paddingX, paddingY;
        if (relaxed) {
            // Mode relaxé : minimal padding pour les 2 premiers pas
            paddingX = 2;
            paddingY = 2;
        } else {
            // Mode strict : padding normal
            paddingX = Math.max(8, (this.body.width || 20) * 0.5);
            paddingY = Math.max(8, (this.body.height || 20) * 0.5);
        }

        const blockers = [];

        // Ajouter les murs
        if (this.wallGroup && typeof this.wallGroup.getChildren === 'function') {
            blockers.push(...this.wallGroup.getChildren());
        }

        // Ajouter les obstacles dynamiques (objets déplaçables)
        if (typeof this.obstacleProvider === 'function') {
            const extraBlockers = this.obstacleProvider();
            if (Array.isArray(extraBlockers)) {
                blockers.push(...extraBlockers);
            }
        }

        // Si aucun blocker, retourner l'état des flags physiques
        if (!blockers.length) {
            return (
                this.body.blocked.left ||
                this.body.blocked.right ||
                this.body.blocked.up ||
                this.body.blocked.down
            );
        }

        // Vérifier collision avec tous les blockers
        for (const blocker of blockers) {
            if (!blocker || typeof blocker.getBounds !== 'function') continue;
            const bounds = blocker.getBounds();
            
            // En mode relaxé : check moins strict pour sortir des coins
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
