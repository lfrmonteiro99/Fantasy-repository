// Utility Functions for Naruto Action RPG

const Utils = {
    // Math utilities
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // Circle-rectangle collision
    circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
        const testX = Utils.clamp(cx, rx, rx + rw);
        const testY = Utils.clamp(cy, ry, ry + rh);
        const distX = cx - testX;
        const distY = cy - testY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        return distance <= radius;
    },

    // Circle-circle collision
    circleCollision(x1, y1, r1, x2, y2, r2) {
        return Utils.distance(x1, y1, x2, y2) <= (r1 + r2);
    },

    // Rectangle-rectangle collision
    rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 &&
               x1 + w1 > x2 &&
               y1 < y2 + h2 &&
               y1 + h1 > y2;
    },

    // Normalize angle to -PI to PI range
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    },

    // Get screen coordinates from world coordinates
    worldToScreen(worldX, worldY, camera) {
        return {
            x: worldX - camera.x,
            y: worldY - camera.y
        };
    },

    // Get world coordinates from screen coordinates
    screenToWorld(screenX, screenY, camera) {
        return {
            x: screenX + camera.x,
            y: screenY + camera.y
        };
    },

    // Format large numbers
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.floor(num).toString();
    },

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Simple easing functions
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    easeOutQuad(t) {
        return t * (2 - t);
    },

    easeInQuad(t) {
        return t * t;
    },

    // Color utilities
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    // Particle system helper
    createParticle(x, y, velocityX, velocityY, color, size, lifetime) {
        return {
            x, y,
            vx: velocityX,
            vy: velocityY,
            color,
            size,
            lifetime,
            age: 0,
            alpha: 1
        };
    },

    updateParticle(particle, dt) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.age += dt;
        particle.alpha = 1 - (particle.age / particle.lifetime);
        return particle.age < particle.lifetime;
    },

    drawParticle(ctx, particle, camera) {
        const screen = Utils.worldToScreen(particle.x, particle.y, camera);
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // XP calculation
    getXPForLevel(level) {
        // Simple exponential formula: 100 * (1.5 ^ (level - 1))
        return Math.floor(100 * Math.pow(1.5, level - 1));
    },

    // Damage calculation with variance
    calculateDamage(baseDamage, variance = 0.1) {
        const min = baseDamage * (1 - variance);
        const max = baseDamage * (1 + variance);
        return Math.floor(Utils.randomFloat(min, max));
    },

    // Status effect utilities
    applyStatusEffect(entity, effect) {
        if (!entity.statusEffects) {
            entity.statusEffects = [];
        }

        // Remove existing effect of same type
        entity.statusEffects = entity.statusEffects.filter(e => e.type !== effect.type);

        // Add new effect
        entity.statusEffects.push({
            type: effect.type,
            duration: effect.duration,
            value: effect.value,
            tickRate: effect.tickRate || 1,
            lastTick: 0
        });
    },

    updateStatusEffects(entity, dt) {
        if (!entity.statusEffects) return;

        entity.statusEffects = entity.statusEffects.filter(effect => {
            effect.duration -= dt;

            if (effect.duration <= 0) {
                return false; // Remove expired effect
            }

            // Handle ticking effects (like DoT)
            if (effect.tickRate) {
                effect.lastTick += dt;
                if (effect.lastTick >= effect.tickRate) {
                    effect.lastTick = 0;
                    // Apply effect (handled by caller)
                    if (effect.onTick) {
                        effect.onTick(entity);
                    }
                }
            }

            return true;
        });
    },

    // Canvas utilities
    drawText(ctx, text, x, y, options = {}) {
        const {
            font = '16px Arial',
            color = '#FFFFFF',
            align = 'left',
            baseline = 'top',
            stroke = false,
            strokeColor = '#000000',
            strokeWidth = 2,
            shadow = false,
            shadowColor = '#000000',
            shadowBlur = 4,
            shadowOffsetX = 2,
            shadowOffsetY = 2
        } = options;

        ctx.save();
        ctx.font = font;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.fillStyle = color;

        if (shadow) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur;
            ctx.shadowOffsetX = shadowOffsetX;
            ctx.shadowOffsetY = shadowOffsetY;
        }

        if (stroke) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.strokeText(text, x, y);
        }

        ctx.fillText(text, x, y);
        ctx.restore();
    },

    drawCircle(ctx, x, y, radius, color, fill = true) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.stroke();
        }

        ctx.restore();
    },

    drawRect(ctx, x, y, width, height, color, fill = true) {
        ctx.save();

        if (fill) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, width, height);
        } else {
            ctx.strokeStyle = color;
            ctx.strokeRect(x, y, width, height);
        }

        ctx.restore();
    },

    // Mobile detection
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // Touch/mouse position helper
    getInputPosition(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if (event.touches && event.touches.length > 0) {
            return {
                x: (event.touches[0].clientX - rect.left) * scaleX,
                y: (event.touches[0].clientY - rect.top) * scaleY
            };
        } else {
            return {
                x: (event.clientX - rect.left) * scaleX,
                y: (event.clientY - rect.top) * scaleY
            };
        }
    },

    // FPS counter
    createFPSCounter() {
        return {
            frames: 0,
            lastTime: performance.now(),
            fps: 60,
            update() {
                this.frames++;
                const currentTime = performance.now();
                if (currentTime >= this.lastTime + 1000) {
                    this.fps = Math.round(this.frames * 1000 / (currentTime - this.lastTime));
                    this.frames = 0;
                    this.lastTime = currentTime;
                }
            }
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
