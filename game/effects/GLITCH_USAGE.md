# Effets Glitch pour Sprites

## 📝 Comment utiliser

### 1. **Glitch instantané rapide** (parfait pour un événement)
```javascript
import GlitchEffect from './effects/GlitchEffect.js'

// Applique un glitch court (300ms par défaut, intensité de 10px)
GlitchEffect.apply(sprite)

// Ou personnalisé :
GlitchEffect.apply(sprite, 500, 20)  // 500ms, intensité 20px
```

### 2. **Glitch continu** (pour un effet persistent)
```javascript
// Démarrer
this.glitchTimer = GlitchEffect.startContinuous(sprite, 8)

// Arrêter
GlitchEffect.stopContinuous(this.glitchTimer, sprite)
```

### 3. **Effet RGB Shift** (couleurs aléatoires)
```javascript
GlitchEffect.applyRGBShift(sprite, 500)
```

### 4. **Effet Corruption** (rotation + échelle)
```javascript
GlitchEffect.applyCorruption(sprite, 600)
```

## 🎮 Exemples dans GameScene

### Tester au démarrage
Décommentez dans `create()` :
```javascript
// Glitch court sur le personnage
GlitchEffect.apply(this.lia.sprite, 300, 10)
```

### Appui sur une touche
```javascript
this.input.keyboard.on('keydown-G', () => {
    GlitchEffect.apply(this.lia.sprite)
})
```

### Glitch quand le personnage entre en collision
```javascript
this.physics.add.overlap(this.lia.sprite, dangerZone, () => {
    GlitchEffect.apply(this.lia.sprite, 400, 15)
})
```

### Glitch continu avec activation/désactivation
```javascript
let isGlitched = false

this.input.keyboard.on('keydown-G', () => {
    if (!isGlitched) {
        this.glitchTimer = GlitchEffect.startContinuous(this.lia.sprite, 10)
        isGlitched = true
    } else {
        GlitchEffect.stopContinuous(this.glitchTimer, this.lia.sprite)
        isGlitched = false
    }
})
```

## 🪑 Appliquer sur d'autres sprites (chaises, objets, etc.)

```javascript
// Sur une chaise
const chair = this.add.sprite(300, 300, 'chair')
GlitchEffect.apply(chair, 300, 8)

// Sur un groupe de sprites
this.meubles.children.entries.forEach(meuble => {
    GlitchEffect.apply(meuble, 200, 5)
})
```

## 🎨 Paramètres

- **duration** : Durée en millisecondes (défaut: 300ms)
- **intensity** : Amplitude du glitch en pixels (défaut: 10px)
  - 5-8px : Glitch subtil
  - 10-15px : Glitch normal
  - 20-30px : Glitch intense

## 💡 Idées créatives

1. **Glitch d'apparition** : Appliquer au spawn d'une entité
2. **Glitch de mort** : Appliquer avant la disparition
3. **Glitch de téléportation** : Effet court avant déplacement
4. **Gêne visuelle** : Glitch continu pour signifier une perturbation
5. **Effet de virus** : RGB Shift + Corruption combinés
6. **Bugué au démarrage** : Glitch au load du jeu

## 📦 Import dans d'autres fichiers

```javascript
import GlitchEffect from '../effects/GlitchEffect.js'
```

(Ajuste le chemin selon où tu imports)
