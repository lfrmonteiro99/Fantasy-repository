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
            // Walkable path color (beige/tan streets)
            walkableColor: { r: 200, g: 200, b: 170 }, // Approximate beige color
            walkableColorTolerance: 50, // Color matching tolerance
            playerSpawn: { x: 260, y: 260 }, // Center of map, will adjust to walkable area
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
    collisionMaps: {}, // Pixel data for walkability checks
    collisionCanvases: {}, // Hidden canvases for pixel reading

    // Load map
    loadMap(mapId, game) {
        const map = this.maps[mapId];
        if (!map) {
            console.error(`Map ${mapId} not found`);
            return false;
        }

        this.currentMap = { ...map };
        game.currentMap = this.currentMap;

        // Load background image if specified
        if (map.backgroundImage && !this.loadedImages[map.backgroundImage]) {
            const img = new Image();
            img.src = map.backgroundImage;
            img.onload = () => {
                console.log('🗺️ Map background loaded:', map.backgroundImage);
                // Create collision map from image pixels
                if (map.walkableColor) {
                    this.createCollisionMap(mapId, img, map);
                }
            };
            this.loadedImages[map.backgroundImage] = img;
        } else if (map.backgroundImage && map.walkableColor && !this.collisionMaps?.[mapId]) {
            // Image already loaded, create collision map
            const img = this.loadedImages[map.backgroundImage];
            if (img.complete) {
                this.createCollisionMap(mapId, img, map);
            }
        }

        // Reset map state
        this.missionCompleted = false;
        this.hiddenMist = false;
        this.hiddenMistAlpha = 0;

        // Spawn player
        if (game.player) {
            game.player.x = map.playerSpawn.x;
            game.player.y = map.playerSpawn.y;
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

        // Center camera on player
        if (game.camera && game.player) {
            game.camera.x = game.player.x - game.canvas.width / 2;
            game.camera.y = game.player.y - game.canvas.height / 2;
        }

        return true;
    },

    // Create collision map from image pixel data
    createCollisionMap(mapId, img, map) {
        // Create hidden canvas to read pixel data
        const canvas = document.createElement('canvas');
        const crop = map.imageCrop || { x: 0, y: 0, width: img.width, height: img.height };
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        // Draw cropped portion of image
        ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, crop.width, crop.height);

        this.collisionCanvases[mapId] = canvas;
        this.collisionMaps[mapId] = imageData;

        console.log(`🗺️ Collision map created for ${mapId}: ${crop.width}x${crop.height}`);
    },

    // Check if a position is walkable
    isWalkable(x, y) {
        if (!this.currentMap) return true;

        const mapId = this.currentMap.id;
        const imageData = this.collisionMaps[mapId];

        if (!imageData) return true; // No collision data, allow movement

        // Convert world coordinates to map image coordinates
        const mapX = Math.floor(x);
        const mapY = Math.floor(y);

        // Check bounds
        if (mapX < 0 || mapY < 0 || mapX >= imageData.width || mapY >= imageData.height) {
            return false; // Out of bounds
        }

        // Get pixel color at position
        const index = (mapY * imageData.width + mapX) * 4;
        const r = imageData.data[index];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];
        const a = imageData.data[index + 3];

        // Check if pixel is walkable (beige/tan color)
        const walkable = this.currentMap.walkableColor;
        const tolerance = this.currentMap.walkableColorTolerance || 30;

        if (!walkable) return true; // No walkable color defined

        // Color matching with tolerance
        const matches =
            Math.abs(r - walkable.r) <= tolerance &&
            Math.abs(g - walkable.g) <= tolerance &&
            Math.abs(b - walkable.b) <= tolerance &&
            a > 128; // Not transparent

        return matches;
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

        for (let zone of this.currentMap.interactionZones) {
            // Check if player is inside or near the zone
            const playerInZone =
                game.player.x >= zone.x - zone.interactRange &&
                game.player.x <= zone.x + zone.width + zone.interactRange &&
                game.player.y >= zone.y - zone.interactRange &&
                game.player.y <= zone.y + zone.height + zone.interactRange;

            if (playerInZone) {
                // Show interact prompt
                const isMobile = window.isMobileDevice || false;
                const message = isMobile
                    ? `TAP to access ${zone.name}`
                    : `Press SPACE to access ${zone.name}`;
                game.showInteractPrompt(message);

                // Handle interaction
                const shouldInteract = (game.input && game.input.space) ||
                                      (game.lastTapInZone === zone);

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
            // Open mission select
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

                // Calculate camera offset
                const offsetX = -camera.x + game.canvas.width / 2;
                const offsetY = -camera.y + game.canvas.height / 2;

                // Draw cropped portion of background image
                ctx.drawImage(
                    img,
                    crop.x, crop.y, crop.width, crop.height,  // Source crop
                    offsetX, offsetY, crop.width, crop.height  // Destination
                );
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

        const screen = Utils.worldToScreen(zone.x, zone.y, camera);

        // Check if player is near
        const playerInZone =
            game.player.x >= zone.x - zone.interactRange &&
            game.player.x <= zone.x + zone.width + zone.interactRange &&
            game.player.y >= zone.y - zone.interactRange &&
            game.player.y <= zone.y + zone.height + zone.interactRange;

        if (playerInZone) {
            // Draw highlight box
            ctx.save();
            const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
            ctx.globalAlpha = pulse * 0.5;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.strokeRect(screen.x, screen.y, zone.width, zone.height);
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
