# How to Use Sprite Assets in Your Game

## 📦 Step 1: Download Sprites

### Recommended Free Sprite Packs:

1. **Ninja Adventure Asset Pack (CC0 - Best for this game!)**
   - Visit: https://pixel-boy.itch.io/ninja-adventure-asset-pack
   - Click "Download Now" (it's free!)
   - Extract the ZIP file

2. **Alternative Sources:**
   - https://itch.io/game-assets/free/tag-ninja/tag-sprites
   - https://opengameart.org/

### What to Download:
- **Player sprites**: Idle, run, attack animations
- **Enemy sprites**: Different types (basic, elite, boss)
- **Effects**: Explosions, hits, abilities
- **Projectiles**: Kunai, shuriken, jutsu effects

---

## 📁 Step 2: Organize Your Sprites

Place downloaded sprites in the correct folders:

```
Fantasy-repository/
└── assets/
    └── sprites/
        ├── player/
        │   ├── naruto_idle.png      (32x32 sprite sheet)
        │   ├── naruto_run.png       (32x32 sprite sheet)
        │   └── naruto_attack.png    (32x32 sprite sheet)
        ├── enemies/
        │   ├── basic_enemy.png      (32x32)
        │   ├── elite_enemy.png      (48x48)
        │   └── boss_enemy.png       (64x64)
        ├── effects/
        │   ├── rasengan.png
        │   ├── clone.png
        │   └── explosion.png
        └── projectiles/
            ├── kunai.png
            └── shuriken.png
```

---

## 🎨 Step 3: Sprite Sheet Format

Most free sprites come as **sprite sheets** (multiple frames in one image):

```
Example sprite sheet (4 frames of run animation):
+--------+--------+--------+--------+
| Frame1 | Frame2 | Frame3 | Frame4 |
|  32px  |  32px  |  32px  |  32px  |
+--------+--------+--------+--------+
```

Our system automatically handles sprite sheets!

---

## 💻 Step 4: Code Integration

### A. Add sprites.js to index.html

Add this line BEFORE game.js:

```html
<!-- Add after js/maps.js -->
<script src="js/sprites.js"></script>
<script src="js/ui.js"></script>
```

### B. Update Player Class to Use Sprites

In `js/player.js`, add sprite animation support:

```javascript
constructor(characterId, x = 400, y = 300) {
    // ... existing code ...

    // Add sprite animations
    this.sprites = {
        idle: null,
        run: null,
        attack: null
    };
    this.currentAnimation = null;
    this.initSprites();
}

async initSprites() {
    // Load sprite sheets
    const idleSheet = await SpriteManager.loadSpriteSheet(
        'naruto_idle',
        'assets/sprites/player/naruto_idle.png',
        32, 32
    );

    // Create animations
    this.sprites.idle = new SpriteAnimation(idleSheet, [0, 1, 2, 3], 8);
    this.currentAnimation = this.sprites.idle;
}

update(game, dt) {
    // ... existing code ...

    // Update sprite animation
    if (this.currentAnimation) {
        this.currentAnimation.update(dt);
    }
}

draw(ctx, camera) {
    const screen = Utils.worldToScreen(this.x, this.y, camera);

    // Draw sprite instead of circle
    if (this.currentAnimation) {
        const size = this.radius * 2;
        const flipX = this.facingAngle > Math.PI/2 || this.facingAngle < -Math.PI/2;

        this.currentAnimation.draw(
            ctx,
            screen.x - size/2,
            screen.y - size/2,
            size,
            size,
            flipX
        );
    } else {
        // Fallback to circle if sprites not loaded
        Utils.drawCircle(ctx, screen.x, screen.y, this.radius, this.color, true);
    }

    // Keep health bar and other UI
    this.drawHealthBar(ctx, camera);
}
```

---

## 🎮 Step 5: Quick Start Example

### Option 1: Simple Static Sprite (No Animation)

```javascript
// In player.js constructor
this.sprite = null;
SpriteManager.loadSprite('naruto', 'assets/sprites/player/naruto.png')
    .then(img => this.sprite = img);

// In draw method
if (this.sprite) {
    ctx.drawImage(this.sprite, screen.x - 16, screen.y - 16, 32, 32);
}
```

### Option 2: Animated Sprite Sheet

```javascript
// In player.js constructor
this.animation = null;
SpriteManager.loadSpriteSheet('naruto_run', 'assets/sprites/player/naruto_run.png', 32, 32)
    .then(sheet => {
        // Frames 0-7 are run animation
        this.animation = new SpriteAnimation(sheet, [0,1,2,3,4,5,6,7], 12);
    });

// In update method
if (this.animation) {
    this.animation.update(dt);
}

// In draw method
if (this.animation) {
    this.animation.draw(ctx, screen.x - 16, screen.y - 16, 32, 32);
}
```

---

## 🔄 Step 6: Animation States

Switch between animations based on player state:

```javascript
update(game, dt) {
    // ... movement code ...

    // Switch animations
    if (this.isAttacking && this.sprites.attack) {
        this.currentAnimation = this.sprites.attack;
    } else if (this.isMoving && this.sprites.run) {
        this.currentAnimation = this.sprites.run;
    } else if (this.sprites.idle) {
        this.currentAnimation = this.sprites.idle;
    }

    if (this.currentAnimation) {
        this.currentAnimation.update(dt);
    }
}
```

---

## 🎯 Recommended Workflow

1. **Start Simple**: Download 1-2 sprite packs first
2. **Test with Static Sprites**: Get a single character sprite working
3. **Add Animations**: Once static works, add sprite sheets
4. **Expand**: Add enemies, effects, projectiles

---

## 📝 Notes

- **Fallback System**: The code automatically falls back to colored shapes if sprites fail to load
- **Performance**: Sprites are cached, so they only load once
- **Sprite Sheets**: Our system handles both horizontal and grid-based sprite sheets
- **Licensing**: Make sure to check the license! CC0 and CC-BY are safe for your game

---

## 🆘 Troubleshooting

**Sprites not showing?**
- Check browser console (F12) for errors
- Verify file paths are correct
- Make sure sprites.js is loaded before game.js

**Sprites look blurry?**
- Add to CSS: `#game-canvas { image-rendering: pixelated; }`

**Animation too fast/slow?**
- Adjust FPS in `new SpriteAnimation(sheet, frames, FPS_HERE)`

---

## 🎨 Free Sprite Resources Summary

1. **[Ninja Adventure Pack](https://pixel-boy.itch.io/ninja-adventure-asset-pack)** - CC0, perfect fit!
2. **[itch.io Free Ninja Sprites](https://itch.io/game-assets/free/tag-ninja/tag-sprites)**
3. **[OpenGameArt.org](https://opengameart.org/)**
4. **[CraftPix Free Assets](https://craftpix.net/freebies/)**

Happy spriting! 🎮
