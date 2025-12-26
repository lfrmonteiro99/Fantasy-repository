// Base Entity class for all game entities (Players, Enemies, NPCs)

class Entity {
    constructor(x, y, radius) {
        // Position
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = radius;
        this.facingAngle = 0;

        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.damage = 10;
        this.defense = 5;
        this.speed = 150;

        // State
        this.isDead = false;
        this.invulnerable = false;
        this.invulnerableTime = 0;

        // Visual
        this.color = '#FFFFFF';
        this.animationFrame = 0;
        this.animationTime = 0;

        // Status effects
        this.statusEffects = [];
    }

    // Take damage - to be overridden by subclasses
    takeDamage(damage, game) {
        if (this.isDead || this.invulnerable) return;

        const actualDamage = Math.max(1, damage - this.defense * 0.5);
        this.health -= actualDamage;

        if (this.health <= 0) {
            this.health = 0;
            this.die(game);
        }
    }

    // Die - to be overridden by subclasses
    die(game) {
        this.isDead = true;
    }

    // Update - to be overridden by subclasses
    update(game, dt) {
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTime -= dt;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Update status effects
        if (this.statusEffects && Utils.updateStatusEffects) {
            Utils.updateStatusEffects(this, dt);
        }

        // Update animation
        this.animationTime += dt;
    }

    // Draw - to be overridden by subclasses
    draw(ctx, camera) {
        const screen = Utils.worldToScreen(this.x, this.y, camera);
        Utils.drawCircle(ctx, screen.x, screen.y, this.radius, this.color, true);
    }

    // Check collision with another entity
    collidesWith(other) {
        const dist = Utils.distance(this.x, this.y, other.x, other.y);
        return dist <= this.radius + other.radius;
    }

    // Get distance to another entity
    distanceTo(other) {
        return Utils.distance(this.x, this.y, other.x, other.y);
    }

    // Get angle to another entity
    angleTo(other) {
        return Utils.angleBetween(this.x, this.y, other.x, other.y);
    }
}

// Combatant class for entities that can fight
class Combatant extends Entity {
    constructor(x, y, radius) {
        super(x, y, radius);

        // Combat stats
        this.attackRange = 60;
        this.attackCooldown = 1.0;
        this.lastAttackTime = 0;
    }

    // Attack another combatant - to be overridden
    attack(target, game) {
        if (this.lastAttackTime >= this.attackCooldown) {
            const damage = Utils.calculateDamage(this.damage);
            target.takeDamage(damage, game);
            this.lastAttackTime = 0;
            this.facingAngle = this.angleTo(target);
        }
    }

    // Check if can attack
    canAttack() {
        return this.lastAttackTime >= this.attackCooldown && !this.isDead;
    }

    // Update combat timers
    updateCombat(dt) {
        this.lastAttackTime += dt;
    }
}
