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
            // Pixel-based collision: walkable color is automatically detected at spawn
            // Spawn in center of walkable path (in screen coordinates)
            playerSpawn: { x: 875, y: 320, useScreenCoords: true },
            npcs: [
                {
                    id: 'weapon_shop',
                    name: 'Weapon Shop',
                    type: 'shop',
                    x: 800,
                    y: 300,
                    radius: 20,
                    color: '#8B4513',
                    interactRange: 60,
                    shopInventory: [
                        'basic_kunai', 'enhanced_kunai', 'legendary_kunai',
                        'basic_vest', 'enhanced_vest', 'sage_cloak',
                        'basic_scroll', 'enhanced_scroll', 'nine_tails_charm'
                    ]
                }
            ],
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

    // Collision detection via pixel colors
    collisionCanvas: null,
    collisionCtx: null,
    collisionImageData: null,
    collisionReady: false,

    // Walkable color definition (light green/yellow path color)
    // This is the color from the walkable paths in the map
    walkableColor: { r: 210, g: 230, b: 190 },
    colorTolerance: 60, // Allow +/- 60 in each RGB channel (generous for GIF compression)

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
                // Initialize collision detection from image pixels
                this.initializeCollisionMap(img, map, game);
            };
            this.loadedImages[map.backgroundImage] = img;
        } else if (map.backgroundImage && this.loadedImages[map.backgroundImage]) {
            // Image already loaded, initialize collision map
            const img = this.loadedImages[map.backgroundImage];
            if (img.complete) {
                this.initializeCollisionMap(img, map, game);
            }
        }

        // Spawn player
        if (game.player) {
            let spawnX, spawnY;

            // Check if spawn uses screen coordinates (for fullscreen hub maps)
            if (map.playerSpawn.useScreenCoords) {
                // Use spawn coordinates directly (already in screen space)
                spawnX = map.playerSpawn.x;
                spawnY = map.playerSpawn.y;
            } else {
                // Scale from map coordinates to screen coordinates
                const scaleX = this.currentMap.scaleX || 1;
                const scaleY = this.currentMap.scaleY || 1;
                spawnX = map.playerSpawn.x * scaleX;
                spawnY = map.playerSpawn.y * scaleY;
            }

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

    // Initialize collision map from background image pixels
    initializeCollisionMap(img, map, game) {
        if (!game || !game.canvas) return;

        console.log('🎨 Initializing pixel-based collision detection...');

        // Create off-screen canvas for collision detection
        if (!this.collisionCanvas) {
            this.collisionCanvas = document.createElement('canvas');
            this.collisionCtx = this.collisionCanvas.getContext('2d', { willReadFrequently: true });
        }

        // For fullscreen maps, use the scaled canvas dimensions
        if (map.type === 'hub' && map.imageCrop) {
            const crop = map.imageCrop;
            this.collisionCanvas.width = game.canvas.width;
            this.collisionCanvas.height = game.canvas.height;

            // Draw the cropped image scaled to full screen
            this.collisionCtx.drawImage(
                img,
                crop.x, crop.y, crop.width, crop.height,
                0, 0, game.canvas.width, game.canvas.height
            );

            console.log(`📏 Collision map: ${game.canvas.width}x${game.canvas.height} (scaled from ${crop.width}x${crop.height})`);
        } else {
            // For non-hub maps, use original dimensions
            this.collisionCanvas.width = img.width;
            this.collisionCanvas.height = img.height;
            this.collisionCtx.drawImage(img, 0, 0);
        }

        // Get image data for pixel sampling
        this.collisionImageData = this.collisionCtx.getImageData(
            0, 0,
            this.collisionCanvas.width,
            this.collisionCanvas.height
        );

        // Sample color at spawn point to set as walkable color
        if (map.playerSpawn) {
            const spawnX = map.playerSpawn.useScreenCoords ? map.playerSpawn.x : map.playerSpawn.x;
            const spawnY = map.playerSpawn.useScreenCoords ? map.playerSpawn.y : map.playerSpawn.y;
            const color = this.getPixelColor(spawnX, spawnY);

            if (color) {
                this.walkableColor = { r: color.r, g: color.g, b: color.b };
                console.log(`🎨 Detected walkable color at spawn (${spawnX}, ${spawnY}): RGB(${color.r}, ${color.g}, ${color.b})`);
            } else {
                console.error(`❌ Could not sample color at spawn position (${spawnX}, ${spawnY})`);
            }
        }

        // Mark collision as ready
        this.collisionReady = true;

        // Recheck player position now that collision is ready
        if (game && game.player) {
            const isPlayerWalkable = this.isWalkable(game.player.x, game.player.y);
            console.log(`🚶 Player at (${Math.floor(game.player.x)}, ${Math.floor(game.player.y)}): ${isPlayerWalkable ? '✓ Walkable' : '✗ Blocked'}`);

            if (!isPlayerWalkable) {
                console.log('🔄 Player in non-walkable area, searching for valid position...');
                const walkablePos = this.findNearestWalkablePosition(game.player.x, game.player.y);
                game.player.x = walkablePos.x;
                game.player.y = walkablePos.y;
                game.player.targetX = game.player.x;
                game.player.targetY = game.player.y;
                console.log(`📍 Relocated player to (${Math.floor(walkablePos.x)}, ${Math.floor(walkablePos.y)})`);
            }
        }

        console.log('✅ Collision detection ready');
    },

    // Get pixel color at specific coordinates
    getPixelColor(x, y) {
        if (!this.collisionImageData) return null;

        // Ensure coordinates are within bounds
        x = Math.floor(x);
        y = Math.floor(y);

        if (x < 0 || x >= this.collisionCanvas.width || y < 0 || y >= this.collisionCanvas.height) {
            return null;
        }

        const index = (y * this.collisionCanvas.width + x) * 4;
        const data = this.collisionImageData.data;

        return {
            r: data[index],
            g: data[index + 1],
            b: data[index + 2],
            a: data[index + 3]
        };
    },

    // Check if two colors match within tolerance
    colorsMatch(color1, color2, tolerance) {
        if (!color1 || !color2) return false;

        return Math.abs(color1.r - color2.r) <= tolerance &&
               Math.abs(color1.g - color2.g) <= tolerance &&
               Math.abs(color1.b - color2.b) <= tolerance;
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

    // Check if a position is walkable (pixel-based collision)
    isWalkable(x, y) {
        if (!this.currentMap) return true;

        // Use pixel-based collision for Konoha hub
        if (this.currentMap.id === 'konoha_hub') {
            // If collision data isn't ready yet, allow movement
            if (!this.collisionImageData || !this.collisionReady) {
                return true; // Allow movement until collision loads
            }

            const playerRadius = 25;

            // Check multiple points around player's collision circle
            // Center + 8 points around the radius
            const checkPoints = [
                { x: x, y: y }, // Center
                { x: x + playerRadius, y: y }, // Right
                { x: x - playerRadius, y: y }, // Left
                { x: x, y: y + playerRadius }, // Down
                { x: x, y: y - playerRadius }, // Up
                { x: x + playerRadius * 0.7, y: y + playerRadius * 0.7 }, // Bottom-right
                { x: x - playerRadius * 0.7, y: y + playerRadius * 0.7 }, // Bottom-left
                { x: x + playerRadius * 0.7, y: y - playerRadius * 0.7 }, // Top-right
                { x: x - playerRadius * 0.7, y: y - playerRadius * 0.7 }  // Top-left
            ];

            // All check points must be on walkable color
            for (let point of checkPoints) {
                const pixelColor = this.getPixelColor(point.x, point.y);

                if (!pixelColor) {
                    return false; // Out of bounds
                }

                if (!this.colorsMatch(pixelColor, this.walkableColor, this.colorTolerance)) {
                    return false; // Not on walkable color
                }
            }

            return true; // All points are walkable
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
