// Maps System for Naruto Action RPG

const MapSystem = {
    // Map definitions
    maps: {
        'konoha_hub': {
            id: 'konoha_hub',
            name: 'Hidden Leaf Village',
            type: 'hub',
            width: 520,
            height: 520,
            backgroundColor: '#87CEEB',
            backgroundImage: 'assets/sprites/Game Boy Advance - Naruto RPG_ Uketsugareshi Hi no Ishi (JPN) - Backgrounds - Konoha Village.gif',
            // Crop coordinates for main village area only
            imageCrop: { x: 0, y: 0, width: 520, height: 520 },
            // Walkable rectangular zones (in SCREEN coordinates)
            walkableZones: [
                // Main horizontal path
                { x: 162, y: 310, width: 1429, height: 60 }, // (162,310) to (1591,370)
                // Vertical connection
                { x: 729, y: 297, width: 162, height: 28 }  // (729,297) to (891,325)
            ],
            playerSpawn: { x: 260, y: 340 }, // Center of main path
            npcs: [],
            decorations: [],
            // Mission Log - bottom gate
            interactionZones: [
                {
                    id: 'mission_log',
                    name: 'Mission Log',
                    type: 'mission_log',
                    x: 220,
                    y: 460,
                    width: 80,
                    height: 50,
                    interactRange: 30,
                    dialogue: ['Mission Log', 'View available missions']
                }
            ]
        },

        'land_of_waves': {
            id: 'land_of_waves',
            name: 'Great Naruto Bridge',
            type: 'mission',
            width: 2000,
            height: 1600,
            backgroundColor: '#4682B4',
            playerSpawn: { x: 200, y: 800 },
            enemyWaves: [
                {
                    id: 'wave_1',
                    trigger: { type: 'distance', x: 600, y: 800, radius: 100 },
                    triggered: false,
                    enemies: [
                        { type: 'bandit', x: 700, y: 700 },
                        { type: 'bandit', x: 700, y: 900 },
                        { type: 'bandit', x: 800, y: 800 }
                    ]
                },
                {
                    id: 'wave_2',
                    trigger: { type: 'distance', x: 1000, y: 800, radius: 100 },
                    triggered: false,
                    enemies: [
                        { type: 'bandit', x: 1100, y: 700 },
                        { type: 'bandit', x: 1100, y: 900 },
                        { type: 'bandit', x: 1100, y: 600 },
                        { type: 'bandit', x: 1100, y: 1000 }
                    ]
                },
                {
                    id: 'wave_3_elite',
                    trigger: { type: 'distance', x: 1400, y: 800, radius: 100 },
                    triggered: false,
                    enemies: [
                        { type: 'demon_brother', x: 1500, y: 750 },
                        { type: 'demon_brother', x: 1500, y: 850 }
                    ]
                },
                {
                    id: 'boss_zabuza',
                    trigger: { type: 'distance', x: 1800, y: 800, radius: 100 },
                    triggered: false,
                    enemies: [
                        { type: 'zabuza', x: 1900, y: 800 }
                    ],
                    isBossFight: true,
                    onTrigger: 'startBossFight'
                }
            ],
            decorations: [
                // Bridge structure
                { type: 'bridge', x: 0, y: 700, width: 2000, height: 200, color: '#8B7355' },
                { type: 'water', x: 0, y: 0, width: 2000, height: 700, color: '#1E90FF' },
                { type: 'water', x: 0, y: 900, width: 2000, height: 700, color: '#1E90FF' },
                // Bridge supports
                { type: 'pillar', x: 400, y: 750, width: 30, height: 100, color: '#696969' },
                { type: 'pillar', x: 800, y: 750, width: 30, height: 100, color: '#696969' },
                { type: 'pillar', x: 1200, y: 750, width: 30, height: 100, color: '#696969' },
                { type: 'pillar', x: 1600, y: 750, width: 30, height: 100, color: '#696969' }
            ],
            exitZone: { x: 50, y: 800, radius: 60, targetMap: 'konoha_hub' }
        }
    },

    // Current map state
    currentMap: null,
    activeInteractNPC: null,
    missionCompleted: false,
    hiddenMist: false,
    hiddenMistAlpha: 0,
    loadedImages: {},

    // Load map
    loadMap(mapId, game) {
        const map = this.maps[mapId];
        if (!map) {
            console.error(`Map ${mapId} not found`);
            return false;
        }

        this.currentMap = { ...map };
        game.currentMap = this.currentMap;

        // Calculate scale factors FIRST for fullscreen hub maps
        if (map.type === 'hub' && map.backgroundImage && map.imageCrop) {
            const crop = map.imageCrop;
            this.currentMap.scaleX = game.canvas.width / crop.width;
            this.currentMap.scaleY = game.canvas.height / crop.height;
        }

        // Reset map state
        this.missionCompleted = false;
        this.hiddenMist = false;
        this.hiddenMistAlpha = 0;

        // Load background image if specified
        if (map.backgroundImage && !this.loadedImages[map.backgroundImage]) {
            const img = new Image();
            img.src = map.backgroundImage;
            img.onload = () => {
                console.log('🗺️ Map background loaded:', map.backgroundImage);
            };
            this.loadedImages[map.backgroundImage] = img;
        }

        // Spawn player at SCALED coordinates
        if (game.player) {
            const scaleX = this.currentMap.scaleX || 1;
            const scaleY = this.currentMap.scaleY || 1;

            let spawnX = map.playerSpawn.x * scaleX;
            let spawnY = map.playerSpawn.y * scaleY;

            // Ensure spawn point is walkable (for maps with collision)
            const walkablePos = this.findNearestWalkablePosition(spawnX, spawnY);
            game.player.x = walkablePos.x;
            game.player.y = walkablePos.y;
            game.player.targetX = game.player.x;
            game.player.targetY = game.player.y;
        }

        // Clear enemies
        game.enemies = [];

        // Clear projectiles and particles
        game.projectiles = [];
        game.particles = [];
        game.itemDrops = [];

        // Reset enemy waves
        if (this.currentMap.enemyWaves) {
            for (let wave of this.currentMap.enemyWaves) {
                wave.triggered = false;
            }
        }

        // Center camera on player (or lock at 0,0 for fullscreen maps)
        if (game.camera && game.player) {
            if (map.type === 'hub' && map.backgroundImage) {
                // Lock camera at (0,0) for hub maps that fill the viewport
                game.camera.x = 0;
                game.camera.y = 0;
            } else {
                // Center camera on player for other maps
                game.camera.x = game.player.x - game.canvas.width / 2;
                game.camera.y = game.player.y - game.canvas.height / 2;
            }
        }

        return true;
    },

    // Find nearest walkable position (spiral search)
    findNearestWalkablePosition(x, y, maxRadius = 100) {
        // Check if current position is already walkable
        if (this.isWalkable(x, y)) {
            return { x, y };
        }

        // Spiral search outward
        for (let radius = 5; radius <= maxRadius; radius += 5) {
            const steps = radius * 8; // More steps for smoother spiral
            for (let i = 0; i < steps; i++) {
                const angle = (Math.PI * 2 * i) / steps;
                const testX = x + Math.cos(angle) * radius;
                const testY = y + Math.sin(angle) * radius;

                if (this.isWalkable(testX, testY)) {
                    return { x: testX, y: testY };
                }
            }
        }

        // Fallback: return original position
        console.warn('Could not find walkable position near', x, y);
        return { x, y };
    },

    // Check if a position is walkable
    isWalkable(x, y) {
        if (!this.currentMap) return true;

        // Konoha hub: only allow specific rectangular paths
        if (this.currentMap.id === 'konoha_hub') {
            // Rectangle 1: Main horizontal path (162,310) to (1591,370)
            if (x >= 162 && x <= 1591 && y >= 310 && y <= 370) {
                return true;
            }

            // Rectangle 2: Vertical connection (729,297) to (891,325)
            if (x >= 729 && x <= 891 && y >= 297 && y <= 325) {
                return true;
            }

            // Not in any walkable zone
            return false;
        }

        // Other maps: allow all movement
        return true;
    },

    // Update map
    update(game, dt) {
        if (!this.currentMap) return;

        // Check enemy wave triggers
        if (this.currentMap.enemyWaves) {
            for (let wave of this.currentMap.enemyWaves) {
                if (!wave.triggered) {
                    if (this.checkWaveTrigger(wave, game)) {
                        this.triggerWave(wave, game);
                    }
                }
            }
        }

        // Check NPC interactions
        if (this.currentMap.npcs) {
            this.updateNPCInteractions(game);
        }

        // Check interaction zones
        if (this.currentMap.interactionZones) {
            this.updateInteractionZones(game);
        }

        // Check exit zone
        if (this.currentMap.exitZone && game.player) {
            const dist = Utils.distance(
                game.player.x,
                game.player.y,
                this.currentMap.exitZone.x,
                this.currentMap.exitZone.y
            );

            if (dist <= this.currentMap.exitZone.radius) {
                // Allow exit if no enemies (or in hub)
                if (this.currentMap.type === 'hub' || !game.enemies || game.enemies.filter(e => !e.isDead).length === 0) {
                    const isMobile = window.isMobileDevice || false;
                    const message = isMobile
                        ? 'TAP HERE to return to village'
                        : 'Press SPACE to return to village';
                    game.showInteractPrompt(message);

                    const shouldExit = (game.input && game.input.space) ||
                                      (game.lastTapInExitZone);

                    if (shouldExit) {
                        this.loadMap(this.currentMap.exitZone.targetMap, game);
                        game.input.space = false;
                        game.lastTapInExitZone = false;
                    }
                }
            }
        }

        // Update hidden mist effect
        if (this.hiddenMist) {
            this.hiddenMistAlpha = Math.min(this.hiddenMistAlpha + dt * 0.5, 0.6);
        } else {
            this.hiddenMistAlpha = Math.max(this.hiddenMistAlpha - dt * 0.5, 0);
        }
    },

    // Check if wave should trigger
    checkWaveTrigger(wave, game) {
        if (!game.player) return false;

        if (wave.trigger.type === 'distance') {
            const dist = Utils.distance(
                game.player.x,
                game.player.y,
                wave.trigger.x,
                wave.trigger.y
            );
            return dist <= wave.trigger.radius;
        }

        return false;
    },

    // Trigger enemy wave
    triggerWave(wave, game) {
        wave.triggered = true;

        EnemySystem.spawnWave(game, wave.enemies);

        if (wave.isBossFight) {
            game.showNotification('Boss Fight: Zabuza Momochi!');
            AudioManager.play('nine_tails'); // Epic sound for boss
        }
    },

    // Update NPC interactions
    updateNPCInteractions(game) {
        if (!game.player) return;

        this.activeInteractNPC = null;

        for (let npc of this.currentMap.npcs) {
            const dist = Utils.distance(game.player.x, game.player.y, npc.x, npc.y);

            if (dist <= npc.interactRange) {
                this.activeInteractNPC = npc;

                // Show interact prompt with mobile-friendly message
                const isMobile = window.isMobileDevice || false;
                const message = isMobile
                    ? `TAP to talk to ${npc.name}`
                    : `Press SPACE to talk to ${npc.name}`;
                game.showInteractPrompt(message);

                // Handle interaction - SPACE key OR if player tapped close to NPC
                const shouldInteract = (game.input && game.input.space) ||
                                      (game.lastTapNearNPC === npc);

                if (shouldInteract) {
                    this.interactWithNPC(npc, game);
                    game.input.space = false;
                    game.lastTapNearNPC = null;
                }

                break;
            }
        }
    },

    // Update interaction zones
    updateInteractionZones(game) {
        if (!game.player) return;

        // Reset active zone
        this.activeInteractZone = null;

        // Get scale factors
        const scaleX = this.currentMap.scaleX || 1;
        const scaleY = this.currentMap.scaleY || 1;

        for (let zone of this.currentMap.interactionZones) {
            // Scale zone coordinates to match player's scaled coordinates
            const scaledZoneX = zone.x * scaleX;
            const scaledZoneY = zone.y * scaleY;
            const scaledZoneWidth = zone.width * scaleX;
            const scaledZoneHeight = zone.height * scaleY;
            const scaledRange = zone.interactRange * Math.min(scaleX, scaleY);

            // Check if player is inside or near the zone
            const playerInZone =
                game.player.x >= scaledZoneX - scaledRange &&
                game.player.x <= scaledZoneX + scaledZoneWidth + scaledRange &&
                game.player.y >= scaledZoneY - scaledRange &&
                game.player.y <= scaledZoneY + scaledZoneHeight + scaledRange;

            if (playerInZone) {
                // Mark zone as active
                this.activeInteractZone = zone;

                // Show interact prompt
                const isMobile = window.isMobileDevice || false;
                const message = isMobile
                    ? `TAP to access ${zone.name}`
                    : `Press SPACE to access ${zone.name}`;
                game.showInteractPrompt(message);

                // Handle interaction
                const shouldInteract = (game.input && game.input.space) ||
                                      (game.lastTapInZone);

                if (shouldInteract) {
                    this.interactWithZone(zone, game);
                    if (game.input) game.input.space = false;
                    game.lastTapInZone = null;
                }

                break;
            }
        }
    },

    // Interact with zone
    interactWithZone(zone, game) {
        if (zone.type === 'mission_log') {
            game.openMissionSelect();
        }

        AudioManager.playUI('click');
    },

    // Interact with NPC
    interactWithNPC(npc, game) {
        if (npc.type === 'shop') {
            game.openShop(npc);
        } else if (npc.type === 'missions') {
            game.openMissionSelect(npc);
        }

        AudioManager.playUI('click');
    },

    // Draw map
    draw(ctx, game) {
        if (!this.currentMap) return;

        const camera = game.camera;

        // Draw background
        if (this.currentMap.backgroundImage) {
            const img = this.loadedImages[this.currentMap.backgroundImage];
            if (img && img.complete) {
                // Get crop settings or use full image
                const crop = this.currentMap.imageCrop || {
                    x: 0,
                    y: 0,
                    width: img.width,
                    height: img.height
                };

                // Draw cropped portion SCALED to fill entire viewport
                ctx.drawImage(
                    img,
                    crop.x, crop.y, crop.width, crop.height,  // Source crop
                    0, 0, game.canvas.width, game.canvas.height  // Fill entire viewport
                );

                // Store scale factors for collision detection
                this.currentMap.scaleX = game.canvas.width / crop.width;
                this.currentMap.scaleY = game.canvas.height / crop.height;
            } else {
                // Fallback to solid color while image loads
                ctx.fillStyle = this.currentMap.backgroundColor;
                ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
            }
        } else {
            // Draw solid color background
            ctx.fillStyle = this.currentMap.backgroundColor;
            ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        }

        // Draw decorations
        if (this.currentMap.decorations) {
            for (let deco of this.currentMap.decorations) {
                this.drawDecoration(ctx, deco, camera);
            }
        }

        // Draw NPCs
        if (this.currentMap.npcs) {
            for (let npc of this.currentMap.npcs) {
                this.drawNPC(ctx, npc, camera, game);
            }
        }

        // Draw interaction zones
        if (this.currentMap.interactionZones) {
            for (let zone of this.currentMap.interactionZones) {
                this.drawInteractionZone(ctx, zone, camera, game);
            }
        }

        // Draw exit zone
        if (this.currentMap.exitZone) {
            this.drawExitZone(ctx, this.currentMap.exitZone, camera, game);
        }

        // Draw hidden mist overlay
        if (this.hiddenMistAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.hiddenMistAlpha;
            ctx.fillStyle = '#CCCCCC';
            ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
            ctx.restore();
        }
    },

    // Draw decoration
    drawDecoration(ctx, deco, camera) {
        if (deco.type === 'building' || deco.type === 'bridge' || deco.type === 'water' || deco.type === 'pillar') {
            const screen = Utils.worldToScreen(deco.x, deco.y, camera);
            Utils.drawRect(ctx, screen.x, screen.y, deco.width, deco.height, deco.color, true);

            if (deco.type === 'building') {
                // Draw roof
                ctx.save();
                ctx.fillStyle = '#8B0000';
                ctx.beginPath();
                ctx.moveTo(screen.x - 10, screen.y);
                ctx.lineTo(screen.x + deco.width / 2, screen.y - 40);
                ctx.lineTo(screen.x + deco.width + 10, screen.y);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        } else if (deco.type === 'tree') {
            const screen = Utils.worldToScreen(deco.x, deco.y, camera);
            // Trunk
            Utils.drawRect(ctx, screen.x - 5, screen.y, 10, 30, '#8B4513', true);
            // Leaves
            Utils.drawCircle(ctx, screen.x, screen.y - 10, deco.radius, deco.color, true);
        }
    },

    // Draw NPC
    drawNPC(ctx, npc, camera, game) {
        const screen = Utils.worldToScreen(npc.x, npc.y, camera);

        ctx.save();

        // Draw NPC circle
        Utils.drawCircle(ctx, screen.x, screen.y, npc.radius, npc.color, true);

        // Draw icon based on type
        let icon = 'N';
        if (npc.type === 'shop') icon = '🏪';
        if (npc.type === 'missions') icon = '📋';

        Utils.drawText(ctx, icon, screen.x, screen.y - 10, {
            align: 'center',
            font: '24px Arial'
        });

        // Draw name
        Utils.drawText(ctx, npc.name, screen.x, screen.y - npc.radius - 15, {
            align: 'center',
            font: 'bold 12px Arial',
            color: '#FFD700',
            shadow: true
        });

        // Draw interact indicator if in range
        if (this.activeInteractNPC === npc) {
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            Utils.drawCircle(ctx, screen.x, screen.y, npc.radius + 10, '#FFD700', false);
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    },

    // Draw interaction zone
    drawInteractionZone(ctx, zone, camera, game) {
        if (!game.player) return;

        // Get scale factors
        const scaleX = this.currentMap.scaleX || 1;
        const scaleY = this.currentMap.scaleY || 1;

        // Scale zone coordinates to match viewport
        const scaledZoneX = zone.x * scaleX;
        const scaledZoneY = zone.y * scaleY;
        const scaledZoneWidth = zone.width * scaleX;
        const scaledZoneHeight = zone.height * scaleY;
        const scaledRange = zone.interactRange * Math.min(scaleX, scaleY);

        const screen = Utils.worldToScreen(scaledZoneX, scaledZoneY, camera);

        // Check if player is near
        const playerInZone =
            game.player.x >= scaledZoneX - scaledRange &&
            game.player.x <= scaledZoneX + scaledZoneWidth + scaledRange &&
            game.player.y >= scaledZoneY - scaledRange &&
            game.player.y <= scaledZoneY + scaledZoneHeight + scaledRange;

        if (playerInZone) {
            // Draw highlight box
            ctx.save();
            const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
            ctx.globalAlpha = pulse * 0.5;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.strokeRect(screen.x, screen.y, scaledZoneWidth, scaledZoneHeight);
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }
    },

    // Draw exit zone
    drawExitZone(ctx, exitZone, camera, game) {
        const screen = Utils.worldToScreen(exitZone.x, exitZone.y, camera);

        // Only show if player is near and can exit
        if (!game.player) return;

        const dist = Utils.distance(game.player.x, game.player.y, exitZone.x, exitZone.y);
        if (dist > exitZone.radius * 2) return;

        const canExit = this.currentMap.type === 'hub' ||
                       !game.enemies ||
                       game.enemies.filter(e => !e.isDead).length === 0;

        ctx.save();

        const pulse = Math.sin(Date.now() / 300) * 0.2 + 0.8;
        ctx.globalAlpha = pulse * 0.5;

        // Draw exit circle
        Utils.drawCircle(ctx, screen.x, screen.y, exitZone.radius, canExit ? '#00FF00' : '#666666', true);

        ctx.globalAlpha = 1.0;

        // Draw arrow
        if (canExit) {
            Utils.drawText(ctx, '←', screen.x, screen.y - 15, {
                align: 'center',
                font: 'bold 32px Arial',
                color: '#FFFFFF',
                shadow: true
            });
        }

        ctx.restore();
    },

    // Activate hidden mist (for Zabuza phase 2)
    activateHiddenMist() {
        this.hiddenMist = true;
    },

    deactivateHiddenMist() {
        this.hiddenMist = false;
    }
};
