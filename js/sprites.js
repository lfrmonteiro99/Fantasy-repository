// Sprite Loading and Animation System for Naruto Action RPG

class SpriteLoader {
    constructor() {
        this.sprites = {};
        this.loaded = {};
        this.loadingPromises = [];
    }

    // Load a single sprite
    loadSprite(key, path) {
        if (this.loaded[key]) {
            return Promise.resolve(this.sprites[key]);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites[key] = img;
                this.loaded[key] = true;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load sprite: ${path}`);
                // Create a fallback colored rectangle
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FF6B1A';
                ctx.fillRect(0, 0, 32, 32);
                this.sprites[key] = canvas;
                this.loaded[key] = true;
                resolve(canvas);
            };
            img.src = path;
        });

        this.loadingPromises.push(promise);
        return promise;
    }

    // Load sprite sheet (for animations)
    loadSpriteSheet(key, path, frameWidth, frameHeight) {
        return this.loadSprite(key, path).then(img => {
            return {
                image: img,
                frameWidth: frameWidth,
                frameHeight: frameHeight,
                columns: Math.floor(img.width / frameWidth),
                rows: Math.floor(img.height / frameHeight)
            };
        });
    }

    // Get loaded sprite
    getSprite(key) {
        return this.sprites[key] || null;
    }

    // Wait for all sprites to load
    waitForAll() {
        return Promise.all(this.loadingPromises);
    }
}

// Sprite Animation Handler
class SpriteAnimation {
    constructor(spriteSheet, frames, fps = 10) {
        this.spriteSheet = spriteSheet; // { image, frameWidth, frameHeight, columns, rows }
        this.frames = frames; // Array of frame indices or {row, col} objects
        this.fps = fps;
        this.currentFrame = 0;
        this.animationTime = 0;
        this.frameDuration = 1 / fps;
        this.loop = true;
        this.playing = true;
    }

    update(dt) {
        if (!this.playing) return;

        this.animationTime += dt;
        if (this.animationTime >= this.frameDuration) {
            this.animationTime -= this.frameDuration;
            this.currentFrame++;

            if (this.currentFrame >= this.frames.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frames.length - 1;
                    this.playing = false;
                }
            }
        }
    }

    // Get current frame position
    getCurrentFrame() {
        const frameIndex = this.frames[this.currentFrame];

        if (typeof frameIndex === 'number') {
            // Linear frame index
            const col = frameIndex % this.spriteSheet.columns;
            const row = Math.floor(frameIndex / this.spriteSheet.columns);
            return { row, col };
        } else {
            // {row, col} object
            return frameIndex;
        }
    }

    // Draw the current frame
    draw(ctx, x, y, width = null, height = null, flipX = false) {
        const frame = this.getCurrentFrame();
        const sx = frame.col * this.spriteSheet.frameWidth;
        const sy = frame.row * this.spriteSheet.frameHeight;

        const dWidth = width || this.spriteSheet.frameWidth;
        const dHeight = height || this.spriteSheet.frameHeight;

        ctx.save();

        if (flipX) {
            ctx.translate(x + dWidth, y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.spriteSheet.image,
                sx, sy, this.spriteSheet.frameWidth, this.spriteSheet.frameHeight,
                0, 0, dWidth, dHeight
            );
        } else {
            ctx.drawImage(
                this.spriteSheet.image,
                sx, sy, this.spriteSheet.frameWidth, this.spriteSheet.frameHeight,
                x, y, dWidth, dHeight
            );
        }

        ctx.restore();
    }

    reset() {
        this.currentFrame = 0;
        this.animationTime = 0;
        this.playing = true;
    }
}

// Global sprite loader instance
const SpriteManager = new SpriteLoader();

// Preload game sprites
async function preloadGameSprites() {
    const sprites = [
        // Player sprites (you'll add these after downloading)
        { key: 'naruto_idle', path: 'assets/sprites/player/naruto_idle.png', sheet: true, fw: 32, fh: 32 },
        { key: 'naruto_run', path: 'assets/sprites/player/naruto_run.png', sheet: true, fw: 32, fh: 32 },
        { key: 'naruto_attack', path: 'assets/sprites/player/naruto_attack.png', sheet: true, fw: 32, fh: 32 },

        // Enemy sprites
        { key: 'enemy_basic', path: 'assets/sprites/enemies/basic_enemy.png', sheet: true, fw: 32, fh: 32 },
        { key: 'enemy_elite', path: 'assets/sprites/enemies/elite_enemy.png', sheet: true, fw: 48, fh: 48 },
        { key: 'enemy_boss', path: 'assets/sprites/enemies/boss_enemy.png', sheet: true, fw: 64, fh: 64 },

        // Effects
        { key: 'rasengan_effect', path: 'assets/sprites/effects/rasengan.png' },
        { key: 'kunai', path: 'assets/sprites/projectiles/kunai.png' },
        { key: 'shadow_clone', path: 'assets/sprites/effects/clone.png' }
    ];

    for (let sprite of sprites) {
        if (sprite.sheet) {
            await SpriteManager.loadSpriteSheet(sprite.key, sprite.path, sprite.fw, sprite.fh);
        } else {
            await SpriteManager.loadSprite(sprite.key, sprite.path);
        }
    }

    return SpriteManager.waitForAll();
}
