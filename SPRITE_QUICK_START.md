# 🚀 Quick Start: Test Sprites in 5 Minutes

## Option 1: Use a Placeholder Image (Fastest)

You can test the sprite system immediately without downloading anything:

### Step 1: Create a test image
Use any online sprite generator or create a simple colored square:
- Size: 32x32 pixels
- Save as: `assets/sprites/player/test_player.png`

Or use a free online tool:
- https://www.pixilart.com/draw (draw a simple character)
- https://www.piskelapp.com/ (create pixel art)

### Step 2: Add to player.js

In `js/player.js`, add this to the constructor (around line 88):

```javascript
// Add after this.color = charDef.color;
this.sprite = null;
this.loadSprite();
```

Then add this new method:

```javascript
// Add after the constructor
loadSprite() {
    SpriteManager.loadSprite('player_test', 'assets/sprites/player/test_player.png')
        .then(img => {
            this.sprite = img;
            console.log('Player sprite loaded!');
        })
        .catch(err => {
            console.log('Sprite not found, using circle');
        });
}
```

### Step 3: Update the draw method

In `js/player.js`, find the `draw(ctx, camera)` method (around line 308) and modify it:

```javascript
draw(ctx, camera) {
    if (this.isDead) return;

    const screen = Utils.worldToScreen(this.x, this.y, camera);

    ctx.save();

    // Flicker when invulnerable
    if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // NEW: Draw sprite if loaded, otherwise fall back to circle
    if (this.sprite) {
        const size = this.radius * 2;
        const flipX = this.facingAngle > Math.PI/2 || this.facingAngle < -Math.PI/2;

        if (flipX) {
            ctx.save();
            ctx.translate(screen.x, screen.y);
            ctx.scale(-1, 1);
            ctx.drawImage(this.sprite, -size/2, -size/2, size, size);
            ctx.restore();
        } else {
            ctx.drawImage(this.sprite, screen.x - size/2, screen.y - size/2, size, size);
        }
    } else {
        // Fallback: original circle
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

    // Keep name and level text
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

### Step 4: Test!

1. Open your game in browser
2. Check console (F12) - should see "Player sprite loaded!"
3. You should see your sprite instead of the orange circle

---

## Option 2: Download Real Ninja Sprites

### Best Quick Option: Ninja Adventure Pack

1. Go to: https://pixel-boy.itch.io/ninja-adventure-asset-pack
2. Click "Download Now" (enter $0 or any amount)
3. Extract the ZIP file
4. Look for folders like:
   - `Actor/Characters/` - Character sprites
   - `Items/` - Item sprites
   - `FX/` - Effect animations

5. Find a character sprite (usually 32x32 or 48x48)
6. Copy to: `assets/sprites/player/naruto_idle.png`
7. Update the path in your code:
   ```javascript
   SpriteManager.loadSprite('player_test', 'assets/sprites/player/naruto_idle.png')
   ```

---

## ⚡ Even Faster: Use Data URL

Don't want to create a file? Use a base64 image directly:

```javascript
// Simple orange square sprite (for testing)
this.sprite = new Image();
this.sprite.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA0SURBVFhH7c4xAQAwDMSg+DcdjLGhCuiBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHDuAbsOBAAIJnN4AAAAAElFTkSuQmCC';
```

This creates a small orange square for testing!

---

## 📋 Checklist

- [ ] sprites.js is loaded in index.html ✅ (already done)
- [ ] Created assets/sprites/ folders ✅ (already done)
- [ ] Added loadSprite() method to player.js
- [ ] Updated draw() method to use sprite
- [ ] Tested in browser

---

## 🎯 Next Steps

Once basic sprites work:
1. Add animated sprite sheets (running, attacking)
2. Add enemy sprites
3. Add effect sprites (explosions, abilities)
4. Add projectile sprites (kunai, shuriken)

See `SPRITE_GUIDE.md` for full details!

---

## 🐛 Troubleshooting

**Sprite not showing?**
- Open browser console (F12) - check for errors
- Verify file path is correct
- Make sure image is 32x32 or smaller
- Check that sprites.js loaded before player.js

**Sprite is blurry?**
- Already fixed! CSS has `image-rendering: pixelated`

**Still see circles?**
- That's the fallback - sprite might not be loaded yet
- Check console for "Player sprite loaded!" message
