// Enemy System for Naruto Action RPG

const EnemySystem = {
    // Enemy definitions
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
            abilities: ['poison_claw'] // Elite enemies can have abilities
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
            ],
            currentPhase: 0
        }
    },

    // Create enemy instance
    createEnemy(typeId, x, y) {
        const type = this.enemyTypes[typeId];
        if (!type) {
            console.error(`Enemy type ${typeId} not found`);
            return null;
        }

        const enemy = {
            // Identity
            typeId: typeId,
            name: type.name,
            type: type.type,

            // Position
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            radius: type.radius,

            // Stats
            maxHealth: type.health,
            health: type.health,
            damage: type.damage,
            defense: type.defense,
            speed: type.speed,
            xpReward: type.xpReward,

            // Combat
            attackRange: type.attackRange,
            attackCooldown: type.attackCooldown,
            lastAttackTime: 0,
            detectionRange: type.detectionRange,
            isDead: false,
            deathTime: 0,

            // AI
            state: 'idle', // idle, chase, attack
            target: null,
            facingAngle: 0,

            // Visual
            color: type.color,
            animationFrame: 0,
            animationTime: 0,

            // Loot
            lootTable: type.lootTable,

            // Boss specific
            isBoss: type.type === 'boss',
            phases: type.phases ? [...type.phases] : null,
            currentPhase: 0,
            phaseChanged: false
        };

        return enemy;
    },

    // Update enemy
    update(enemy, game, dt) {
        if (enemy.isDead) {
            enemy.deathTime += dt;
            return;
        }

        // Update AI
        this.updateAI(enemy, game, dt);

        // Update animation
        enemy.animationTime += dt;
        if (enemy.state === 'chase') {
            enemy.animationFrame = Math.floor(enemy.animationTime * 8) % 4;
        } else {
            enemy.animationFrame = 0;
        }

        // Boss phase check
        if (enemy.isBoss && enemy.phases) {
            this.checkPhaseTransition(enemy, game);
        }
    },

    // Update AI
    updateAI(enemy, game, dt) {
        const player = game.player;
        if (!player || player.isDead) {
            enemy.state = 'idle';
            return;
        }

        const distToPlayer = Utils.distance(enemy.x, enemy.y, player.x, player.y);

        // State machine
        if (distToPlayer <= enemy.detectionRange) {
            enemy.target = player;

            if (distToPlayer <= enemy.attackRange) {
                // Attack state
                enemy.state = 'attack';
                this.attackPlayer(enemy, player, game, dt);

                // Face player
                enemy.facingAngle = Utils.angleBetween(enemy.x, enemy.y, player.x, player.y);

                // Stop moving
                enemy.vx = 0;
                enemy.vy = 0;
            } else {
                // Chase state
                enemy.state = 'chase';

                // Move towards player
                const angle = Utils.angleBetween(enemy.x, enemy.y, player.x, player.y);
                enemy.facingAngle = angle;

                let speed = enemy.speed;

                // Apply phase speed multiplier for bosses
                if (enemy.isBoss && enemy.phases) {
                    const phase = enemy.phases[enemy.currentPhase];
                    speed *= phase.speedMultiplier || 1.0;
                }

                enemy.vx = Math.cos(angle) * speed;
                enemy.vy = Math.sin(angle) * speed;

                enemy.x += enemy.vx * dt;
                enemy.y += enemy.vy * dt;
            }
        } else {
            // Idle state
            enemy.state = 'idle';
            enemy.target = null;
            enemy.vx = 0;
            enemy.vy = 0;
        }

        // Keep in bounds
        if (game.currentMap) {
            enemy.x = Utils.clamp(enemy.x, enemy.radius, game.currentMap.width - enemy.radius);
            enemy.y = Utils.clamp(enemy.y, enemy.radius, game.currentMap.height - enemy.radius);
        }
    },

    // Attack player
    attackPlayer(enemy, player, game, dt) {
        enemy.lastAttackTime += dt;

        let cooldown = enemy.attackCooldown;

        // Apply phase attack speed for bosses
        if (enemy.isBoss && enemy.phases) {
            const phase = enemy.phases[enemy.currentPhase];
            cooldown *= phase.attackCooldownMultiplier || 1.0;
        }

        if (enemy.lastAttackTime >= cooldown) {
            let damage = enemy.damage;

            // Apply phase damage multiplier for bosses
            if (enemy.isBoss && enemy.phases) {
                const phase = enemy.phases[enemy.currentPhase];
                damage *= phase.damageMultiplier || 1.0;
            }

            damage = Utils.calculateDamage(damage);
            PlayerSystem.takeDamage(player, damage, game);

            enemy.lastAttackTime = 0;

            // Visual effect
            this.createAttackEffect(enemy, player, game);
        }
    },

    // Create attack visual effect
    createAttackEffect(enemy, player, game) {
        if (!game.particles) game.particles = [];

        const angle = Utils.angleBetween(enemy.x, enemy.y, player.x, player.y);

        for (let i = 0; i < 10; i++) {
            const spreadAngle = angle + Utils.randomFloat(-0.5, 0.5);
            const speed = Utils.randomFloat(100, 200);
            const particle = Utils.createParticle(
                enemy.x,
                enemy.y,
                Math.cos(spreadAngle) * speed,
                Math.sin(spreadAngle) * speed,
                enemy.color,
                Utils.randomFloat(3, 6),
                0.3
            );
            game.particles.push(particle);
        }
    },

    // Check boss phase transition
    checkPhaseTransition(enemy, game) {
        if (!enemy.phases || enemy.currentPhase >= enemy.phases.length - 1) {
            return;
        }

        const healthPercent = enemy.health / enemy.maxHealth;
        const nextPhase = enemy.phases[enemy.currentPhase + 1];

        if (healthPercent <= nextPhase.healthThreshold) {
            enemy.currentPhase++;
            enemy.phaseChanged = true;

            // Apply special effects
            const phase = enemy.phases[enemy.currentPhase];
            if (phase.specialEffect === 'hidden_mist') {
                game.activateHiddenMist();
            }

            // Show notification
            game.showNotification(`${enemy.name}: ${phase.name}!`);

            // Visual effect
            this.createPhaseTransitionEffect(enemy, game);
        }
    },

    // Create phase transition effect
    createPhaseTransitionEffect(enemy, game) {
        if (!game.particles) game.particles = [];

        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.randomFloat(150, 300);
            const particle = Utils.createParticle(
                enemy.x,
                enemy.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Utils.randomChoice(['#4DA6FF', '#FFFFFF', enemy.color]),
                Utils.randomFloat(5, 10),
                1.0
            );
            game.particles.push(particle);
        }
    },

    // Take damage
    takeDamage(enemy, damage, game) {
        if (enemy.isDead) return;

        const actualDamage = Math.max(1, damage - enemy.defense * 0.3);
        enemy.health -= actualDamage;

        if (enemy.health <= 0) {
            enemy.health = 0;
            this.die(enemy, game);
        }
    },

    // Enemy death
    die(enemy, game) {
        enemy.isDead = true;

        AudioManager.play(enemy.isBoss ? 'boss_hit' : 'enemy_die');

        // Award XP to player
        if (game.player) {
            PlayerSystem.gainXP(game.player, enemy.xpReward, game);
        }

        // Drop loot
        if (enemy.lootTable) {
            const item = ItemSystem.generateLoot(enemy.lootTable);
            if (item) {
                const drop = ItemSystem.createItemDrop(enemy.x, enemy.y, item);
                if (!game.itemDrops) game.itemDrops = [];
                game.itemDrops.push(drop);
            }
        }

        // Death effect
        this.createDeathEffect(enemy, game);

        // Boss death
        if (enemy.isBoss) {
            game.onBossDefeated(enemy);
        }
    },

    // Create death visual effect
    createDeathEffect(enemy, game) {
        if (!game.particles) game.particles = [];

        const particleCount = enemy.isBoss ? 100 : 30;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.randomFloat(100, 250);
            const particle = Utils.createParticle(
                enemy.x,
                enemy.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                enemy.color,
                Utils.randomFloat(4, 8),
                0.8
            );
            game.particles.push(particle);
        }
    },

    // Draw enemy
    draw(ctx, enemy, camera) {
        const screen = Utils.worldToScreen(enemy.x, enemy.y, camera);

        ctx.save();

        if (enemy.isDead) {
            // Fade out
            ctx.globalAlpha = Math.max(0, 1 - enemy.deathTime * 2);
        }

        // Draw enemy circle
        Utils.drawCircle(ctx, screen.x, screen.y, enemy.radius, enemy.color, true);

        // Draw inner circle
        const innerColor = enemy.isBoss ? '#FFD700' : '#CCCCCC';
        Utils.drawCircle(ctx, screen.x, screen.y, enemy.radius * 0.6, innerColor, true);

        // Draw type indicator
        if (enemy.type === 'elite') {
            Utils.drawText(ctx, '★', screen.x, screen.y - 8, {
                align: 'center',
                font: 'bold 20px Arial',
                color: '#FFD700'
            });
        } else if (enemy.isBoss) {
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
        Utils.drawText(ctx, enemy.name, screen.x, screen.y - enemy.radius - 15, {
            align: 'center',
            font: enemy.isBoss ? 'bold 16px Arial' : 'bold 12px Arial',
            color: enemy.isBoss ? '#FFD700' : '#FFFFFF',
            shadow: true
        });

        // Draw boss phase
        if (enemy.isBoss && enemy.phases) {
            const phase = enemy.phases[enemy.currentPhase];
            Utils.drawText(ctx, phase.name, screen.x, screen.y - enemy.radius - 30, {
                align: 'center',
                font: 'bold 12px Arial',
                color: '#FF6B1A',
                shadow: true
            });
        }

        ctx.restore();

        // Draw health bar
        this.drawHealthBar(ctx, enemy, screen);
    },

    // Draw health bar
    drawHealthBar(ctx, enemy, screen) {
        const barWidth = enemy.radius * 2.5;
        const barHeight = enemy.isBoss ? 10 : 6;
        const barY = screen.y + enemy.radius + 8;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screen.x - barWidth / 2, barY, barWidth, barHeight);

        // Health fill
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = enemy.isBoss ? '#CC0000' : (healthPercent > 0.5 ? '#00CC66' : '#FFD700');
        ctx.fillRect(screen.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = enemy.isBoss ? '#FFD700' : '#FFFFFF';
        ctx.lineWidth = enemy.isBoss ? 2 : 1;
        ctx.strokeRect(screen.x - barWidth / 2, barY, barWidth, barHeight);
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
    }
};
