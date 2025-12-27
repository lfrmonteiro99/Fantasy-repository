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

        // STEP 1: Define the + shaped road network
        const roadWidth = 120;
        const roadTop = centerY - roadWidth / 2;      // Y = 240
        const roadBottom = centerY + roadWidth / 2;   // Y = 360
        const roadLeft = centerX - roadWidth / 2;     // X = 340
        const roadRight = centerX + roadWidth / 2;    // X = 460

        // STEP 2: Position 4 interactive buildings - one in EACH quadrant of the + shape
        // Buildings positioned so their entrance zones are ON the roads

        // NORTHEAST QUADRANT - Mission Log (shop_large)
        // On EAST side of vertical road, entrance faces WEST (left)
        const missionLogW = 559 * 0.9;  // 503px
        const missionLogH = 137 * 0.9;  // 123px
        const missionLogEntranceW = missionLogW * 0.3; // 151px
        const missionLogX = roadRight; // Start at road edge
        const missionLogY = centerY - 200;
        this.addObject('shop_large', missionLogX, missionLogY, 0.9, 'midground');

        // NORTHWEST QUADRANT - Shop (house_medium)
        // On WEST side of vertical road, entrance faces EAST (right)
        const shopW = 213;
        const shopH = 137;
        const shopEntranceW = shopW * 0.3; // 64px
        const shopX = roadLeft - shopW; // End at road edge
        const shopY = centerY - 200;
        this.addObject('house_medium', shopX, shopY, 1, 'midground');

        // SOUTHEAST QUADRANT - Inn (house_medium)
        // On SOUTH side of horizontal road, entrance faces NORTH (top)
        const innW = 213 * 0.9;  // 192px
        const innH = 137 * 0.9;  // 123px
        const innEntranceH = innH * 0.3; // 37px
        const innX = centerX + 150;
        const innY = roadBottom; // Start at road edge
        this.addObject('house_medium', innX, innY, 0.9, 'midground');

        // SOUTHWEST QUADRANT - Training (house_small_1)
        // On NORTH side of horizontal road, entrance faces SOUTH (bottom)
        const trainingW = 315;  // house_small_1
        const trainingH = 137;
        const trainingEntranceH = trainingH * 0.3; // 41px
        const trainingX = centerX - 350;
        const trainingY = roadTop - trainingH; // End at road edge
        this.addObject('house_small_1', trainingX, trainingY, 1, 'midground');

        // Decorative buildings in far corners
        this.addObject('house_small_2', centerX - 600, centerY - 400, 0.8, 'background');
        this.addObject('bg_building_large', centerX + 400, centerY + 200, 0.6, 'background');

        // Props along roads
        this.addObject('sign_post', roadRight - 30, centerY - 100, 1, 'foreground');
        this.addObject('wooden_box_1', roadLeft + 10, centerY + 50, 1, 'foreground');
        this.addObject('barrel_1', centerX - 80, roadTop + 10, 1, 'foreground');
        this.addObject('barrel_2', centerX + 80, roadBottom - 40, 1, 'foreground');
        this.addObject('bench', roadRight + 30, centerY + 100, 1, 'foreground');
        this.addObject('stone_pillar', centerX, centerY, 1, 'foreground');

        // Add building triggers matching exact sprite positions
        if (typeof Roads !== 'undefined') {
            // NORTHEAST - Mission Log, entrance faces WEST (left)
            Roads.addBuildingTrigger(
                missionLogX,
                missionLogY,
                missionLogW,
                missionLogH,
                'mission_log',
                { entranceSide: 'left' }
            );

            // NORTHWEST - Shop, entrance faces EAST (right)
            Roads.addBuildingTrigger(
                shopX,
                shopY,
                shopW,
                shopH,
                'shop',
                { entranceSide: 'right' }
            );

            // SOUTHEAST - Inn, entrance faces NORTH (top)
            Roads.addBuildingTrigger(
                innX,
                innY,
                innW,
                innH,
                'inn',
                { entranceSide: 'top' }
            );

            // SOUTHWEST - Training, entrance faces SOUTH (bottom)
            Roads.addBuildingTrigger(
                trainingX,
                trainingY,
                trainingW,
                trainingH,
                'training',
                { entranceSide: 'bottom' }
            );

            console.log('🏘️ Konoha village created with accessible interactive buildings');
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
