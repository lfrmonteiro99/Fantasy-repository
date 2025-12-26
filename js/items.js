// Items and Gear System for Naruto Action RPG

const ItemSystem = {
    // Item database
    items: {
        // Weapons
        'basic_kunai': {
            id: 'basic_kunai',
            name: 'Basic Kunai',
            type: 'weapon',
            rarity: 'normal',
            stats: {
                attack: 10,
                attackSpeed: 1.0
            },
            description: 'A standard kunai used by genin',
            icon: '🗡️',
            value: 50
        },

        'enhanced_kunai': {
            id: 'enhanced_kunai',
            name: 'Enhanced Kunai',
            type: 'weapon',
            rarity: 'enhanced',
            stats: {
                attack: 20,
                attackSpeed: 1.1
            },
            description: 'A well-crafted kunai with improved balance',
            icon: '🗡️',
            value: 150
        },

        'legendary_kunai': {
            id: 'legendary_kunai',
            name: 'Legendary Kunai of the Thunder God',
            type: 'weapon',
            rarity: 'legendary',
            stats: {
                attack: 40,
                attackSpeed: 1.3,
                chakraRegen: 2
            },
            description: 'A kunai marked with the Flying Thunder God technique',
            icon: '⚡',
            value: 500
        },

        // Armor
        'basic_vest': {
            id: 'basic_vest',
            name: 'Basic Flak Vest',
            type: 'armor',
            rarity: 'normal',
            stats: {
                defense: 15,
                health: 20
            },
            description: 'Standard issue chunin vest',
            icon: '🦺',
            value: 75
        },

        'enhanced_vest': {
            id: 'enhanced_vest',
            name: 'Enhanced Flak Vest',
            type: 'armor',
            rarity: 'enhanced',
            stats: {
                defense: 30,
                health: 50
            },
            description: 'Reinforced vest with better protection',
            icon: '🦺',
            value: 200
        },

        'legendary_armor': {
            id: 'legendary_armor',
            name: 'Sage Mode Cloak',
            type: 'armor',
            rarity: 'legendary',
            stats: {
                defense: 60,
                health: 100,
                chakraRegen: 3
            },
            description: 'A cloak imbued with sage chakra',
            icon: '👘',
            value: 600
        },

        // Accessories
        'basic_scroll': {
            id: 'basic_scroll',
            name: 'Basic Chakra Scroll',
            type: 'accessory',
            rarity: 'normal',
            stats: {
                chakra: 20,
                chakraRegen: 1
            },
            description: 'A scroll that enhances chakra reserves',
            icon: '📜',
            value: 60
        },

        'enhanced_scroll': {
            id: 'enhanced_scroll',
            name: 'Enhanced Chakra Scroll',
            type: 'accessory',
            rarity: 'enhanced',
            stats: {
                chakra: 40,
                chakraRegen: 2
            },
            description: 'An advanced scroll with better chakra enhancement',
            icon: '📜',
            value: 180
        },

        'legendary_accessory': {
            id: 'legendary_accessory',
            name: 'Nine-Tails Chakra Pendant',
            type: 'accessory',
            rarity: 'legendary',
            stats: {
                chakra: 80,
                chakraRegen: 4,
                attack: 15
            },
            description: 'A pendant containing Nine-Tails chakra',
            icon: '🔮',
            value: 750
        }
    },

    // Loot tables for different enemy types
    lootTables: {
        'bandit': {
            dropChance: 0.3,
            items: [
                { id: 'basic_kunai', weight: 50 },
                { id: 'basic_vest', weight: 30 },
                { id: 'basic_scroll', weight: 20 }
            ]
        },

        'demon_brother': {
            dropChance: 0.6,
            items: [
                { id: 'basic_kunai', weight: 30 },
                { id: 'enhanced_kunai', weight: 40 },
                { id: 'basic_vest', weight: 20 },
                { id: 'enhanced_vest', weight: 10 }
            ]
        },

        'zabuza': {
            dropChance: 1.0,
            items: [
                { id: 'legendary_kunai', weight: 30 },
                { id: 'legendary_armor', weight: 30 },
                { id: 'legendary_accessory', weight: 20 },
                { id: 'enhanced_kunai', weight: 10 },
                { id: 'enhanced_vest', weight: 10 }
            ]
        }
    },

    // Get item by ID
    getItem(id) {
        return this.items[id] ? { ...this.items[id] } : null;
    },

    // Generate loot drop
    generateLoot(enemyType) {
        const lootTable = this.lootTables[enemyType];
        if (!lootTable) return null;

        // Check if enemy drops anything
        if (Math.random() > lootTable.dropChance) {
            return null;
        }

        // Calculate total weight
        const totalWeight = lootTable.items.reduce((sum, item) => sum + item.weight, 0);

        // Random selection based on weight
        let random = Math.random() * totalWeight;
        for (let entry of lootTable.items) {
            random -= entry.weight;
            if (random <= 0) {
                return this.getItem(entry.id);
            }
        }

        return null;
    },

    // Create starting inventory
    createStartingInventory() {
        return [
            this.getItem('basic_kunai'),
            this.getItem('basic_vest'),
            this.getItem('basic_scroll')
        ];
    },

    // Equip item
    equipItem(player, item) {
        if (!item) return false;

        // Unequip current item of same type
        if (player.equipment[item.type]) {
            this.unequipItem(player, item.type);
        }

        // Equip new item
        player.equipment[item.type] = item;

        // Apply stats
        this.applyItemStats(player);

        AudioManager.play('item_equip');
        return true;
    },

    // Unequip item
    unequipItem(player, slot) {
        const item = player.equipment[slot];
        if (!item) return null;

        // Add to inventory
        player.inventory.push(item);

        // Remove from equipment
        player.equipment[slot] = null;

        // Recalculate stats
        this.applyItemStats(player);

        return item;
    },

    // Apply all equipped item stats to player
    applyItemStats(player) {
        // Reset bonus stats
        player.bonusStats = {
            attack: 0,
            defense: 0,
            health: 0,
            chakra: 0,
            chakraRegen: 0,
            attackSpeed: 1.0
        };

        // Apply equipment stats
        for (let slot in player.equipment) {
            const item = player.equipment[slot];
            if (item && item.stats) {
                for (let stat in item.stats) {
                    if (stat === 'attackSpeed') {
                        player.bonusStats[stat] *= item.stats[stat];
                    } else {
                        player.bonusStats[stat] += item.stats[stat];
                    }
                }
            }
        }

        // Apply passive ability bonuses
        if (player.passives) {
            for (let passiveId of player.passives) {
                const passive = AbilitySystem.getPassive(passiveId);
                if (passive && passive.effects) {
                    if (passive.effects.healthBonus) {
                        player.bonusStats.health += player.baseMaxHealth * passive.effects.healthBonus;
                    }
                    if (passive.effects.chakraBonus) {
                        player.bonusStats.chakra += player.baseMaxChakra * passive.effects.chakraBonus;
                    }
                    if (passive.effects.healthRegen) {
                        if (!player.bonusStats.healthRegen) player.bonusStats.healthRegen = 0;
                        player.bonusStats.healthRegen += passive.effects.healthRegen;
                    }
                    if (passive.effects.chakraRegen) {
                        player.bonusStats.chakraRegen += passive.effects.chakraRegen;
                    }
                }
            }
        }

        // Update max health and chakra
        player.maxHealth = player.baseMaxHealth + player.bonusStats.health;
        player.maxChakra = player.baseMaxChakra + player.bonusStats.chakra;

        // Ensure current values don't exceed max
        player.health = Math.min(player.health, player.maxHealth);
        player.chakra = Math.min(player.chakra, player.maxChakra);
    },

    // Add item to inventory
    addToInventory(player, item) {
        if (!item) return false;

        player.inventory.push(item);
        AudioManager.play('item_pickup');

        return true;
    },

    // Remove item from inventory
    removeFromInventory(player, itemIndex) {
        if (itemIndex < 0 || itemIndex >= player.inventory.length) {
            return null;
        }

        return player.inventory.splice(itemIndex, 1)[0];
    },

    // Sell item
    sellItem(player, item) {
        if (!item) return false;

        // Add gold to player
        if (!player.gold) player.gold = 0;
        player.gold += item.value;

        return true;
    },

    // Buy item from shop
    buyItem(player, itemId) {
        const item = this.getItem(itemId);
        if (!item) return false;

        // Check if player has enough gold
        if (!player.gold || player.gold < item.value) {
            return false;
        }

        // Deduct gold
        player.gold -= item.value;

        // Add to inventory
        this.addToInventory(player, item);

        return true;
    },

    // Get total stats including equipment
    getTotalStats(player) {
        return {
            attack: (player.baseAttack || 0) + player.bonusStats.attack,
            defense: (player.baseDefense || 0) + player.bonusStats.defense,
            maxHealth: player.maxHealth,
            maxChakra: player.maxChakra,
            chakraRegen: (player.baseChakraRegen || 5) + player.bonusStats.chakraRegen,
            attackSpeed: player.bonusStats.attackSpeed,
            healthRegen: (player.bonusStats.healthRegen || 0)
        };
    },

    // Drop item in world
    createItemDrop(x, y, item) {
        return {
            x, y,
            item,
            radius: 15,
            pickupRadius: 40,
            age: 0,
            lifetime: 60, // Despawn after 60 seconds
            bobOffset: Math.random() * Math.PI * 2
        };
    },

    // Update item drops
    updateItemDrops(game, dt) {
        if (!game.itemDrops) return;

        game.itemDrops = game.itemDrops.filter(drop => {
            drop.age += dt;

            // Despawn old drops
            if (drop.age >= drop.lifetime) {
                return false;
            }

            // Check if player picks up
            if (game.player) {
                const distance = Utils.distance(drop.x, drop.y, game.player.x, game.player.y);
                if (distance <= drop.pickupRadius) {
                    this.addToInventory(game.player, drop.item);
                    game.showNotification(`Picked up ${drop.item.name}`);
                    return false;
                }
            }

            return true;
        });
    },

    // Draw item drops
    drawItemDrops(ctx, game) {
        if (!game.itemDrops) return;

        const currentTime = Date.now() / 1000;

        for (let drop of game.itemDrops) {
            const screen = Utils.worldToScreen(drop.x, drop.y, game.camera);

            // Bob up and down
            const bobAmount = Math.sin(currentTime * 3 + drop.bobOffset) * 5;

            ctx.save();

            // Draw glow based on rarity
            const glowColors = {
                'normal': 'rgba(153, 153, 153, 0.3)',
                'enhanced': 'rgba(0, 170, 255, 0.4)',
                'legendary': 'rgba(255, 215, 0, 0.5)'
            };

            ctx.shadowColor = glowColors[drop.item.rarity] || glowColors.normal;
            ctx.shadowBlur = 15;

            // Draw item circle
            const rarityColors = {
                'normal': '#999999',
                'enhanced': '#00AAFF',
                'legendary': '#FFD700'
            };

            Utils.drawCircle(
                ctx,
                screen.x,
                screen.y + bobAmount,
                drop.radius,
                rarityColors[drop.item.rarity] || rarityColors.normal,
                true
            );

            // Draw item icon
            ctx.shadowBlur = 0;
            Utils.drawText(ctx, drop.item.icon, screen.x, screen.y + bobAmount - 10, {
                align: 'center',
                font: '20px Arial'
            });

            // Draw item name when close
            if (game.player) {
                const distance = Utils.distance(drop.x, drop.y, game.player.x, game.player.y);
                if (distance <= drop.pickupRadius * 1.5) {
                    Utils.drawText(ctx, drop.item.name, screen.x, screen.y + bobAmount + 25, {
                        align: 'center',
                        font: 'bold 12px Arial',
                        color: rarityColors[drop.item.rarity] || rarityColors.normal,
                        shadow: true
                    });
                }
            }

            ctx.restore();
        }
    },

    // Get rarity color
    getRarityColor(rarity) {
        const colors = {
            'normal': '#999999',
            'enhanced': '#00AAFF',
            'legendary': '#FFD700'
        };
        return colors[rarity] || colors.normal;
    }
};
