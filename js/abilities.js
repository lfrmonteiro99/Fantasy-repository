// Abilities System for Naruto Action RPG

const AbilitySystem = {
    // Define all abilities in the game
    abilities: {
        // Naruto's abilities
        'shadow_clone': {
            id: 'shadow_clone',
            name: 'Shadow Clone Jutsu',
            description: 'Create shadow clones that fight alongside you',
            type: 'summon',
            chakraCost: 30,
            cooldown: 10,
            damage: 0,
            unlockLevel: 1,
            character: 'naruto',
            ranks: [
                { level: 1, clones: 2, cloneDuration: 8, cloneDamage: 10 },
                { level: 2, clones: 3, cloneDuration: 10, cloneDamage: 15 },
                { level: 3, clones: 4, cloneDuration: 12, cloneDamage: 20 }
            ],
            currentRank: 0,
            cast(player, target, game) {
                const rank = this.ranks[this.currentRank];
                AudioManager.playAbilitySound(this.name);

                // Create shadow clones
                for (let i = 0; i < rank.clones; i++) {
                    const angle = (Math.PI * 2 * i) / rank.clones;
                    const distance = 60;
                    const clone = {
                        x: player.x + Math.cos(angle) * distance,
                        y: player.y + Math.sin(angle) * distance,
                        vx: 0,
                        vy: 0,
                        radius: 20,
                        damage: rank.cloneDamage,
                        lifetime: rank.cloneDuration,
                        age: 0,
                        type: 'shadow_clone',
                        owner: player,
                        target: null,
                        attackCooldown: 0,
                        attackRate: 1.5
                    };

                    if (!game.projectiles) game.projectiles = [];
                    game.projectiles.push(clone);
                }

                // Visual effect
                this.createCastEffect(player, game);

                return true;
            },
            createCastEffect(player, game) {
                if (!game.particles) game.particles = [];

                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Utils.randomFloat(100, 200);
                    const particle = Utils.createParticle(
                        player.x,
                        player.y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#FFD700',
                        Utils.randomFloat(3, 6),
                        0.5
                    );
                    game.particles.push(particle);
                }
            }
        },

        'rasengan': {
            id: 'rasengan',
            name: 'Rasengan',
            description: 'A powerful spiraling sphere of chakra',
            type: 'melee',
            chakraCost: 40,
            cooldown: 8,
            damage: 50,
            unlockLevel: 1,
            character: 'naruto',
            range: 80,
            ranks: [
                { level: 1, damage: 50, aoe: 40 },
                { level: 2, damage: 80, aoe: 60 },
                { level: 3, damage: 120, aoe: 80 }
            ],
            currentRank: 0,
            cast(player, target, game) {
                const rank = this.ranks[this.currentRank];
                AudioManager.playAbilitySound(this.name);

                // Get direction to target or mouse position
                let targetX = target?.x || player.lastMouseX || player.x + 100;
                let targetY = target?.y || player.lastMouseY || player.y;

                const angle = Utils.angleBetween(player.x, player.y, targetX, targetY);
                const hitX = player.x + Math.cos(angle) * this.range;
                const hitY = player.y + Math.sin(angle) * this.range;

                // Create projectile
                const projectile = {
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * 400,
                    vy: Math.sin(angle) * 400,
                    radius: rank.aoe / 2,
                    damage: rank.damage,
                    lifetime: 1.5,
                    age: 0,
                    type: 'rasengan',
                    owner: player,
                    color: '#4DA6FF'
                };

                if (!game.projectiles) game.projectiles = [];
                game.projectiles.push(projectile);

                // Visual effect
                this.createCastEffect(player, angle, game);

                return true;
            },
            createCastEffect(player, angle, game) {
                if (!game.particles) game.particles = [];

                for (let i = 0; i < 30; i++) {
                    const spreadAngle = angle + Utils.randomFloat(-0.5, 0.5);
                    const speed = Utils.randomFloat(200, 400);
                    const particle = Utils.createParticle(
                        player.x,
                        player.y,
                        Math.cos(spreadAngle) * speed,
                        Math.sin(spreadAngle) * speed,
                        Utils.randomChoice(['#4DA6FF', '#0066CC', '#FFFFFF']),
                        Utils.randomFloat(4, 8),
                        0.6
                    );
                    game.particles.push(particle);
                }
            }
        },

        'kunai_throw': {
            id: 'kunai_throw',
            name: 'Kunai Throw',
            description: 'Throw kunai at enemies',
            type: 'ranged',
            chakraCost: 10,
            cooldown: 2,
            damage: 20,
            unlockLevel: 1,
            character: 'naruto',
            ranks: [
                { level: 1, damage: 20, count: 1, speed: 500 },
                { level: 2, damage: 30, count: 3, speed: 600 },
                { level: 3, damage: 40, count: 5, speed: 700 }
            ],
            currentRank: 0,
            cast(player, target, game) {
                const rank = this.ranks[this.currentRank];
                AudioManager.playAbilitySound(this.name);

                // Get direction to target or mouse position
                let targetX = target?.x || player.lastMouseX || player.x + 100;
                let targetY = target?.y || player.lastMouseY || player.y;

                const baseAngle = Utils.angleBetween(player.x, player.y, targetX, targetY);

                // Create kunai projectiles
                for (let i = 0; i < rank.count; i++) {
                    const spread = rank.count > 1 ? 0.3 : 0;
                    const offset = (i - (rank.count - 1) / 2) * spread;
                    const angle = baseAngle + offset;

                    const kunai = {
                        x: player.x,
                        y: player.y,
                        vx: Math.cos(angle) * rank.speed,
                        vy: Math.sin(angle) * rank.speed,
                        radius: 5,
                        damage: rank.damage,
                        lifetime: 3,
                        age: 0,
                        type: 'kunai',
                        owner: player,
                        rotation: angle
                    };

                    if (!game.projectiles) game.projectiles = [];
                    game.projectiles.push(kunai);
                }

                return true;
            }
        },

        'nine_tails_chakra': {
            id: 'nine_tails_chakra',
            name: 'Nine-Tails Chakra',
            description: 'Unleash the Nine-Tails chakra for massive power',
            type: 'buff',
            chakraCost: 50,
            cooldown: 30,
            damage: 0,
            unlockLevel: 3,
            character: 'naruto',
            ranks: [
                { level: 1, duration: 8, damageBoost: 1.5, speedBoost: 1.3 },
                { level: 2, duration: 10, damageBoost: 2.0, speedBoost: 1.5 },
                { level: 3, duration: 12, damageBoost: 2.5, speedBoost: 1.7 }
            ],
            currentRank: 0,
            cast(player, target, game) {
                const rank = this.ranks[this.currentRank];
                AudioManager.playAbilitySound(this.name);

                // Apply buff
                Utils.applyStatusEffect(player, {
                    type: 'nine_tails',
                    duration: rank.duration,
                    value: {
                        damageBoost: rank.damageBoost,
                        speedBoost: rank.speedBoost
                    }
                });

                // Visual effect
                this.createCastEffect(player, game);

                return true;
            },
            createCastEffect(player, game) {
                if (!game.particles) game.particles = [];

                for (let i = 0; i < 50; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Utils.randomFloat(150, 300);
                    const particle = Utils.createParticle(
                        player.x,
                        player.y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        Utils.randomChoice(['#FF6B1A', '#D55A15', '#FFD700']),
                        Utils.randomFloat(5, 10),
                        1.0
                    );
                    game.particles.push(particle);
                }
            }
        }
    },

    // Passive abilities
    passives: {
        'naruto_determination': {
            id: 'naruto_determination',
            name: 'Unwavering Determination',
            description: '+10% max health and health regeneration',
            character: 'naruto',
            unlockLevel: 1,
            effects: {
                healthBonus: 0.1,
                healthRegen: 2
            }
        },

        'naruto_chakra_reserves': {
            id: 'naruto_chakra_reserves',
            name: 'Vast Chakra Reserves',
            description: '+20% max chakra and faster chakra regeneration',
            character: 'naruto',
            unlockLevel: 2,
            effects: {
                chakraBonus: 0.2,
                chakraRegen: 1.5
            }
        }
    },

    // Get ability by ID
    getAbility(id) {
        return this.abilities[id];
    },

    // Get passive by ID
    getPassive(id) {
        return this.passives[id];
    },

    // Get all abilities for a character
    getCharacterAbilities(characterId) {
        return Object.values(this.abilities).filter(a => a.character === characterId);
    },

    // Get all passives for a character
    getCharacterPassives(characterId) {
        return Object.values(this.passives).filter(p => p.character === characterId);
    },

    // Check if ability can be cast
    canCast(ability, player) {
        if (!ability) return false;

        // Check chakra
        if (player.chakra < ability.chakraCost) {
            return false;
        }

        // Check cooldown
        if (player.abilityCooldowns && player.abilityCooldowns[ability.id] > 0) {
            return false;
        }

        // Check if unlocked
        if (player.level < ability.unlockLevel) {
            return false;
        }

        return true;
    },

    // Cast ability
    cast(abilityId, player, target, game) {
        const ability = this.getAbility(abilityId);
        if (!ability) return false;

        if (!this.canCast(ability, player)) {
            if (player.chakra < ability.chakraCost) {
                AudioManager.play('chakra_low');
            }
            return false;
        }

        // Consume chakra
        player.chakra -= ability.chakraCost;

        // Set cooldown
        if (!player.abilityCooldowns) {
            player.abilityCooldowns = {};
        }
        player.abilityCooldowns[ability.id] = ability.cooldown;

        // Cast the ability
        const success = ability.cast(player, target, game);

        // Track usage for ability leveling
        if (success) {
            if (!player.abilityUsage) {
                player.abilityUsage = {};
            }
            player.abilityUsage[ability.id] = (player.abilityUsage[ability.id] || 0) + 1;

            // Level up ability if used enough times
            this.checkAbilityLevelUp(ability, player);
        }

        return success;
    },

    // Check if ability should level up
    checkAbilityLevelUp(ability, player) {
        const usage = player.abilityUsage[ability.id] || 0;
        const usageThresholds = [50, 150, 300]; // Uses needed for each rank

        for (let i = ability.currentRank; i < ability.ranks.length - 1; i++) {
            if (usage >= usageThresholds[i]) {
                ability.currentRank = i + 1;
                // Notify player
                if (game && game.ui) {
                    game.ui.showNotification(`${ability.name} upgraded to Rank ${ability.currentRank + 1}!`);
                }
                AudioManager.play('ability_unlock');
            }
        }
    },

    // Update cooldowns
    updateCooldowns(player, dt) {
        if (!player.abilityCooldowns) return;

        for (let abilityId in player.abilityCooldowns) {
            if (player.abilityCooldowns[abilityId] > 0) {
                player.abilityCooldowns[abilityId] -= dt;
                if (player.abilityCooldowns[abilityId] < 0) {
                    player.abilityCooldowns[abilityId] = 0;
                }
            }
        }
    },

    // Update projectiles (shadow clones, kunai, rasengan, etc.)
    updateProjectiles(game, dt) {
        if (!game.projectiles) return;

        game.projectiles = game.projectiles.filter(proj => {
            proj.age += dt;

            // Expire old projectiles
            if (proj.age >= proj.lifetime) {
                return false;
            }

            // Update position
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;

            // Update rotation
            if (proj.rotation !== undefined) {
                proj.rotation += dt * 10;
            }

            // Shadow clone AI
            if (proj.type === 'shadow_clone') {
                this.updateShadowClone(proj, game, dt);
            }

            // Check collisions with enemies (player projectiles)
            if (proj.owner && proj.owner.characterId && game.enemies) {
                for (let enemy of game.enemies) {
                    if (enemy.isDead) continue;

                    const distance = Utils.distance(proj.x, proj.y, enemy.x, enemy.y);
                    if (distance <= proj.radius + enemy.radius) {
                        // Hit enemy - use proper damage system
                        enemy.takeDamage(proj.damage, game);
                        game.showDamageNumber(enemy.x, enemy.y, proj.damage, 'player-damage');
                        AudioManager.play('enemy_hit');

                        // Remove projectile unless it's a shadow clone
                        if (proj.type !== 'shadow_clone') {
                            return false;
                        }
                    }
                }
            }

            // Check collisions with player (enemy projectiles)
            if (proj.owner && proj.owner.typeId && game.player) {
                if (!game.player.isDead) {
                    const distance = Utils.distance(proj.x, proj.y, game.player.x, game.player.y);
                    if (distance <= proj.radius + game.player.radius) {
                        // Hit player
                        game.player.takeDamage(proj.damage, game);
                        game.showDamageNumber(game.player.x, game.player.y, proj.damage, 'enemy-damage');
                        AudioManager.play('naruto_hurt');

                        // Remove projectile
                        return false;
                    }
                }
            }

            return true;
        });
    },

    // Update shadow clone behavior
    updateShadowClone(clone, game, dt) {
        // Find nearest enemy
        let nearestEnemy = null;
        let nearestDistance = Infinity;

        if (game.enemies) {
            for (let enemy of game.enemies) {
                if (enemy.isDead) continue;
                const dist = Utils.distance(clone.x, clone.y, enemy.x, enemy.y);
                if (dist < nearestDistance) {
                    nearestDistance = dist;
                    nearestEnemy = enemy;
                }
            }
        }

        if (nearestEnemy) {
            clone.target = nearestEnemy;

            // Move towards enemy
            const angle = Utils.angleBetween(clone.x, clone.y, nearestEnemy.x, nearestEnemy.y);
            const speed = 150;
            clone.vx = Math.cos(angle) * speed;
            clone.vy = Math.sin(angle) * speed;

            // Attack if close enough
            if (nearestDistance <= clone.radius + nearestEnemy.radius + 30) {
                clone.attackCooldown -= dt;
                if (clone.attackCooldown <= 0) {
                    nearestEnemy.takeDamage(clone.damage, game);
                    game.showDamageNumber(nearestEnemy.x, nearestEnemy.y, clone.damage, 'player-damage');
                    AudioManager.play('enemy_hit');
                    clone.attackCooldown = clone.attackRate;
                }
            }
        } else {
            // No enemy, slow down
            clone.vx *= 0.9;
            clone.vy *= 0.9;
        }
    },

    // Draw projectiles
    drawProjectiles(ctx, game) {
        if (!game.projectiles) return;

        for (let proj of game.projectiles) {
            const screen = Utils.worldToScreen(proj.x, proj.y, game.camera);

            ctx.save();

            if (proj.type === 'shadow_clone') {
                // Draw shadow clone
                ctx.fillStyle = '#FFD700';
                ctx.globalAlpha = 0.8;
                Utils.drawCircle(ctx, screen.x, screen.y, proj.radius, '#FF6B1A', true);
                ctx.globalAlpha = 1.0;
                Utils.drawCircle(ctx, screen.x, screen.y, proj.radius * 0.6, '#FFD700', true);
                Utils.drawText(ctx, 'C', screen.x, screen.y - 5, {
                    align: 'center',
                    font: 'bold 20px Arial',
                    color: '#000000'
                });
            } else if (proj.type === 'rasengan') {
                // Draw spiraling rasengan
                const alpha = 1 - (proj.age / proj.lifetime) * 0.3;
                ctx.globalAlpha = alpha;

                // Draw spiral effect
                for (let i = 0; i < 3; i++) {
                    const radius = proj.radius * (1 - i * 0.2);
                    const rotation = proj.age * 20 + i * Math.PI / 3;
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, radius, rotation, rotation + Math.PI);
                    ctx.strokeStyle = i % 2 === 0 ? '#4DA6FF' : '#FFFFFF';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                }

                ctx.globalAlpha = 1.0;
            } else if (proj.type === 'kunai') {
                // Draw kunai
                ctx.translate(screen.x, screen.y);
                ctx.rotate(proj.rotation);
                ctx.fillStyle = '#999999';
                ctx.fillRect(-8, -2, 12, 4);
                ctx.fillStyle = '#666666';
                ctx.fillRect(4, -4, 4, 8);
                ctx.resetTransform();
            } else if (proj.type === 'water_dragon') {
                // Draw water dragon projectile
                const alpha = 1 - (proj.age / proj.lifetime) * 0.4;
                ctx.globalAlpha = alpha;

                // Draw dragon body
                Utils.drawCircle(ctx, screen.x, screen.y, proj.radius, proj.color || '#1E90FF', true);
                Utils.drawCircle(ctx, screen.x, screen.y, proj.radius * 0.6, '#4169E1', true);

                // Draw dragon emoji
                Utils.drawText(ctx, '🐉', screen.x, screen.y - 8, {
                    align: 'center',
                    font: '24px Arial'
                });

                ctx.globalAlpha = 1.0;
            }

            ctx.restore();
        }
    }
};
