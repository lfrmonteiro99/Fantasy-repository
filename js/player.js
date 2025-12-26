// Player System for Naruto Action RPG

const PlayerSystem = {
    // Character definitions
    characters: {
        'naruto': {
            id: 'naruto',
            name: 'Naruto Uzumaki',
            class: 'Ninjutsu Specialist',
            baseStats: {
                health: 150,
                chakra: 120,
                attack: 15,
                defense: 10,
                speed: 200,
                chakraRegen: 8
            },
            abilities: ['shadow_clone', 'rasengan', 'kunai_throw', 'nine_tails_chakra'],
            passives: ['naruto_determination', 'naruto_chakra_reserves'],
            passiveUnlockLevels: {
                'naruto_determination': 1,
                'naruto_chakra_reserves': 2
            },
            color: '#FF6B1A',
            unlocked: true
        },

        'sasuke': {
            id: 'sasuke',
            name: 'Sasuke Uchiha',
            class: 'Ninjutsu Specialist',
            baseStats: {
                health: 130,
                chakra: 110,
                attack: 18,
                defense: 12,
                speed: 220,
                chakraRegen: 7
            },
            abilities: [], // To be defined later
            passives: [],
            color: '#1A1A3E',
            unlocked: false
        }
    },

    // Create a new player character
    createPlayer(characterId, x = 400, y = 300) {
        const charDef = this.characters[characterId];
        if (!charDef) {
            console.error(`Character ${characterId} not found`);
            return null;
        }

        const player = {
            // Identity
            characterId: characterId,
            name: charDef.name,
            class: charDef.class,

            // Position and movement
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            radius: 25,
            speed: charDef.baseStats.speed,
            facingAngle: 0,

            // Base stats
            baseMaxHealth: charDef.baseStats.health,
            baseMaxChakra: charDef.baseStats.chakra,
            baseAttack: charDef.baseStats.attack,
            baseDefense: charDef.baseStats.defense,
            baseChakraRegen: charDef.baseStats.chakraRegen,

            // Current values
            health: charDef.baseStats.health,
            maxHealth: charDef.baseStats.health,
            chakra: charDef.baseStats.chakra,
            maxChakra: charDef.baseStats.chakra,

            // Bonus stats from equipment
            bonusStats: {
                attack: 0,
                defense: 0,
                health: 0,
                chakra: 0,
                chakraRegen: 0,
                attackSpeed: 1.0,
                healthRegen: 0
            },

            // Progression
            level: 1,
            xp: 0,
            xpToNextLevel: Utils.getXPForLevel(1),

            // Equipment
            equipment: {
                weapon: null,
                armor: null,
                accessory: null
            },

            // Inventory
            inventory: [],
            gold: 100,

            // Abilities
            equippedAbilities: charDef.abilities.slice(0, 4), // First 4 abilities
            availableAbilities: charDef.abilities,
            abilityCooldowns: {},
            abilityUsage: {},
            passives: [charDef.passives[0]], // Start with first passive
            allPassives: charDef.passives,
            passiveUnlockLevels: charDef.passiveUnlockLevels,

            // Combat
            isDead: false,
            invulnerable: false,
            invulnerableTime: 0,
            lastAttackTime: 0,
            attackCooldown: 1.0,

            // Status effects
            statusEffects: [],

            // Input
            targetX: x,
            targetY: y,
            isMoving: false,
            lastMouseX: x + 100,
            lastMouseY: y,

            // Visual
            color: charDef.color,
            animationFrame: 0,
            animationTime: 0
        };

        return player;
    },

    // Update player
    update(player, game, dt) {
        if (player.isDead) return;

        // Update invulnerability
        if (player.invulnerable) {
            player.invulnerableTime -= dt;
            if (player.invulnerableTime <= 0) {
                player.invulnerable = false;
            }
        }

        // Update status effects
        Utils.updateStatusEffects(player, dt);

        // Get speed modifier from status effects
        let speedMod = 1.0;
        if (player.statusEffects) {
            for (let effect of player.statusEffects) {
                if (effect.type === 'nine_tails' && effect.value.speedBoost) {
                    speedMod = effect.value.speedBoost;
                }
            }
        }

        // Movement
        this.updateMovement(player, game, dt, speedMod);

        // Regeneration
        this.updateRegeneration(player, dt);

        // Update cooldowns
        AbilitySystem.updateCooldowns(player, dt);

        // Animation
        player.animationTime += dt;
        if (player.isMoving) {
            player.animationFrame = Math.floor(player.animationTime * 8) % 4;
        } else {
            player.animationFrame = 0;
        }

        // Auto-attack disabled - player must use melee button or abilities
        // this.updateAutoAttack(player, game, dt);
    },

    // Update movement
    updateMovement(player, game, dt, speedMod) {
        const moveSpeed = player.speed * speedMod;

        // Check if moving towards target
        const distToTarget = Utils.distance(player.x, player.y, player.targetX, player.targetY);

        if (distToTarget > 5) {
            player.isMoving = true;

            const angle = Utils.angleBetween(player.x, player.y, player.targetX, player.targetY);
            player.facingAngle = angle;

            player.vx = Math.cos(angle) * moveSpeed;
            player.vy = Math.sin(angle) * moveSpeed;

            // Move
            player.x += player.vx * dt;
            player.y += player.vy * dt;

            // Stop if reached target
            if (Utils.distance(player.x, player.y, player.targetX, player.targetY) < moveSpeed * dt) {
                player.x = player.targetX;
                player.y = player.targetY;
                player.vx = 0;
                player.vy = 0;
                player.isMoving = false;
            }
        } else {
            player.isMoving = false;
            player.vx = 0;
            player.vy = 0;
        }

        // Keep player in bounds
        if (game.currentMap) {
            player.x = Utils.clamp(player.x, player.radius, game.currentMap.width - player.radius);
            player.y = Utils.clamp(player.y, player.radius, game.currentMap.height - player.radius);
        }
    },

    // Update regeneration
    updateRegeneration(player, dt) {
        const stats = ItemSystem.getTotalStats(player);

        // Chakra regeneration
        player.chakra += stats.chakraRegen * dt;
        player.chakra = Math.min(player.chakra, player.maxChakra);

        // Health regeneration (if any)
        if (stats.healthRegen > 0) {
            player.health += stats.healthRegen * dt;
            player.health = Math.min(player.health, player.maxHealth);
        }
    },

    // Update auto-attack
    updateAutoAttack(player, game, dt) {
        if (!game.enemies || game.enemies.length === 0) return;

        player.lastAttackTime += dt;

        const stats = ItemSystem.getTotalStats(player);
        const attackSpeed = stats.attackSpeed;
        const attackCooldown = player.attackCooldown / attackSpeed;

        if (player.lastAttackTime >= attackCooldown) {
            // Find nearest enemy in range
            const attackRange = 60;
            let nearestEnemy = null;
            let nearestDist = Infinity;

            for (let enemy of game.enemies) {
                if (enemy.isDead) continue;
                const dist = Utils.distance(player.x, player.y, enemy.x, enemy.y);
                if (dist < nearestDist && dist <= attackRange) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }

            if (nearestEnemy) {
                // Attack
                let damage = stats.attack;

                // Apply damage boost from Nine-Tails
                if (player.statusEffects) {
                    for (let effect of player.statusEffects) {
                        if (effect.type === 'nine_tails' && effect.value.damageBoost) {
                            damage *= effect.value.damageBoost;
                        }
                    }
                }

                damage = Utils.calculateDamage(damage);
                EnemySystem.takeDamage(nearestEnemy, damage, game);

                game.showDamageNumber(nearestEnemy.x, nearestEnemy.y, damage, 'player-damage');
                AudioManager.play('naruto_attack');

                player.lastAttackTime = 0;

                // Face enemy
                player.facingAngle = Utils.angleBetween(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
            }
        }
    },

    // Take damage
    takeDamage(player, damage, game) {
        if (player.isDead || player.invulnerable) return;

        const stats = ItemSystem.getTotalStats(player);
        const actualDamage = Math.max(1, damage - stats.defense * 0.5);

        player.health -= actualDamage;
        game.showDamageNumber(player.x, player.y, actualDamage, 'enemy-damage');

        AudioManager.play('naruto_hurt');

        // Invulnerability frames
        player.invulnerable = true;
        player.invulnerableTime = 0.5;

        if (player.health <= 0) {
            player.health = 0;
            player.isDead = true;
            AudioManager.play('naruto_die');
            game.onPlayerDeath();
        }
    },

    // Gain XP
    gainXP(player, amount, game) {
        player.xp += amount;

        // Check level up
        while (player.xp >= player.xpToNextLevel) {
            this.levelUp(player, game);
        }
    },

    // Level up
    levelUp(player, game) {
        player.level++;
        player.xp -= player.xpToNextLevel;
        player.xpToNextLevel = Utils.getXPForLevel(player.level);

        // Increase base stats
        player.baseMaxHealth += 10;
        player.baseMaxChakra += 8;
        player.baseAttack += 2;
        player.baseDefense += 1;

        // Recalculate total stats
        ItemSystem.applyItemStats(player);

        // Restore health and chakra
        player.health = player.maxHealth;
        player.chakra = player.maxChakra;

        // Check for passive unlocks
        const charDef = this.characters[player.characterId];
        if (charDef && charDef.passiveUnlockLevels) {
            for (let passiveId in charDef.passiveUnlockLevels) {
                const unlockLevel = charDef.passiveUnlockLevels[passiveId];
                if (player.level === unlockLevel && !player.passives.includes(passiveId)) {
                    player.passives.push(passiveId);
                    const passive = AbilitySystem.getPassive(passiveId);
                    game.showNotification(`Passive Unlocked: ${passive.name}`);
                    AudioManager.play('ability_unlock');
                }
            }
        }

        // Show level up notification
        game.showLevelUpNotification(player.level);
        AudioManager.play('level_up');
    },

    // Draw player
    draw(ctx, player, camera) {
        if (player.isDead) return;

        const screen = Utils.worldToScreen(player.x, player.y, camera);

        ctx.save();

        // Flicker when invulnerable
        if (player.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw Nine-Tails aura if active
        if (player.statusEffects) {
            for (let effect of player.statusEffects) {
                if (effect.type === 'nine_tails') {
                    const pulse = Math.sin(Date.now() / 100) * 0.2 + 0.8;
                    ctx.globalAlpha = 0.3 * pulse;
                    Utils.drawCircle(ctx, screen.x, screen.y, player.radius + 15, '#FF6B1A', true);
                    ctx.globalAlpha = 1.0;
                }
            }
        }

        // Draw player circle
        Utils.drawCircle(ctx, screen.x, screen.y, player.radius, player.color, true);

        // Draw inner circle
        Utils.drawCircle(ctx, screen.x, screen.y, player.radius * 0.7, '#FFD700', true);

        // Draw directional indicator
        const indicatorLength = player.radius + 10;
        const indicatorX = screen.x + Math.cos(player.facingAngle) * indicatorLength;
        const indicatorY = screen.y + Math.sin(player.facingAngle) * indicatorLength;

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(indicatorX, indicatorY);
        ctx.stroke();

        // Draw name
        Utils.drawText(ctx, player.name, screen.x, screen.y - player.radius - 15, {
            align: 'center',
            font: 'bold 14px Arial',
            color: '#FFD700',
            shadow: true
        });

        // Draw level
        Utils.drawText(ctx, `Lv.${player.level}`, screen.x, screen.y - player.radius - 30, {
            align: 'center',
            font: 'bold 12px Arial',
            color: '#FFFFFF',
            shadow: true
        });

        ctx.restore();
    },

    // Draw health bar
    drawHealthBar(ctx, player, camera) {
        if (player.isDead) return;

        const screen = Utils.worldToScreen(player.x, player.y, camera);
        const barWidth = player.radius * 2;
        const barHeight = 6;
        const barY = screen.y + player.radius + 8;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screen.x - barWidth / 2, barY, barWidth, barHeight);

        // Health fill
        const healthPercent = player.health / player.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00CC66' : (healthPercent > 0.25 ? '#FFD700' : '#CC0000');
        ctx.fillRect(screen.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(screen.x - barWidth / 2, barY, barWidth, barHeight);
    },

    // Set move target
    setMoveTarget(player, x, y) {
        player.targetX = x;
        player.targetY = y;
    },

    // Use ability
    useAbility(player, abilitySlot, game) {
        if (abilitySlot < 0 || abilitySlot >= player.equippedAbilities.length) {
            return false;
        }

        const abilityId = player.equippedAbilities[abilitySlot];
        if (!abilityId) return false;

        // Find target (nearest enemy)
        let target = null;
        if (game.enemies && game.enemies.length > 0) {
            let nearestDist = Infinity;
            for (let enemy of game.enemies) {
                if (enemy.isDead) continue;
                const dist = Utils.distance(player.x, player.y, enemy.x, enemy.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    target = enemy;
                }
            }
        }

        return AbilitySystem.cast(abilityId, player, target, game);
    }
};
