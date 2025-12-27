// UI System for Naruto Action RPG

const UISystem = {
    elements: {},
    initialized: false,
    currentScreen: null,
    game: null,

    init(game) {
        this.game = game;

        // Cache DOM elements
        this.elements = {
            // Screens
            loadingScreen: document.getElementById('loading-screen'),
            mainMenu: document.getElementById('main-menu'),
            characterSelect: document.getElementById('character-select'),

            // HUD
            hud: document.getElementById('hud'),
            playerLevel: document.getElementById('player-level'),
            healthFill: document.getElementById('health-fill'),
            healthText: document.getElementById('health-text'),
            chakraFill: document.getElementById('chakra-fill'),
            chakraText: document.getElementById('chakra-text'),
            xpFill: document.getElementById('xp-fill'),
            xpText: document.getElementById('xp-text'),

            // Modals
            pauseMenu: document.getElementById('pause-menu'),
            inventoryModal: document.getElementById('inventory-modal'),
            abilitiesModal: document.getElementById('abilities-modal'),
            levelUpNotification: document.getElementById('level-up-notification'),
            missionSelectModal: document.getElementById('mission-select-modal'),
            shopModal: document.getElementById('shop-modal'),
            deathModal: document.getElementById('death-modal'),
            missionCompleteModal: document.getElementById('mission-complete-modal'),

            // Other
            eventLog: document.getElementById('event-log'),
            damageNumbers: document.getElementById('damage-numbers'),
            fileInput: document.getElementById('file-input')
        };

        // Setup event listeners
        this.setupEventListeners();

        this.initialized = true;
    },

    setupEventListeners() {
        // Main menu buttons
        document.getElementById('new-game-btn').addEventListener('click', () => {
            AudioManager.playUI('click');
            this.showScreen('character-select');
        });

        document.getElementById('load-game-btn').addEventListener('click', () => {
            AudioManager.playUI('click');
            this.elements.fileInput.click();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            AudioManager.playUI('click');
            alert('Settings coming soon!');
        });

        // Character select
        const characterCards = document.querySelectorAll('.character-card');
        characterCards.forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('locked')) {
                    AudioManager.playUI('error');
                    return;
                }

                AudioManager.playUI('click');

                // Remove previous selection
                characterCards.forEach(c => c.classList.remove('selected'));

                // Select this card
                card.classList.add('selected');

                // Enable start button
                document.getElementById('start-game-btn').disabled = false;

                // Store selected character
                this.selectedCharacter = card.dataset.character;
            });
        });

        document.getElementById('start-game-btn').addEventListener('click', () => {
            if (!this.selectedCharacter) return;

            AudioManager.playUI('click');
            this.game.startGame(this.selectedCharacter);
        });

        // Pause menu
        document.getElementById('pause-btn').addEventListener('click', () => {
            AudioManager.playUI('click');
            this.showModal('pause-menu');
            this.game.pause();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            AudioManager.playUI('click');
            this.hideModal('pause-menu');
            this.game.resume();
        });

        document.getElementById('inventory-btn').addEventListener('click', () => {
            AudioManager.playUI('click');
            this.hideModal('pause-menu');
            this.showModal('inventory-modal');
            this.updateInventoryUI();
        });

        document.getElementById('abilities-btn').addEventListener('click', () => {
            AudioManager.playUI('click');
            this.hideModal('pause-menu');
            this.showModal('abilities-modal');
            this.updateAbilitiesUI();
        });

        document.getElementById('save-game-btn').addEventListener('click', () => {
            AudioManager.playUI('click');
            SaveSystem.exportSave(this.game);
        });

        document.getElementById('main-menu-btn').addEventListener('click', () => {
            AudioManager.playUI('click');
            if (confirm('Return to main menu? Unsaved progress will be lost.')) {
                this.game.returnToMainMenu();
            }
        });

        // Modal close buttons
        document.getElementById('close-inventory-btn').addEventListener('click', () => {
            AudioManager.playUI('click');
            this.hideModal('inventory-modal');
            this.showModal('pause-menu');
        });

        document.getElementById('close-abilities-btn').addEventListener('click', () => {
            AudioManager.playUI('click');
            this.hideModal('abilities-modal');
            this.showModal('pause-menu');
        });

        // File input for load game
        this.elements.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                SaveSystem.importSave(file, this.game);
            }
        });
    },

    // Show screen
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show HUD if entering game
        if (screenId === 'game') {
            this.elements.hud.classList.remove('hidden');
            this.currentScreen = 'game';
        } else {
            this.elements.hud.classList.add('hidden');
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.add('active');
                this.currentScreen = screenId;
            }
        }
    },

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    // Hide modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Update HUD
    updateHUD(player) {
        if (!player) return;

        // Update level
        this.elements.playerLevel.textContent = player.level;

        // Update health
        const healthPercent = (player.health / player.maxHealth) * 100;
        this.elements.healthFill.style.width = healthPercent + '%';
        this.elements.healthText.textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;

        // Update chakra
        const chakraPercent = (player.chakra / player.maxChakra) * 100;
        this.elements.chakraFill.style.width = chakraPercent + '%';
        this.elements.chakraText.textContent = `${Math.ceil(player.chakra)}/${player.maxChakra}`;

        // Update XP
        const xpPercent = (player.xp / player.xpToNextLevel) * 100;
        this.elements.xpFill.style.width = xpPercent + '%';
        this.elements.xpText.textContent = `${Math.ceil(player.xp)}/${player.xpToNextLevel}`;

        // Update abilities
        this.updateAbilityButtons(player);
    },

    // Update ability buttons
    updateAbilityButtons(player) {
        const abilityBtns = document.querySelectorAll('.ability-btn');

        abilityBtns.forEach((btn, index) => {
            const abilityId = player.equippedAbilities[index];
            const nameEl = btn.querySelector('.ability-name');
            const cooldownEl = btn.querySelector('.ability-cooldown');

            if (abilityId) {
                const ability = AbilitySystem.getAbility(abilityId);
                if (ability) {
                    // Update name
                    nameEl.textContent = ability.name.split(' ')[0]; // First word only

                    // Update cooldown
                    const cooldown = player.abilityCooldowns[abilityId] || 0;
                    if (cooldown > 0) {
                        btn.classList.add('on-cooldown');
                        cooldownEl.textContent = Math.ceil(cooldown);
                    } else {
                        btn.classList.remove('on-cooldown');
                        cooldownEl.textContent = '';
                    }

                    // Check if can cast
                    if (!AbilitySystem.canCast(ability, player)) {
                        btn.style.opacity = '0.5';
                    } else {
                        btn.style.opacity = '1.0';
                    }
                }
            } else {
                nameEl.textContent = '';
                btn.classList.remove('on-cooldown');
            }
        });
    },

    // Update inventory UI
    updateInventoryUI() {
        const player = this.game.player;
        if (!player) return;

        // Update equipped items
        for (let slot in player.equipment) {
            const item = player.equipment[slot];
            const slotEl = document.getElementById(`equipped-${slot}`);

            if (item) {
                slotEl.textContent = `${item.icon} ${item.name}`;
                slotEl.classList.add('filled');
            } else {
                slotEl.textContent = 'Empty';
                slotEl.classList.remove('filled');
            }
        }

        // Update stats
        const stats = ItemSystem.getTotalStats(player);
        document.getElementById('stat-attack').textContent = stats.attack;
        document.getElementById('stat-defense').textContent = stats.defense;
        document.getElementById('stat-chakra-regen').textContent = stats.chakraRegen.toFixed(1);

        // Update inventory grid
        const inventoryGrid = document.getElementById('inventory-grid');
        inventoryGrid.innerHTML = '';

        player.inventory.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = `inventory-item ${item.rarity}`;
            itemEl.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name}</div>
            `;

            itemEl.addEventListener('click', () => {
                AudioManager.playUI('click');
                this.showItemMenu(item, index);
            });

            inventoryGrid.appendChild(itemEl);
        });
    },

    // Show item menu (equip/sell)
    showItemMenu(item, index) {
        const player = this.game.player;

        const action = confirm(`${item.name}\n\n${item.description}\n\nEquip this item?`);

        if (action) {
            // Remove from inventory
            ItemSystem.removeFromInventory(player, index);

            // Equip
            ItemSystem.equipItem(player, item);

            // Update UI
            this.updateInventoryUI();
        }
    },

    // Update abilities UI
    updateAbilitiesUI() {
        const player = this.game.player;
        if (!player) return;

        const charDef = PlayerSystem.characters[player.characterId];
        if (!charDef) return;

        // Update Active Abilities
        const activeGrid = document.getElementById('active-abilities-grid');
        activeGrid.innerHTML = '';

        charDef.abilities.forEach(abilityId => {
            const ability = AbilitySystem.getAbility(abilityId);
            if (ability) {
                const isEquipped = player.equippedAbilities.includes(abilityId);
                const card = this.createActiveAbilityCard(ability, isEquipped, player);
                activeGrid.appendChild(card);
            }
        });

        // Update Passive Abilities
        const passiveGrid = document.getElementById('passive-abilities-grid');
        passiveGrid.innerHTML = '';

        charDef.passives.forEach(passiveId => {
            const passive = AbilitySystem.getPassive(passiveId);
            if (passive) {
                const unlockLevel = charDef.passiveUnlockLevels[passiveId] || 1;
                const isUnlocked = player.passives.includes(passiveId);
                const card = this.createPassiveAbilityCard(passive, isUnlocked, unlockLevel, player);
                passiveGrid.appendChild(card);
            }
        });
    },

    // Create active ability card
    createActiveAbilityCard(ability, isEquipped, player) {
        const card = document.createElement('div');
        card.className = 'ability-card';

        if (isEquipped) {
            card.classList.add('equipped');
        }

        const rank = ability.currentRank || 0;
        const rankInfo = ability.ranks ? ability.ranks[rank] : null;
        const usage = player.abilityUsage[ability.id] || 0;

        // Calculate next rank requirements
        const usageThresholds = [50, 150, 300];
        const nextRankUsage = rank < usageThresholds.length ? usageThresholds[rank] : null;
        const progress = nextRankUsage ? Math.min((usage / nextRankUsage) * 100, 100) : 100;

        // Get stats from current rank
        let statsHTML = '';
        if (rankInfo) {
            const stats = Object.entries(rankInfo).filter(([key]) => key !== 'level');
            statsHTML = stats.map(([key, value]) => {
                const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                return `<span>${label}: ${value}</span>`;
            }).join('');
        }

        card.innerHTML = `
            <div class="ability-card-header">
                <h4>${ability.name}</h4>
                <span class="ability-rank">Rank ${rank + 1}/3</span>
            </div>
            <div class="ability-description">${ability.description}</div>
            <div class="ability-stats">
                <span>⚡ ${ability.chakraCost} Chakra</span>
                <span>⏱️ ${ability.cooldown}s CD</span>
            </div>
            ${statsHTML ? `<div class="ability-stats">${statsHTML}</div>` : ''}
            ${isEquipped ? '<div class="ability-unlock-condition">✓ Currently Equipped</div>' : ''}
            ${nextRankUsage ? `
                <div class="ability-progression">
                    <div class="ability-progression-label">Rank ${rank + 2} Progress</div>
                    <div class="ability-progress-bar">
                        <div class="ability-progress-fill" style="width: ${progress}%"></div>
                        <div class="ability-progress-text">${usage} / ${nextRankUsage} uses</div>
                    </div>
                </div>
            ` : '<div class="ability-unlock-condition">🌟 Max Rank Achieved!</div>'}
        `;

        return card;
    },

    // Create passive ability card
    createPassiveAbilityCard(passive, isUnlocked, unlockLevel, player) {
        const card = document.createElement('div');
        card.className = 'ability-card';

        if (!isUnlocked) {
            card.classList.add('locked');
        }

        card.innerHTML = `
            <div class="ability-card-header">
                <h4>${passive.name}</h4>
                <span class="ability-rank">${isUnlocked ? 'Active' : 'Locked'}</span>
            </div>
            <div class="ability-description">${passive.description}</div>
            ${isUnlocked
                ? '<div class="ability-unlock-condition">✓ Unlocked</div>'
                : `<div class="ability-unlock-condition">🔒 Unlocks at Level ${unlockLevel} (Current: ${player.level})</div>`
            }
        `;

        return card;
    },

    // Show damage number
    showDamageNumber(x, y, damage, type) {
        const damageEl = document.createElement('div');
        damageEl.className = `damage-number ${type}`;
        damageEl.textContent = Math.ceil(damage);

        // Convert world coordinates to screen coordinates
        const screenPos = Utils.worldToScreen(x, y, this.game.camera);

        damageEl.style.left = screenPos.x + 'px';
        damageEl.style.top = screenPos.y + 'px';

        this.elements.damageNumbers.appendChild(damageEl);

        // Add to event log
        const dmg = Math.ceil(damage);
        if (type === 'player-damage') {
            this.addEventLog(`Dealt ${dmg} damage`, 'damage-dealt');
        } else if (type === 'enemy-damage') {
            this.addEventLog(`Took ${dmg} damage`, 'damage-received');
        }

        // Remove after animation
        setTimeout(() => {
            damageEl.remove();
        }, 1000);
    },

    // Show notification
    showNotification(message, duration = 2000) {
        // Create notification element
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.textContent = message;
        notif.style.position = 'absolute';
        notif.style.top = '50%';
        notif.style.left = '50%';
        notif.style.transform = 'translate(-50%, -50%)';
        notif.style.background = 'rgba(255, 107, 26, 0.9)';
        notif.style.color = '#FFFFFF';
        notif.style.padding = '20px 40px';
        notif.style.borderRadius = '10px';
        notif.style.fontSize = '1.5em';
        notif.style.fontWeight = 'bold';
        notif.style.zIndex = '700';
        notif.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';

        document.getElementById('game-container').appendChild(notif);

        setTimeout(() => {
            notif.remove();
        }, duration);
    },

    // Add message to event log
    addEventLog(message, type = 'info') {
        const log = this.elements.eventLog;
        if (!log) return;

        const messageEl = document.createElement('div');
        messageEl.className = `event-message ${type}`;
        messageEl.textContent = message;

        log.appendChild(messageEl);

        // Remove message after animation completes
        setTimeout(() => {
            messageEl.remove();
        }, 4000);

        // Limit number of messages (keep last 10)
        const messages = log.querySelectorAll('.event-message');
        if (messages.length > 10) {
            messages[0].remove();
        }
    },

    // Show level up notification
    showLevelUpNotification(level) {
        const notif = this.elements.levelUpNotification;
        document.getElementById('level-up-value').textContent = level;

        notif.classList.add('active');

        setTimeout(() => {
            notif.classList.remove('active');
        }, 3000);
    },

    // Show interact prompt
    showInteractPrompt(message) {
        // Simple implementation - could be enhanced
        if (!this.interactPrompt) {
            this.interactPrompt = document.createElement('div');
            this.interactPrompt.style.position = 'absolute';
            this.interactPrompt.style.bottom = '120px';
            this.interactPrompt.style.left = '50%';
            this.interactPrompt.style.transform = 'translateX(-50%)';
            this.interactPrompt.style.background = 'rgba(0, 0, 0, 0.8)';
            this.interactPrompt.style.color = '#FFFFFF';
            this.interactPrompt.style.padding = '10px 20px';
            this.interactPrompt.style.borderRadius = '5px';
            this.interactPrompt.style.fontSize = '1em';
            this.interactPrompt.style.zIndex = '150';
            document.getElementById('game-container').appendChild(this.interactPrompt);
        }

        this.interactPrompt.textContent = message;
        this.interactPrompt.style.display = 'block';

        // Clear after a bit if not updated
        clearTimeout(this.interactPromptTimeout);
        this.interactPromptTimeout = setTimeout(() => {
            if (this.interactPrompt) {
                this.interactPrompt.style.display = 'none';
            }
        }, 100);
    },

    // Hide loading screen
    hideLoadingScreen() {
        setTimeout(() => {
            this.elements.loadingScreen.classList.remove('active');
            this.showScreen('main-menu');
        }, 1000);
    },

    // Update loading progress
    updateLoadingProgress(percent) {
        const progressBar = document.querySelector('.loading-progress');
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
    },

    // Show mission select modal
    showMissionSelectModal(mission, game) {
        document.getElementById('mission-title').textContent = mission.name;
        document.getElementById('mission-description').textContent = mission.description;
        document.getElementById('mission-difficulty').textContent = `Difficulty: ${mission.difficulty}`;

        const modal = this.elements.missionSelectModal;
        modal.classList.remove('hidden');
        modal.classList.add('active');

        // Setup buttons
        const acceptBtn = document.getElementById('accept-mission-btn');
        const cancelBtn = document.getElementById('cancel-mission-btn');

        const acceptHandler = () => {
            game.currentMission = mission.id;
            MapSystem.loadMap('land_of_waves', game);
            this.hideModal('mission-select-modal');
            acceptBtn.removeEventListener('click', acceptHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
        };

        const cancelHandler = () => {
            this.hideModal('mission-select-modal');
            acceptBtn.removeEventListener('click', acceptHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
        };

        acceptBtn.addEventListener('click', acceptHandler);
        cancelBtn.addEventListener('click', cancelHandler);
    },

    // Show shop modal
    showShopModal(npc, game) {
        document.getElementById('shop-title').textContent = npc.name;
        document.getElementById('shop-player-gold').textContent = game.player.gold;
        document.getElementById('shop-items').innerHTML = '<p>Shop system coming soon!</p>';

        const modal = this.elements.shopModal;
        modal.classList.remove('hidden');
        modal.classList.add('active');

        const closeBtn = document.getElementById('close-shop-btn');
        const closeHandler = () => {
            this.hideModal('shop-modal');
            closeBtn.removeEventListener('click', closeHandler);
        };
        closeBtn.addEventListener('click', closeHandler);
    },

    // Show death modal
    showDeathModal(game) {
        const modal = this.elements.deathModal;
        modal.classList.remove('hidden');
        modal.classList.add('active');

        const respawnBtn = document.getElementById('respawn-btn');
        const menuBtn = document.getElementById('death-menu-btn');

        const respawnHandler = () => {
            // Respawn in hub
            game.player.isDead = false;
            game.player.health = game.player.maxHealth;
            game.player.chakra = game.player.maxChakra;
            MapSystem.loadMap('konoha_hub', game);
            this.hideModal('death-modal');
            respawnBtn.removeEventListener('click', respawnHandler);
            menuBtn.removeEventListener('click', menuHandler);
        };

        const menuHandler = () => {
            game.returnToMainMenu();
            this.hideModal('death-modal');
            respawnBtn.removeEventListener('click', respawnHandler);
            menuBtn.removeEventListener('click', menuHandler);
        };

        respawnBtn.addEventListener('click', respawnHandler);
        menuBtn.addEventListener('click', menuHandler);
    },

    // Show mission complete modal
    showMissionCompleteModal(goldReward, xpReward, game) {
        const rewardsDiv = document.getElementById('mission-rewards');
        rewardsDiv.innerHTML = `
            <p style="color: var(--naruto-gold); font-size: 1.2em;">+${goldReward} Gold</p>
            <p style="color: var(--naruto-green); font-size: 1.2em;">+${xpReward} XP</p>
        `;

        const modal = this.elements.missionCompleteModal;
        modal.classList.remove('hidden');
        modal.classList.add('active');

        const returnBtn = document.getElementById('return-to-village-btn');
        const stayBtn = document.getElementById('stay-on-map-btn');

        const returnHandler = () => {
            MapSystem.loadMap('konoha_hub', game);
            this.hideModal('mission-complete-modal');
            returnBtn.removeEventListener('click', returnHandler);
            stayBtn.removeEventListener('click', stayHandler);
        };

        const stayHandler = () => {
            this.addEventLog('You can return via the exit zone', 'info');
            this.hideModal('mission-complete-modal');
            returnBtn.removeEventListener('click', returnHandler);
            stayBtn.removeEventListener('click', stayHandler);
        };

        returnBtn.addEventListener('click', returnHandler);
        stayBtn.addEventListener('click', stayHandler);
    }
};
