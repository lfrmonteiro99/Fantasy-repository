// Environment Objects System for Konoha Village
// Handles loading and rendering decorative objects and buildings

class EnvironmentObject {
    constructor(x, y, spriteRegion, scale = 1, layer = 'foreground') {
        this.x = x;
        this.y = y;
        this.spriteRegion = spriteRegion; // {sx, sy, sWidth, sHeight}
        this.scale = scale;
        this.layer = layer; // 'background', 'midground', 'foreground'
        this.width = spriteRegion.sWidth * scale;
        this.height = spriteRegion.sHeight * scale;
    }

    draw(ctx, camera, spriteSheet) {
        const screen = Utils.worldToScreen(this.x, this.y, camera);

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(
            spriteSheet,
            this.spriteRegion.sx,
            this.spriteRegion.sy,
            this.spriteRegion.sWidth,
            this.spriteRegion.sHeight,
            screen.x,
            screen.y,
            this.width,
            this.height
        );

        ctx.restore();
    }

    // Check if point is inside object bounds (for collision)
    containsPoint(x, y) {
        return x >= this.x &&
               x <= this.x + this.width &&
               y >= this.y &&
               y <= this.y + this.height;
    }
}

class EnvironmentManager {
    constructor() {
        this.spriteSheet = null;
        this.objects = {
            background: [],
            midground: [],
            foreground: []
        };

        // Define sprite regions for Konoha objects
        // Coordinates measured from the sprite sheet
        this.objectTemplates = {
            // Buildings
            'house_small_1': { sx: 14, sy: 420, sWidth: 315, sHeight: 137 },
            'house_small_2': { sx: 367, sy: 420, sWidth: 375, sHeight: 137 },
            'shop_large': { sx: 14, sy: 574, sWidth: 559, sHeight: 137 },
            'house_medium': { sx: 625, sy: 574, sWidth: 213, sHeight: 137 },
            'bg_building_large': { sx: 34, sy: 808, sWidth: 421, sHeight: 82 },
            'bg_building_small': { sx: 467, sy: 808, sWidth: 109, sHeight: 82 },

            // Extras/Props
            'sign_post': { sx: 405, sy: 88, sWidth: 57, sHeight: 74 },
            'wooden_box_1': { sx: 564, sy: 88, sWidth: 75, sHeight: 43 },
            'wooden_box_2': { sx: 564, sy: 133, sWidth: 75, sHeight: 43 },
            'fence_section': { sx: 637, sy: 88, sWidth: 75, sHeight: 43 },
            'barrel_1': { sx: 638, sy: 169, sWidth: 32, sHeight: 32 },
            'barrel_2': { sx: 682, sy: 169, sWidth: 32, sHeight: 32 },
            'market_stall': { sx: 410, sy: 191, sWidth: 105, sHeight: 75 },
            'wooden_fence': { sx: 574, sy: 202, sWidth: 135, sHeight: 45 },
            'stone_platform_1': { sx: 407, sy: 267, sWidth: 69, sHeight: 24 },
            'stone_platform_2': { sx: 707, sy: 267, sWidth: 69, sHeight: 24 },
            'wooden_platform': { sx: 477, sy: 267, sWidth: 137, sHeight: 32 },
            'wall_section': { sx: 478, sy: 133, sWidth: 72, sHeight: 43 },
            'building_sign_1': { sx: 792, sy: 93, sWidth: 59, sHeight: 43 },
            'building_sign_2': { sx: 848, sy: 93, sWidth: 59, sHeight: 43 },
            'stone_pillar': { sx: 792, sy: 148, sWidth: 32, sHeight: 75 },
            'bench': { sx: 792, sy: 225, sWidth: 91, sHeight: 32 },
            'gate_top': { sx: 792, sy: 265, sWidth: 91, sHeight: 43 },

            // Sky/Background tiles
            'sky': { sx: 8, sy: 56, sWidth: 351, sHeight: 274 }
        };
    }

    async loadSprites() {
        try {
            this.spriteSheet = await SpriteManager.loadSprite(
                'konoha_objects',
                'assets/sprites/environment/konoha_objects.png'
            );
            console.log('✅ Konoha environment objects loaded');
            return true;
        } catch (err) {
            console.warn('⚠️ Could not load environment objects:', err);
            return false;
        }
    }

    // Add an object to the world
    addObject(templateName, x, y, scale = 1, layer = 'foreground') {
        const template = this.objectTemplates[templateName];
        if (!template) {
            console.warn(`Environment object template '${templateName}' not found`);
            return null;
        }

        const obj = new EnvironmentObject(x, y, template, scale, layer);
        this.objects[layer].push(obj);
        return obj;
    }

    // Clear all objects
    clear() {
        this.objects.background = [];
        this.objects.midground = [];
        this.objects.foreground = [];
    }

    // Draw objects on a specific layer
    drawLayer(ctx, camera, layer) {
        if (!this.spriteSheet) return;

        const layerObjects = this.objects[layer] || [];
        for (const obj of layerObjects) {
            obj.draw(ctx, camera, this.spriteSheet);
        }
    }

    // Create a sample Konoha village scene alongside roads
    createSampleVillage(centerX = 400, centerY = 300) {
        this.clear();

        // STEP 1: Roads are already built (+ shaped)
        const roadWidth = 120;
        const roadTop = centerY - roadWidth / 2;      // Y = 240
        const roadBottom = centerY + roadWidth / 2;   // Y = 360
        const roadLeft = centerX - roadWidth / 2;     // X = 340
        const roadRight = centerX + roadWidth / 2;    // X = 460

        // STEP 2: Build NEW buildings alongside the roads
        // Forget all previous positions - create natural village layout

        // === HORIZONTAL ROAD - NORTH SIDE ===
        // Buildings positioned ABOVE the road (Y ends at roadTop)

        // Shop - left side of horizontal road, north
        const shop1 = this.addObject('house_medium', 80, roadTop - 137, 1, 'midground');

        // Mission Log - center-right of horizontal road, north
        const missionLog = this.addObject('shop_large', 600, roadTop - 137, 1, 'midground');

        // Small house - far right of horizontal road, north
        const house1 = this.addObject('house_small_1', 950, roadTop - 137, 0.8, 'midground');

        // === HORIZONTAL ROAD - SOUTH SIDE ===
        // Buildings positioned BELOW the road (Y starts at roadBottom)

        // Inn - left side of horizontal road, south
        const inn = this.addObject('house_medium', 120, roadBottom, 1, 'midground');

        // Large house - center of horizontal road, south
        const house2 = this.addObject('house_small_2', 550, roadBottom, 0.9, 'midground');

        // === VERTICAL ROAD - WEST SIDE ===
        // Buildings positioned LEFT of the road (X ends at roadLeft)

        // Training - below center on vertical road, west
        const training = this.addObject('house_small_1', roadLeft - 315, 450, 1, 'midground');

        // Small house - above center on vertical road, west
        const house3 = this.addObject('house_medium', roadLeft - 213, 50, 0.8, 'midground');

        // === VERTICAL ROAD - EAST SIDE ===
        // Buildings positioned RIGHT of the road (X starts at roadRight)

        // Medium house - below center on vertical road, east
        const house4 = this.addObject('house_medium', roadRight, 480, 0.9, 'midground');

        // Small house - above center on vertical road, east
        const house5 = this.addObject('house_small_2', roadRight, 30, 0.7, 'background');

        // === DECORATIVE PROPS ===
        this.addObject('sign_post', roadRight + 20, 200, 1, 'foreground');
        this.addObject('wooden_box_1', roadLeft - 80, 350, 1, 'foreground');
        this.addObject('barrel_1', 250, roadTop + 20, 1, 'foreground');
        this.addObject('barrel_2', 650, roadBottom - 35, 1, 'foreground');
        this.addObject('bench', roadRight + 25, 420, 1, 'foreground');
        this.addObject('market_stall', 850, roadTop + 10, 1, 'foreground');

        // === BUILDING TRIGGERS ===
        if (typeof Roads !== 'undefined') {
            // Shop - north side of horizontal road, entrance faces DOWN (bottom)
            Roads.addBuildingTrigger(
                80, roadTop - 137, 213, 137,
                'shop',
                { entranceSide: 'bottom' }
            );

            // Mission Log - north side of horizontal road, entrance faces DOWN (bottom)
            Roads.addBuildingTrigger(
                600, roadTop - 137, 559, 137,
                'mission_log',
                { entranceSide: 'bottom' }
            );

            // Inn - south side of horizontal road, entrance faces UP (top)
            Roads.addBuildingTrigger(
                120, roadBottom, 213, 137,
                'inn',
                { entranceSide: 'top' }
            );

            // Training - west side of vertical road, entrance faces RIGHT (right)
            Roads.addBuildingTrigger(
                roadLeft - 315, 450, 315, 137,
                'training',
                { entranceSide: 'right' }
            );

            console.log('🏘️ NEW Konoha village layout created alongside + shaped roads');
        } else {
            console.log('🏘️ Konoha village created alongside roads');
        }
    }

    // Get all objects at a specific world position (for collision/interaction)
    getObjectsAt(x, y) {
        const result = [];
        for (const layer in this.objects) {
            for (const obj of this.objects[layer]) {
                if (obj.containsPoint(x, y)) {
                    result.push(obj);
                }
            }
        }
        return result;
    }
}

// Global instance
const Environment = new EnvironmentManager();
