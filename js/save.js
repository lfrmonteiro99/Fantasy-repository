// Save/Load System for Naruto Action RPG

const SaveSystem = {
    // Export save data
    exportSave(game) {
        const player = game.player;
        if (!player) {
            alert('No active game to save!');
            return;
        }

        // Compile save data
        const saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            saveDate: new Date().toISOString(),

            // Player data
            player: {
                characterId: player.characterId,
                name: player.name,
                level: player.level,
                xp: player.xp,
                health: player.health,
                chakra: player.chakra,
                gold: player.gold,

                // Position (save current map position)
                currentMap: game.currentMap?.id || 'konoha_hub',
                x: player.x,
                y: player.y,

                // Equipment
                equipment: player.equipment,

                // Inventory
                inventory: player.inventory,

                // Abilities
                equippedAbilities: player.equippedAbilities,
                passives: player.passives,
                abilityUsage: player.abilityUsage,

                // Stats
                baseMaxHealth: player.baseMaxHealth,
                baseMaxChakra: player.baseMaxChakra,
                baseAttack: player.baseAttack,
                baseDefense: player.baseDefense
            },

            // Game progress
            progress: {
                unlockedCharacters: this.getUnlockedCharacters(game),
                completedMissions: game.completedMissions || [],
                currentMission: game.currentMission || null
            }
        };

        // Convert to JSON
        const json = JSON.stringify(saveData, null, 2);

        // Create blob and download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `naruto_rpg_save_${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);

        AudioManager.play('item_pickup');
        alert('Game saved successfully!');
    },

    // Import save data
    async importSave(file, game) {
        try {
            const text = await file.text();
            const saveData = JSON.parse(text);

            // Validate save data
            if (!this.validateSaveData(saveData)) {
                throw new Error('Invalid save file');
            }

            // Load save data
            this.loadSaveData(saveData, game);

            AudioManager.play('item_pickup');
            alert('Game loaded successfully!');
        } catch (error) {
            console.error('Failed to load save:', error);
            AudioManager.play('ui_error');
            alert('Failed to load save file. Please check the file and try again.');
        }
    },

    // Validate save data
    validateSaveData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!data.version || !data.player) return false;
        if (!data.player.characterId || !data.player.level) return false;

        return true;
    },

    // Load save data into game
    loadSaveData(saveData, game) {
        const playerData = saveData.player;

        // Create player from save data
        const player = PlayerSystem.createPlayer(
            playerData.characterId,
            playerData.x || 400,
            playerData.y || 300
        );

        // Restore player state
        player.level = playerData.level;
        player.xp = playerData.xp;
        player.health = playerData.health;
        player.chakra = playerData.chakra;
        player.gold = playerData.gold || 0;

        // Restore stats
        player.baseMaxHealth = playerData.baseMaxHealth;
        player.baseMaxChakra = playerData.baseMaxChakra;
        player.baseAttack = playerData.baseAttack;
        player.baseDefense = playerData.baseDefense;

        // Restore equipment
        player.equipment = playerData.equipment || {
            weapon: null,
            armor: null,
            accessory: null
        };

        // Restore inventory
        player.inventory = playerData.inventory || [];

        // Restore abilities
        player.equippedAbilities = playerData.equippedAbilities || [];
        player.passives = playerData.passives || [];
        player.abilityUsage = playerData.abilityUsage || {};

        // Apply passives and equipment stats
        ItemSystem.applyItemStats(player);

        // Set player in game
        game.player = player;

        // Restore progress
        if (saveData.progress) {
            game.completedMissions = saveData.progress.completedMissions || [];
            game.currentMission = saveData.progress.currentMission || null;
        }

        // Load the saved map
        const mapId = playerData.currentMap || 'konoha_hub';
        MapSystem.loadMap(mapId, game);

        // Position player
        player.x = playerData.x || player.x;
        player.y = playerData.y || player.y;
        player.targetX = player.x;
        player.targetY = player.y;

        // Start game
        game.state = 'playing';
        UISystem.showScreen('game');
        game.paused = false;
    },

    // Get unlocked characters (for future use)
    getUnlockedCharacters(game) {
        const unlocked = ['naruto']; // Naruto is always unlocked

        // Add logic for unlocking other characters later

        return unlocked;
    },

    // Auto-save (could be called periodically)
    autoSave(game) {
        if (!game.player) return;

        // Store in localStorage as backup
        try {
            const saveData = this.createSaveData(game);
            localStorage.setItem('naruto_rpg_autosave', JSON.stringify(saveData));
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    },

    // Load auto-save
    loadAutoSave(game) {
        try {
            const data = localStorage.getItem('naruto_rpg_autosave');
            if (data) {
                const saveData = JSON.parse(data);
                if (this.validateSaveData(saveData)) {
                    this.loadSaveData(saveData, game);
                    return true;
                }
            }
        } catch (error) {
            console.error('Failed to load auto-save:', error);
        }

        return false;
    },

    // Create save data object (helper)
    createSaveData(game) {
        const player = game.player;

        return {
            version: '1.0.0',
            timestamp: Date.now(),
            saveDate: new Date().toISOString(),

            player: {
                characterId: player.characterId,
                name: player.name,
                level: player.level,
                xp: player.xp,
                health: player.health,
                chakra: player.chakra,
                gold: player.gold,

                currentMap: game.currentMap?.id || 'konoha_hub',
                x: player.x,
                y: player.y,

                equipment: player.equipment,
                inventory: player.inventory,
                equippedAbilities: player.equippedAbilities,
                passives: player.passives,
                abilityUsage: player.abilityUsage,

                baseMaxHealth: player.baseMaxHealth,
                baseMaxChakra: player.baseMaxChakra,
                baseAttack: player.baseAttack,
                baseDefense: player.baseDefense
            },

            progress: {
                unlockedCharacters: this.getUnlockedCharacters(game),
                completedMissions: game.completedMissions || [],
                currentMission: game.currentMission || null
            }
        };
    }
};
