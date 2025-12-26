// Enemy class for Naruto Action RPG

class Enemy extends Combatant {
    constructor(typeId, x, y) {
        const type = EnemySystem.enemyTypes[typeId];
        if (!type) {
            throw new Error(`Enemy type ${typeId} not found`);
        }

        super(x, y, type.radius);

        // Identity
        this.typeId = typeId;
        this.name = type.name;
        this.type = type.type;

        // Stats
        this.maxHealth = type.health;
        this.health = type.health;
        this.damage = type.damage;
        this.defense = type.defense;
        this.speed = type.speed;
        this.xpReward = type.xpReward;

        // Combat
        this.attackRange = type.attackRange;
        this.attackCooldown = type.attackCooldown;
        this.lastAttackTime = 0;
        this.detectionRange = type.detectionRange;

        // Abilities
        this.abilities = type.abilities || [];
        this.abilityCooldowns = {};
        this.lastAbilityTime = 0;

        // AI
        this.state = 'idle'; // idle, chase, attack
        this.target = null;

        // Visual
        this.color = type.color;
        this.deathTime = 0;

        // Loot
        this.lootTable = type.lootTable;

        // Boss specific
        this.isBoss = type.type === 'boss';
        this.phases = type.phases ? [...type.phases] : null;
        this.currentPhase = 0;
        this.phaseChanged = false;
    }

    // Update enemy
    update(game, dt) {
        if (this.isDead) {
            this.deathTime += dt;
            return;
        }

        // Call parent update
        super.update(game, dt);

        // Update AI
        this.updateAI(game, dt);

        // Update animation
        if (this.state === 'chase') {
            this.animationFrame = Math.floor(this.animationTime * 8) % 4;
        } else {
            this.animationFrame = 0;
        }

        // Boss phase check
        if (this.isBoss && this.phases) {
            this.checkPhaseTransition(game);
        }
    }

    // Update AI
    updateAI(game, dt) {
        const player = game.player;
        if (!player || player.isDead) {
            this.state = 'idle';
            return;
        }

        const distToPlayer = this.distanceTo(player);

        // State machine
        if (distToPlayer <= this.detectionRange) {
            this.target = player;

            if (distToPlayer <= this.attackRange) {
                // Attack state
                this.state = 'attack';
                this.attackPlayer(player, game, dt);

                // Face player
                this.facingAngle = this.angleTo(player);

                // Stop moving
                this.vx = 0;
                this.vy = 0;
            } else {
                // Chase state
                this.state = 'chase';

                // Move towards player
                const angle = this.angleTo(player);
                this.facingAngle = angle;

                let speed = this.speed;

                // Apply phase speed multiplier for bosses
                if (this.isBoss && this.phases) {
                    const phase = this.phases[this.currentPhase];
                    speed *= phase.speedMultiplier || 1.0;
                }

                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;

                this.x += this.vx * dt;
                this.y += this.vy * dt;
            }
        } else {
            // Idle state
            this.state = 'idle';
            this.target = null;
            this.vx = 0;
            this.vy = 0;
        }

        // Keep in bounds
        if (game.currentMap) {
            this.x = Utils.clamp(this.x, this.radius, game.currentMap.width - this.radius);
            this.y = Utils.clamp(this.y, this.radius, game.currentMap.height - this.radius);
        }
    }

    // Attack player
    attackPlayer(player, game, dt) {
        this.lastAttackTime += dt;
        this.lastAbilityTime += dt;

        // Try to use ability first (if enemy has abilities)
        if (this.abilities && this.abilities.length > 0 && this.lastAbilityTime >= 5) {
            // 50% chance to use ability instead of basic attack
            if (Math.random() < 0.5) {
                const abilityUsed = this.useAbility(player, game);
                if (abilityUsed) {
                    this.lastAbilityTime = 0;
                    return;
                }
            }
        }

        let cooldown = this.attackCooldown;

        // Apply phase attack speed for bosses
        if (this.isBoss && this.phases) {
            const phase = this.phases[this.currentPhase];
            cooldown *= phase.attackCooldownMultiplier || 1.0;
        }

        if (this.lastAttackTime >= cooldown) {
            let damage = this.damage;

            // Apply phase damage multiplier for bosses
            if (this.isBoss && this.phases) {
                const phase = this.phases[this.currentPhase];
                damage *= phase.damageMultiplier || 1.0;
            }

            damage = Utils.calculateDamage(damage);
            player.takeDamage(damage, game);

            this.lastAttackTime = 0;

            // Visual effect
            this.createAttackEffect(player, game);
        }
    }

    // Use enemy ability
    useAbility(player, game) {
        if (!this.abilities || this.abilities.length === 0) return false;

        // Pick a random ability
        const abilityId = Utils.randomChoice(this.abilities);
        const ability = EnemySystem.enemyAbilities[abilityId];

        if (!ability) return false;

        // Cast the ability
        ability.cast(this, player, game);
        return true;
    }

    // Create attack visual effect
    createAttackEffect(player, game) {
        if (!game.particles) game.particles = [];

        const angle = this.angleTo(player);

        for (let i = 0; i < 10; i++) {
            const spreadAngle = angle + Utils.randomFloat(-0.5, 0.5);
            const speed = Utils.randomFloat(100, 200);
            const particle = Utils.createParticle(
                this.x,
                this.y,
                Math.cos(spreadAngle) * speed,
                Math.sin(spreadAngle) * speed,
                this.color,
                Utils.randomFloat(3, 6),
                0.3
            );
            game.particles.push(particle);
        }
    }

    // Check boss phase transition
    checkPhaseTransition(game) {
        if (!this.phases || this.currentPhase >= this.phases.length - 1) {
            return;
        }

        const healthPercent = this.health / this.maxHealth;
        const nextPhase = this.phases[this.currentPhase + 1];

        if (healthPercent <= nextPhase.healthThreshold) {
            this.currentPhase++;
            this.phaseChanged = true;

            // Apply special effects
            const phase = this.phases[this.currentPhase];
            if (phase.specialEffect === 'hidden_mist') {
                game.activateHiddenMist();
            }

            // Show notification
            game.showNotification(`${this.name}: ${phase.name}!`);

            // Visual effect
            this.createPhaseTransitionEffect(game);
        }
    }

    // Create phase transition effect
    createPhaseTransitionEffect(game) {
        if (!game.particles) game.particles = [];

        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.randomFloat(150, 300);
            const particle = Utils.createParticle(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Utils.randomChoice(['#4DA6FF', '#FFFFFF', this.color]),
                Utils.randomFloat(5, 10),
                1.0
            );
            game.particles.push(particle);
        }
    }

    // Take damage (override)
    takeDamage(damage, game) {
        if (this.isDead) return;

        const actualDamage = Math.max(1, damage - this.defense * 0.3);
        this.health -= actualDamage;

        if (this.health <= 0) {
            this.health = 0;
            this.die(game);
        }
    }

    // Die (override)
    die(game) {
        this.isDead = true;

        AudioManager.play(this.isBoss ? 'boss_hit' : 'enemy_die');

        // Award XP to player
        if (game.player) {
            game.player.gainXP(this.xpReward, game);
        }

        // Drop loot
        if (this.lootTable) {
            const item = ItemSystem.generateLoot(this.lootTable);
            if (item) {
                const drop = ItemSystem.createItemDrop(this.x, this.y, item);
                if (!game.itemDrops) game.itemDrops = [];
                game.itemDrops.push(drop);
            }
        }

        // Death effect
        this.createDeathEffect(game);

        // Boss death
        if (this.isBoss) {
            game.onBossDefeated(this);
        }
    }

    // Create death visual effect
    createDeathEffect(game) {
        if (!game.particles) game.particles = [];

        const particleCount = this.isBoss ? 100 : 30;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.randomFloat(100, 250);
            const particle = Utils.createParticle(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                this.color,
                Utils.randomFloat(4, 8),
                0.8
            );
            game.particles.push(particle);
        }
    }

    // Draw enemy
    draw(ctx, camera) {
        const screen = Utils.worldToScreen(this.x, this.y, camera);

        ctx.save();

        if (this.isDead) {
            // Fade out
            ctx.globalAlpha = Math.max(0, 1 - this.deathTime * 2);
        }

        // Draw enemy circle
        Utils.drawCircle(ctx, screen.x, screen.y, this.radius, this.color, true);

        // Draw inner circle
        const innerColor = this.isBoss ? '#FFD700' : '#CCCCCC';
        Utils.drawCircle(ctx, screen.x, screen.y, this.radius * 0.6, innerColor, true);

        // Draw type indicator
        if (this.type === 'elite') {
            Utils.drawText(ctx, '★', screen.x, screen.y - 8, {
                align: 'center',
                font: 'bold 20px Arial',
                color: '#FFD700'
            });
        } else if (this.isBoss) {
            Utils.drawText(ctx, '👹', screen.x, screen.y - 10, {
                align: 'center',
                font: '24px Arial'
            });
        } else {
            Utils.drawText(ctx, 'E', screen.x, screen.y - 5, {
                align: 'center',
                font: 'bold 16px Arial',
                color: '#000000'
            });
        }

        // Draw name
        Utils.drawText(ctx, this.name, screen.x, screen.y - this.radius - 15, {
            align: 'center',
            font: this.isBoss ? 'bold 16px Arial' : 'bold 12px Arial',
            color: this.isBoss ? '#FFD700' : '#FFFFFF',
            shadow: true
        });

        // Draw boss phase
        if (this.isBoss && this.phases) {
            const phase = this.phases[this.currentPhase];
            Utils.drawText(ctx, phase.name, screen.x, screen.y - this.radius - 30, {
                align: 'center',
                font: 'bold 12px Arial',
                color: '#FF6B1A',
                shadow: true
            });
        }

        ctx.restore();

        // Draw health bar
        this.drawHealthBar(ctx, screen);
    }

    // Draw health bar
    drawHealthBar(ctx, screen) {
        const barWidth = this.radius * 2.5;
        const barHeight = this.isBoss ? 10 : 6;
        const barY = screen.y + this.radius + 8;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screen.x - barWidth / 2, barY, barWidth, barHeight);

        // Health fill
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = this.isBoss ? '#CC0000' : (healthPercent > 0.5 ? '#00CC66' : '#FFD700');
        ctx.fillRect(screen.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = this.isBoss ? '#FFD700' : '#FFFFFF';
        ctx.lineWidth = this.isBoss ? 2 : 1;
        ctx.strokeRect(screen.x - barWidth / 2, barY, barWidth, barHeight);
    }
}

// EnemySystem - Enemy type registry and utilities
const EnemySystem = {
    // Enemy type definitions
    enemyTypes: {
        'bandit': {
            id: 'bandit',
            name: 'Bandit',
            type: 'fodder',
            health: 40,
            damage: 8,
            defense: 2,
            speed: 120,
            xpReward: 15,
            radius: 20,
            color: '#8B4513',
            attackRange: 50,
            attackCooldown: 2.0,
            detectionRange: 250,
            lootTable: 'bandit'
        },

        'demon_brother': {
            id: 'demon_brother',
            name: 'Demon Brother',
            type: 'elite',
            health: 120,
            damage: 15,
            defense: 5,
            speed: 150,
            xpReward: 50,
            radius: 25,
            color: '#4A0E4E',
            attackRange: 60,
            attackCooldown: 1.5,
            detectionRange: 300,
            lootTable: 'demon_brother',
            abilities: ['poison_claw']
        },

        'zabuza': {
            id: 'zabuza',
            name: 'Zabuza Momochi',
            type: 'boss',
            health: 500,
            damage: 25,
            defense: 10,
            speed: 180,
            xpReward: 250,
            radius: 35,
            color: '#1A4D6D',
            attackRange: 80,
            attackCooldown: 1.2,
            detectionRange: 500,
            lootTable: 'zabuza',
            abilities: ['water_dragon', 'executioners_blade'],
            phases: [
                {
                    healthThreshold: 1.0,
                    name: 'Phase 1',
                    behavior: 'melee',
                    damageMultiplier: 1.0,
                    speedMultiplier: 1.0
                },
                {
                    healthThreshold: 0.5,
                    name: 'Phase 2: Hidden Mist',
                    behavior: 'mist',
                    damageMultiplier: 1.3,
                    speedMultiplier: 1.2,
                    specialEffect: 'hidden_mist'
                },
                {
                    healthThreshold: 0.25,
                    name: 'Phase 3: Enraged',
                    behavior: 'enraged',
                    damageMultiplier: 1.5,
                    speedMultiplier: 1.4,
                    attackCooldownMultiplier: 0.7
                }
            ]
        }
    },

    // Enemy Abilities
    enemyAbilities: {
        'poison_claw': {
            name: 'Poison Claw',
            type: 'melee',
            cooldown: 8,
            cast(enemy, player, game) {
                // Deal damage + poison effect
                let damage = enemy.damage * 1.5;
                damage = Utils.calculateDamage(damage);
                player.takeDamage(damage, game);

                // Apply poison status (deal damage over time)
                if (!player.statusEffects) player.statusEffects = [];
                player.statusEffects.push({
                    type: 'poison',
                    duration: 5,
                    value: { damagePerSecond: 5 },
                    onUpdate(target, dt) {
                        this.duration -= dt;
                        const poisonDamage = this.value.damagePerSecond * dt;
                        target.health -= poisonDamage;
                        if (target.health < 0) target.health = 0;
                    }
                });

                game.showNotification('Poisoned!', 2000);
                this.createPoisonEffect(enemy, player, game);
            },
            createPoisonEffect(enemy, player, game) {
                if (!game.particles) game.particles = [];
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Utils.randomFloat(80, 150);
                    const particle = Utils.createParticle(
                        player.x,
                        player.y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#8B008B',
                        Utils.randomFloat(4, 8),
                        0.6
                    );
                    game.particles.push(particle);
                }
            }
        },

        'water_dragon': {
            name: 'Water Dragon Jutsu',
            type: 'projectile',
            cooldown: 10,
            cast(enemy, player, game) {
                if (!game.projectiles) game.projectiles = [];

                const angle = Utils.angleBetween(enemy.x, enemy.y, player.x, player.y);
                const speed = 300;

                const projectile = {
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 25,
                    damage: enemy.damage * 2.5,
                    lifetime: 3,
                    age: 0,
                    type: 'water_dragon',
                    owner: enemy,
                    color: '#1E90FF'
                };

                game.projectiles.push(projectile);
                game.showNotification('Water Dragon Jutsu!', 2000);
                AudioManager.play('boss_hit');
                this.createWaterEffect(enemy, game);
            },
            createWaterEffect(enemy, game) {
                if (!game.particles) game.particles = [];
                for (let i = 0; i < 30; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Utils.randomFloat(100, 200);
                    const particle = Utils.createParticle(
                        enemy.x,
                        enemy.y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        Utils.randomChoice(['#1E90FF', '#4169E1', '#00BFFF']),
                        Utils.randomFloat(5, 10),
                        0.8
                    );
                    game.particles.push(particle);
                }
            }
        },

        'executioners_blade': {
            name: 'Executioners Blade',
            type: 'melee_aoe',
            cooldown: 12,
            cast(enemy, player, game) {
                // AOE attack around Zabuza
                const range = 150;
                const dist = Utils.distance(enemy.x, enemy.y, player.x, player.y);

                if (dist <= range) {
                    let damage = enemy.damage * 3;
                    damage = Utils.calculateDamage(damage);
                    player.takeDamage(damage, game);
                }

                game.showNotification('Executioners Blade!', 2000);
                AudioManager.play('boss_hit');
                this.createBladeEffect(enemy, game);
            },
            createBladeEffect(enemy, game) {
                if (!game.particles) game.particles = [];
                for (let i = 0; i < 50; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Utils.randomFloat(150, 300);
                    const particle = Utils.createParticle(
                        enemy.x,
                        enemy.y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        Utils.randomChoice(['#808080', '#C0C0C0', '#FFFFFF']),
                        Utils.randomFloat(6, 12),
                        0.5
                    );
                    game.particles.push(particle);
                }
            }
        }
    },

    // Create enemy instance
    createEnemy(typeId, x, y) {
        return new Enemy(typeId, x, y);
    },

    // Spawn wave of enemies
    spawnWave(game, waveConfig) {
        if (!game.enemies) game.enemies = [];

        for (let spawn of waveConfig) {
            const enemy = this.createEnemy(spawn.type, spawn.x, spawn.y);
            if (enemy) {
                game.enemies.push(enemy);
            }
        }
    },

    // Static methods for backward compatibility
    update(enemy, game, dt) {
        enemy.update(game, dt);
    },

    takeDamage(enemy, damage, game) {
        enemy.takeDamage(damage, game);
    },

    draw(ctx, enemy, camera) {
        enemy.draw(ctx, camera);
    }
};
