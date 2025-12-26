# 🏃 Using Character Sprite Sheets for Movement

## How Character Sprite Sheets Work

Character sprite sheets from The Spriters Resource are organized like this:

```
+--------+--------+--------+--------+--------+--------+
| Row 1: Idle animation (frames 0-5)                  |
+--------+--------+--------+--------+--------+--------+
| Row 2: Walk animation (frames 0-7)                  |
+--------+--------+--------+--------+--------+--------+
| Row 3: Run animation (frames 0-7)                   |
+--------+--------+--------+--------+--------+--------+
| Row 4: Attack animation (frames 0-9)                |
+--------+--------+--------+--------+--------+--------+
```

Each row = one animation (idle, walk, run, attack, etc.)
Each column = one frame of that animation

---

## 📥 Step 1: Download the Sprite Sheet

### From The Spriters Resource:
1. Go to: https://www.spriters-resource.com/ds_dsi/narutoshinrumble/
2. Click on the character you want (Naruto, Sasuke, etc.)
3. Click "Download This Sheet"
4. Save to: `assets/sprites/player/naruto_sheet.png`

### Common Sprite Sheet Info:
- **Frame Size**: Usually 32x32, 48x48, or 64x64 pixels per frame
- **Layout**: Grid-based (rows × columns)
- **Background**: Usually transparent PNG

---

## 🎨 Step 2: Identify Animation Rows

Open the sprite sheet image and note which row is which animation:

**Example layout:**
- Row 0: Idle (standing still)
- Row 1: Walk (slow movement)
- Row 2: Run (fast movement)
- Row 3: Attack (melee attack)
- Row 4: Jump (if applicable)
- Row 5: Hit/Damage (taking damage)
- Row 6: Death (death animation)

**How to find row numbers:**
- Open image in any image viewer
- Count from top (first row = 0, second row = 1, etc.)

---

## 💻 Step 3: Set Up Player Sprite Animations

Update `js/player.js` to use movement animations:

### A. Add sprite properties to constructor (after line 88):

```javascript
// Sprite animations
this.spriteSheet = null;
this.animations = {
    idle: null,
    walk: null,
    run: null,
    attack: null
};
this.currentAnimation = null;
this.loadSpriteSheet();
```

### B. Create loadSpriteSheet method:

```javascript
async loadSpriteSheet() {
    try {
        // Load the sprite sheet (adjust frame size to match your sprite)
        this.spriteSheet = await SpriteManager.loadSpriteSheet(
            'naruto_sheet',
            'assets/sprites/player/naruto_sheet.png',
            64,  // Frame width - ADJUST THIS to match your sprite
            64   // Frame height - ADJUST THIS to match your sprite
        );

        // Define animations based on row numbers
        // ADJUST THESE based on your sprite sheet layout!

        // Row 0: Idle animation (4 frames)
        this.animations.idle = new SpriteAnimation(
            this.spriteSheet,
            [{row: 0, col: 0}, {row: 0, col: 1}, {row: 0, col: 2}, {row: 0, col: 3}],
            6  // FPS (frames per second)
        );

        // Row 1: Walk animation (6 frames)
        this.animations.walk = new SpriteAnimation(
            this.spriteSheet,
            [{row: 1, col: 0}, {row: 1, col: 1}, {row: 1, col: 2},
             {row: 1, col: 3}, {row: 1, col: 4}, {row: 1, col: 5}],
            10  // FPS
        );

        // Row 2: Run animation (6 frames)
        this.animations.run = new SpriteAnimation(
            this.spriteSheet,
            [{row: 2, col: 0}, {row: 2, col: 1}, {row: 2, col: 2},
             {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}],
            12  // FPS (faster than walk)
        );

        // Row 3: Attack animation (8 frames, don't loop)
        this.animations.attack = new SpriteAnimation(
            this.spriteSheet,
            [{row: 3, col: 0}, {row: 3, col: 1}, {row: 3, col: 2}, {row: 3, col: 3},
             {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7}],
            15  // FPS (fast attack)
        );
        this.animations.attack.loop = false;  // Attack plays once

        // Set default animation
        this.currentAnimation = this.animations.idle;

        console.log('✅ Sprite animations loaded!');
    } catch (err) {
        console.warn('⚠️ Could not load sprites, using fallback graphics');
    }
}
```

### C. Update the update() method to switch animations:

Find the `update(game, dt)` method and add animation switching logic:

```javascript
update(game, dt) {
    if (this.isDead) return;

    // ... existing movement code ...

    // NEW: Switch animations based on movement state
    if (this.animations.idle) {  // Only if sprites loaded
        if (this.isAttacking && this.animations.attack) {
            // Attacking - play attack animation
            if (this.currentAnimation !== this.animations.attack) {
                this.currentAnimation = this.animations.attack;
                this.currentAnimation.reset();
            }
        } else if (this.isMoving) {
            // Moving - use run animation (you can add walk/run logic based on speed)
            if (this.currentAnimation !== this.animations.run) {
                this.currentAnimation = this.animations.run;
            }
        } else {
            // Idle - standing still
            if (this.currentAnimation !== this.animations.idle) {
                this.currentAnimation = this.animations.idle;
            }
        }

        // Update current animation
        if (this.currentAnimation) {
            this.currentAnimation.update(dt);
        }
    }

    // ... rest of existing code ...
}
```

### D. Update the draw() method to render sprites:

```javascript
draw(ctx, camera) {
    if (this.isDead) return;

    const screen = Utils.worldToScreen(this.x, this.y, camera);

    ctx.save();

    // Flicker when invulnerable
    if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Draw sprite animation or fallback to circle
    if (this.currentAnimation) {
        const size = this.radius * 2.5;  // Make sprite bigger than collision circle

        // Flip sprite based on facing direction
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
        // Fallback: Draw circle if sprites not loaded
        Utils.drawCircle(ctx, screen.x, screen.y, this.radius, this.color, true);
        Utils.drawCircle(ctx, screen.x, screen.y, this.radius * 0.7, '#FFD700', true);

        // Directional indicator
        const indicatorLength = this.radius + 10;
        const indicatorX = screen.x + Math.cos(this.facingAngle) * indicatorLength;
        const indicatorY = screen.y + Math.sin(this.facingAngle) * indicatorLength;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(indicatorX, indicatorY);
        ctx.stroke();
    }

    // Keep name and level
    Utils.drawText(ctx, this.name, screen.x, screen.y - this.radius - 15, {
        align: 'center',
        font: 'bold 14px Arial',
        color: '#FFD700',
        shadow: true
    });

    Utils.drawText(ctx, `Lv.${this.level}`, screen.x, screen.y - this.radius - 30, {
        align: 'center',
        font: 'bold 12px Arial',
        color: '#FFFFFF',
        shadow: true
    });

    ctx.restore();

    // Health bar
    this.drawHealthBar(ctx, camera);
}
```

---

## 🔍 Step 4: Find the Correct Frame Size

If you don't know the frame size of your sprite sheet:

### Method 1: Open in image editor
1. Open `naruto_sheet.png` in any image editor
2. Zoom in and measure one character frame
3. Common sizes: 16x16, 24x24, 32x32, 48x48, 64x64, 96x96

### Method 2: Calculate from image
1. Right-click image → Properties → See dimensions
2. If image is 384x256 and has 6 columns, 4 rows:
   - Frame width = 384 / 6 = **64px**
   - Frame height = 256 / 4 = **64px**

### Method 3: Trial and error
Start with 64x64, adjust if animations look wrong:
```javascript
// Try these common sizes:
SpriteManager.loadSpriteSheet('naruto', 'path.png', 32, 32);  // Small
SpriteManager.loadSpriteSheet('naruto', 'path.png', 48, 48);  // Medium
SpriteManager.loadSpriteSheet('naruto', 'path.png', 64, 64);  // Large
```

---

## 🎮 Step 5: Add Walk vs Run Logic (Optional)

Make character walk slowly when barely moving the joystick:

```javascript
// In update() method, replace the movement animation switching:
if (this.isMoving) {
    // Calculate movement speed percentage
    const speedPercent = Math.sqrt(this.vx * this.vx + this.vy * this.vy) / this.speed;

    if (speedPercent > 0.6 && this.animations.run) {
        // Fast movement = Run
        if (this.currentAnimation !== this.animations.run) {
            this.currentAnimation = this.animations.run;
        }
    } else if (this.animations.walk) {
        // Slow movement = Walk
        if (this.currentAnimation !== this.animations.walk) {
            this.currentAnimation = this.animations.walk;
        }
    }
}
```

---

## 📋 Quick Checklist

- [ ] Downloaded sprite sheet from The Spriters Resource
- [ ] Saved to `assets/sprites/player/naruto_sheet.png`
- [ ] Identified frame size (32x32, 48x48, or 64x64?)
- [ ] Counted which row = which animation
- [ ] Added `loadSpriteSheet()` method to player.js
- [ ] Updated `update()` to switch animations
- [ ] Updated `draw()` to render sprite animations
- [ ] Tested in browser!

---

## 🐛 Troubleshooting

**Animations are chopped or misaligned?**
- Frame size is wrong - adjust width/height in loadSpriteSheet

**Wrong animation playing?**
- Check row numbers - count from 0 at the top

**Sprite is tiny or huge?**
- Adjust `size` in the draw() method: `const size = this.radius * 2.5;`

**Animation too fast/slow?**
- Adjust FPS in `new SpriteAnimation(..., FPS_HERE)`

**Character facing wrong direction?**
- Check flipX logic in draw() method

**Console shows "Could not load sprites"?**
- Check file path is correct
- Make sure file is PNG format
- Check filename matches exactly (case-sensitive!)

---

## 🎯 Example: Using The Naruto Sheet You Linked

```javascript
// For Naruto Shippuden sprites (typical layout):
async loadSpriteSheet() {
    this.spriteSheet = await SpriteManager.loadSpriteSheet(
        'naruto_sheet',
        'assets/sprites/player/naruto_sheet.png',
        64, 64  // Most Naruto sprites are 64x64
    );

    // Idle (usually row 0)
    this.animations.idle = new SpriteAnimation(
        this.spriteSheet,
        [{row: 0, col: 0}, {row: 0, col: 1}, {row: 0, col: 2}, {row: 0, col: 3}],
        6
    );

    // Run (usually row 1 or 2)
    this.animations.run = new SpriteAnimation(
        this.spriteSheet,
        [{row: 1, col: 0}, {row: 1, col: 1}, {row: 1, col: 2}, {row: 1, col: 3},
         {row: 1, col: 4}, {row: 1, col: 5}],
        12
    );

    this.currentAnimation = this.animations.idle;
}
```

---

## 🚀 Next Steps

1. Download your sprite sheet
2. Add the code to player.js
3. Adjust frame size and row numbers to match your sprite
4. Test and tweak!

Your character will now have smooth animated movement! 🎮
