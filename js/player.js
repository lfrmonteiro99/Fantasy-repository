// Player class for Naruto Action RPG

class Player extends Combatant {
    constructor(characterId, x = 400, y = 300) {
        const charDef = PlayerSystem.characters[characterId];
        if (!charDef) {
            throw new Error(`Character ${characterId} not found`);
        }

        super(x, y, 25);

        // Identity
        this.characterId = characterId;
        this.name = charDef.name;
        this.class = charDef.class;

        // Base stats from character definition
        this.baseMaxHealth = charDef.baseStats.health;
        this.baseMaxChakra = charDef.baseStats.chakra;
        this.baseAttack = charDef.baseStats.attack;
        this.baseDefense = charDef.baseStats.defense;
        this.baseChakraRegen = charDef.baseStats.chakraRegen;

        // Current values
        this.maxHealth = charDef.baseStats.health;
        this.health = charDef.baseStats.health;
        this.maxChakra = charDef.baseStats.chakra;
        this.chakra = charDef.baseStats.chakra;
        this.damage = charDef.baseStats.attack;
        this.defense = charDef.baseStats.defense;
        this.speed = charDef.baseStats.speed;

        // Bonus stats from equipment
        this.bonusStats = {
            attack: 0,
            defense: 0,
            health: 0,
            chakra: 0,
            chakraRegen: 0,
            attackSpeed: 1.0,
            healthRegen: 0
        };

        // Progression
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = Utils.getXPForLevel(1);

        // Equipment
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };

        // Inventory
        this.inventory = [];
        this.gold = 100;

        // Abilities
        this.equippedAbilities = charDef.abilities.slice(0, 4);
        this.availableAbilities = charDef.abilities;
        this.abilityCooldowns = {};
        this.abilityUsage = {};
        this.passives = [charDef.passives[0]];
        this.allPassives = charDef.passives;
        this.passiveUnlockLevels = charDef.passiveUnlockLevels;

        // Combat
        this.attackCooldown = 1.0;
        this.lastAttackTime = 0;

        // Movement
        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.lastMouseX = x + 100;
        this.lastMouseY = y;

        // Visual
        this.color = charDef.color;
    }

    // Update player
    update(game, dt) {
        if (this.isDead) return;

        // Call parent update (invulnerability, status effects, animation)
        super.update(game, dt);

        // Get speed modifier from status effects
        let speedMod = 1.0;
        if (this.statusEffects) {
            for (let effect of this.statusEffects) {
                if (effect.type === 'nine_tails' && effect.value.speedBoost) {
                    speedMod = effect.value.speedBoost;
                }
            }
        }

        // Movement
        this.updateMovement(game, dt, speedMod);

        // Regeneration
        this.updateRegeneration(dt);

        // Update cooldowns
        AbilitySystem.updateCooldowns(this, dt);

        // Animation
        if (this.isMoving) {
            this.animationFrame = Math.floor(this.animationTime * 8) % 4;
        } else {
            this.animationFrame = 0;
        }

        // Auto-attack disabled - player must use melee button or abilities
        // (Enemies still auto-attack)
    }

    // Update movement
    updateMovement(game, dt, speedMod) {
        const moveSpeed = this.speed * speedMod;
        const distToTarget = this.distanceTo({ x: this.targetX, y: this.targetY });

        if (distToTarget > 5) {
            this.isMoving = true;

            const angle = Utils.angleBetween(this.x, this.y, this.targetX, this.targetY);
            this.facingAngle = angle;

            this.vx = Math.cos(angle) * moveSpeed;
            this.vy = Math.sin(angle) * moveSpeed;

            // Move
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Stop if reached target
            if (this.distanceTo({ x: this.targetX, y: this.targetY }) < moveSpeed * dt) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.vx = 0;
                this.vy = 0;
                this.isMoving = false;
            }
        } else {
            this.isMoving = false;
            this.vx = 0;
            this.vy = 0;
        }

        // Keep player in bounds
        if (game.currentMap) {
            this.x = Utils.clamp(this.x, this.radius, game.currentMap.width - this.radius);
            this.y = Utils.clamp(this.y, this.radius, game.currentMap.height - this.radius);
        }
    }

    // Update regeneration
    updateRegeneration(dt) {
        const stats = ItemSystem.getTotalStats(this);

        // Chakra regeneration
        this.chakra += stats.chakraRegen * dt;
        this.chakra = Math.min(this.chakra, this.maxChakra);

        // Health regeneration (if any)
        if (stats.healthRegen > 0) {
            this.health += stats.healthRegen * dt;
            this.health = Math.min(this.health, this.maxHealth);
        }
    }

    // Take damage (override)
    takeDamage(damage, game) {
        if (this.isDead || this.invulnerable) return;

        const stats = ItemSystem.getTotalStats(this);
        const actualDamage = Math.max(1, damage - stats.defense * 0.5);

        this.health -= actualDamage;
        game.showDamageNumber(this.x, this.y, actualDamage, 'enemy-damage');

        AudioManager.play('naruto_hurt');

        // Invulnerability frames
        this.invulnerable = true;
        this.invulnerableTime = 0.5;

        if (this.health <= 0) {
            this.health = 0;
            this.die(game);
        }
    }

    // Die (override)
    die(game) {
        this.isDead = true;
        AudioManager.play('naruto_die');
        game.onPlayerDeath();
    }

    // Gain XP
    gainXP(amount, game) {
        this.xp += amount;
        UISystem.addEventLog(`+${amount} XP`, 'xp');

        // Check level up
        while (this.xp >= this.xpToNextLevel) {
            this.levelUp(game);
        }
    }

    // Level up
    levelUp(game) {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Utils.getXPForLevel(this.level);

        // Increase base stats
        this.baseMaxHealth += 10;
        this.baseMaxChakra += 8;
        this.baseAttack += 2;
        this.baseDefense += 1;

        // Recalculate total stats
        ItemSystem.applyItemStats(this);

        // Restore health and chakra
        this.health = this.maxHealth;
        this.chakra = this.maxChakra;

        // Check for passive unlocks
        const charDef = PlayerSystem.characters[this.characterId];
        if (charDef && charDef.passiveUnlockLevels) {
            for (let passiveId in charDef.passiveUnlockLevels) {
                const unlockLevel = charDef.passiveUnlockLevels[passiveId];
                if (this.level === unlockLevel && !this.passives.includes(passiveId)) {
                    this.passives.push(passiveId);
                    const passive = AbilitySystem.getPassive(passiveId);
                    game.showNotification(`Passive Unlocked: ${passive.name}`);
                    AudioManager.play('ability_unlock');
                }
            }
        }

        // Show level up notification
        game.showLevelUpNotification(this.level);
        AudioManager.play('level_up');
    }

    // Set move target
    setMoveTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    // Use ability
    useAbility(abilitySlot, game) {
        if (abilitySlot < 0 || abilitySlot >= this.equippedAbilities.length) {
            return false;
        }

        const abilityId = this.equippedAbilities[abilitySlot];
        if (!abilityId) return false;

        const ability = AbilitySystem.getAbility(abilityId);
        if (!ability) {
            UISystem.addEventLog('Ability not found!', 'info');
            return false;
        }

        // Find target (nearest enemy)
        let target = null;
        if (game.enemies && game.enemies.length > 0) {
            let nearestDist = Infinity;
            for (let enemy of game.enemies) {
                if (enemy.isDead) continue;
                const dist = this.distanceTo(enemy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    target = enemy;
                }
            }
        }

        const result = AbilitySystem.cast(abilityId, this, target, game);

        if (!result) {
            // Show why it failed
            if (this.chakra < ability.chakraCost) {
                UISystem.addEventLog('Not enough chakra!', 'ability');
            } else {
                const cooldown = this.abilityCooldowns[abilityId] || 0;
                if (cooldown > 0) {
                    UISystem.addEventLog(`${ability.name}: ${Math.ceil(cooldown)}s`, 'ability');
                }
            }
        } else {
            // Show ability used
            UISystem.addEventLog(`${ability.name}!`, 'ability');
        }

        return result;
    }

    // Draw player
    draw(ctx, camera) {
        if (this.isDead) return;

        const screen = Utils.worldToScreen(this.x, this.y, camera);

        ctx.save();

        // Flicker when invulnerable
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw Nine-Tails aura if active
        if (this.statusEffects) {
            for (let effect of this.statusEffects) {
                if (effect.type === 'nine_tails') {
                    const pulse = Math.sin(Date.now() / 100) * 0.2 + 0.8;
                    ctx.globalAlpha = 0.3 * pulse;
                    Utils.drawCircle(ctx, screen.x, screen.y, this.radius + 15, '#FF6B1A', true);
                    ctx.globalAlpha = 1.0;
                }
            }
        }

        // Draw player circle
        Utils.drawCircle(ctx, screen.x, screen.y, this.radius, this.color, true);

        // Draw inner circle
        Utils.drawCircle(ctx, screen.x, screen.y, this.radius * 0.7, '#FFD700', true);

        // Draw directional indicator
        const indicatorLength = this.radius + 10;
        const indicatorX = screen.x + Math.cos(this.facingAngle) * indicatorLength;
        const indicatorY = screen.y + Math.sin(this.facingAngle) * indicatorLength;

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(indicatorX, indicatorY);
        ctx.stroke();

        // Draw name
        Utils.drawText(ctx, this.name, screen.x, screen.y - this.radius - 15, {
            align: 'center',
            font: 'bold 14px Arial',
            color: '#FFD700',
            shadow: true
        });

        // Draw level
        Utils.drawText(ctx, `Lv.${this.level}`, screen.x, screen.y - this.radius - 30, {
            align: 'center',
            font: 'bold 12px Arial',
            color: '#FFFFFF',
            shadow: true
        });

        ctx.restore();

        // Draw health bar
        this.drawHealthBar(ctx, camera);
    }

    // Draw health bar
    drawHealthBar(ctx, camera) {
        if (this.isDead) return;

        const screen = Utils.worldToScreen(this.x, this.y, camera);
        const barWidth = this.radius * 2;
        const barHeight = 6;
        const barY = screen.y + this.radius + 8;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screen.x - barWidth / 2, barY, barWidth, barHeight);

        // Health fill
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00CC66' : (healthPercent > 0.25 ? '#FFD700' : '#CC0000');
        ctx.fillRect(screen.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(screen.x - barWidth / 2, barY, barWidth, barHeight);
    }
}

// PlayerSystem - Character registry and static utilities
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
            abilities: [],
            passives: [],
            color: '#1A1A3E',
            unlocked: false
        }
    },

    // Create a new player character
    createPlayer(characterId, x, y) {
        return new Player(characterId, x, y);
    },

    // Static method to apply damage (for backward compatibility)
    takeDamage(player, damage, game) {
        player.takeDamage(damage, game);
    },

    // Static method to gain XP (for backward compatibility)
    gainXP(player, amount, game) {
        player.gainXP(amount, game);
    }
};
