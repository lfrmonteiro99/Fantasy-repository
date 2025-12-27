// Road System for Konoha Village
// Handles brick/cobblestone roads, pathfinding, and collision

class Road {
    constructor(x, y, width, height, type = 'horizontal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'horizontal', 'vertical', 'square'

        // Road boundaries for collision
        this.bounds = {
            left: x,
            right: x + width,
            top: y,
            bottom: y + height
        };
    }

    containsPoint(x, y) {
        return x >= this.bounds.left &&
               x <= this.bounds.right &&
               y >= this.bounds.top &&
               y <= this.bounds.bottom;
    }

    draw(ctx, camera) {
        const screen = Utils.worldToScreen(this.x, this.y, camera);

        // Draw brick road pattern
        ctx.save();

        // Base road color (brown/tan)
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(screen.x, screen.y, this.width, this.height);

        // Draw brick pattern
        const brickWidth = 32;
        const brickHeight = 16;
        const mortarWidth = 2;

        ctx.strokeStyle = '#6B5845';
        ctx.lineWidth = mortarWidth;

        // Horizontal mortar lines
        for (let y = 0; y < this.height; y += brickHeight) {
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y + y);
            ctx.lineTo(screen.x + this.width, screen.y + y);
            ctx.stroke();
        }

        // Vertical mortar lines (offset every other row)
        for (let y = 0; y < this.height; y += brickHeight) {
            const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
            for (let x = -brickWidth; x < this.width + brickWidth; x += brickWidth) {
                ctx.beginPath();
                ctx.moveTo(screen.x + x + offset, screen.y + y);
                ctx.lineTo(screen.x + x + offset, screen.y + y + brickHeight);
                ctx.stroke();
            }
        }

        // Add some texture variation
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        for (let i = 0; i < this.width * this.height / 500; i++) {
            const rx = screen.x + Math.random() * this.width;
            const ry = screen.y + Math.random() * this.height;
            ctx.fillRect(rx, ry, 4, 4);
        }

        ctx.restore();
    }
}

class RoadIntersection {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;

        this.bounds = {
            left: x - size / 2,
            right: x + size / 2,
            top: y - size / 2,
            bottom: y + size / 2
        };
    }

    containsPoint(x, y) {
        return x >= this.bounds.left &&
               x <= this.bounds.right &&
               y >= this.bounds.top &&
               y <= this.bounds.bottom;
    }

    draw(ctx, camera) {
        const screen = Utils.worldToScreen(this.x - this.size / 2, this.y - this.size / 2, camera);

        ctx.save();

        // Draw square intersection
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(screen.x, screen.y, this.size, this.size);

        // Brick pattern (same as roads)
        const brickSize = 16;
        ctx.strokeStyle = '#6B5845';
        ctx.lineWidth = 2;

        for (let y = 0; y < this.size; y += brickSize) {
            for (let x = 0; x < this.size; x += brickSize) {
                ctx.strokeRect(screen.x + x, screen.y + y, brickSize, brickSize);
            }
        }

        ctx.restore();
    }
}

class BuildingTrigger {
    constructor(x, y, width, height, buildingType, data = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.buildingType = buildingType; // 'mission_log', 'shop', 'inn', 'training'
        this.data = data;
        this.triggered = false;
        this.cooldown = 0;
        this.showPrompt = false;
        this.entranceSide = data.entranceSide || 'bottom'; // 'top', 'bottom', 'left', 'right'

        // Define entrance zone based on which side faces the road
        this.entranceZone = this.calculateEntranceZone();
    }

    calculateEntranceZone() {
        const zoneSize = 0.3; // 30% of building dimension

        switch (this.entranceSide) {
            case 'top':
                return {
                    x: this.x + this.width * 0.3,
                    y: this.y,
                    width: this.width * 0.4,
                    height: this.height * zoneSize
                };
            case 'bottom':
                return {
                    x: this.x + this.width * 0.3,
                    y: this.y + this.height * (1 - zoneSize),
                    width: this.width * 0.4,
                    height: this.height * zoneSize
                };
            case 'left':
                return {
                    x: this.x,
                    y: this.y + this.height * 0.3,
                    width: this.width * zoneSize,
                    height: this.height * 0.4
                };
            case 'right':
                return {
                    x: this.x + this.width * (1 - zoneSize),
                    y: this.y + this.height * 0.3,
                    width: this.width * zoneSize,
                    height: this.height * 0.4
                };
            default:
                // Default to bottom
                return {
                    x: this.x + this.width * 0.3,
                    y: this.y + this.height * 0.7,
                    width: this.width * 0.4,
                    height: this.height * 0.3
                };
        }
    }

    update(dt) {
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }
    }

    // Check if player is inside the building sprite bounds
    isInsideBuilding(px, py) {
        return px >= this.x &&
               px <= this.x + this.width &&
               py >= this.y &&
               py <= this.y + this.height;
    }

    // Check if player is in the entrance zone (bottom part of building)
    isInEntranceZone(px, py) {
        return px >= this.entranceZone.x &&
               px <= this.entranceZone.x + this.entranceZone.width &&
               py >= this.entranceZone.y &&
               py <= this.entranceZone.y + this.entranceZone.height;
    }

    // Check if player is near enough to see the prompt
    isNearby(px, py) {
        const buffer = 50;
        return px >= this.x - buffer &&
               px <= this.x + this.width + buffer &&
               py >= this.y - buffer &&
               py <= this.y + this.height + buffer;
    }

    trigger(game) {
        if (this.cooldown > 0) return false;

        this.cooldown = 2.0; // 2 second cooldown
        this.triggered = true;

        switch (this.buildingType) {
            case 'mission_log':
                this.showMissionLog(game);
                break;
            case 'shop':
                this.showShop(game);
                break;
            case 'inn':
                this.showInn(game);
                break;
            case 'training':
                this.showTraining(game);
                break;
        }

        return true;
    }

    showMissionLog(game) {
        console.log('📜 Mission Log accessed');
        // Show notification
        if (game.notifications) {
            game.notifications.push({
                message: '📜 Mission Log',
                duration: 2.0,
                color: '#FFD700'
            });
        }
        // TODO: Open mission log UI
    }

    showShop(game) {
        console.log('🏪 Shop accessed');
        if (game.notifications) {
            game.notifications.push({
                message: '🏪 Welcome to the shop!',
                duration: 2.0,
                color: '#4CAF50'
            });
        }
        // TODO: Open shop UI
    }

    showInn(game) {
        console.log('🏨 Inn accessed');
        if (game.notifications) {
            game.notifications.push({
                message: '🏨 Rest and recover at the inn',
                duration: 2.0,
                color: '#2196F3'
            });
        }
        // Heal player
        if (game.player) {
            game.player.health = game.player.maxHealth;
            game.player.chakra = game.player.maxChakra;
        }
    }

    showTraining(game) {
        console.log('⚔️ Training Grounds accessed');
        if (game.notifications) {
            game.notifications.push({
                message: '⚔️ Training Grounds - Ready to train?',
                duration: 2.0,
                color: '#FF6B1A'
            });
        }
        // TODO: Open training UI
    }

    draw(ctx, camera, game) {
        const screen = Utils.worldToScreen(this.x, this.y, camera);

        // Draw entrance indicator when player is nearby
        if (this.showPrompt && game && game.player) {
            ctx.save();

            // Draw entrance zone highlight
            const entranceScreen = Utils.worldToScreen(
                this.entranceZone.x,
                this.entranceZone.y,
                camera
            );

            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(
                entranceScreen.x,
                entranceScreen.y,
                this.entranceZone.width,
                this.entranceZone.height
            );

            // Draw "Enter" prompt above building
            const centerScreen = Utils.worldToScreen(
                this.x + this.width / 2,
                this.y - 10,
                camera
            );

            // Prompt background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(centerScreen.x - 35, centerScreen.y - 15, 70, 25);

            // Prompt text
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('↓ ENTER', centerScreen.x, centerScreen.y - 3);

            ctx.restore();
        }
    }
}

class RoadSystem {
    constructor() {
        this.roads = [];
        this.intersections = [];
        this.buildingTriggers = [];
        this.allowOffRoad = false; // Set to false to enforce road-only movement
    }

    clear() {
        this.roads = [];
        this.intersections = [];
        this.buildingTriggers = [];
    }

    addRoad(x, y, width, height, type = 'horizontal') {
        const road = new Road(x, y, width, height, type);
        this.roads.push(road);
        return road;
    }

    addIntersection(x, y, size) {
        const intersection = new RoadIntersection(x, y, size);
        this.intersections.push(intersection);
        return intersection;
    }

    addBuildingTrigger(x, y, width, height, buildingType, data = {}) {
        const trigger = new BuildingTrigger(x, y, width, height, buildingType, data);
        this.buildingTriggers.push(trigger);
        return trigger;
    }

    // Check if a point is on a road
    isOnRoad(x, y) {
        if (this.allowOffRoad) return true;

        // Check all roads
        for (const road of this.roads) {
            if (road.containsPoint(x, y)) {
                return true;
            }
        }

        // Check all intersections
        for (const intersection of this.intersections) {
            if (intersection.containsPoint(x, y)) {
                return true;
            }
        }

        return false;
    }

    // Constrain player position to roads
    constrainToRoad(x, y, previousX, previousY) {
        if (this.allowOffRoad || this.isOnRoad(x, y)) {
            return { x, y };
        }

        // Try to keep one axis of movement
        if (this.isOnRoad(x, previousY)) {
            return { x, y: previousY };
        }
        if (this.isOnRoad(previousX, y)) {
            return { x: previousX, y };
        }

        // Can't move, stay at previous position
        return { x: previousX, y: previousY };
    }

    update(game, dt) {
        // Update building triggers
        for (const trigger of this.buildingTriggers) {
            trigger.update(dt);

            if (!game.player) continue;

            const playerX = game.player.x;
            const playerY = game.player.y;

            // Show prompt when player is nearby
            trigger.showPrompt = trigger.isNearby(playerX, playerY);

            // Only trigger when player enters the entrance zone
            if (trigger.isInEntranceZone(playerX, playerY)) {
                if (!trigger.triggered || trigger.cooldown <= 0) {
                    trigger.trigger(game);
                }
            } else {
                trigger.triggered = false;
            }
        }
    }

    draw(ctx, camera, game) {
        // Draw intersections first
        for (const intersection of this.intersections) {
            intersection.draw(ctx, camera);
        }

        // Draw roads
        for (const road of this.roads) {
            road.draw(ctx, camera);
        }

        // Draw building triggers (entrance prompts)
        for (const trigger of this.buildingTriggers) {
            trigger.draw(ctx, camera, game);
        }
    }

    // Create a sample Konoha village road layout
    createKonohaVillageRoads() {
        this.clear();

        const roadWidth = 120;
        const centerX = 400;
        const centerY = 300;

        // Main cross-shaped road network
        // Horizontal road (west to east) - extended for full coverage
        this.addRoad(centerX - 800, centerY - roadWidth / 2, 1600, roadWidth, 'horizontal');

        // Vertical road (north to south) - extended for full coverage
        this.addRoad(centerX - roadWidth / 2, centerY - 500, roadWidth, 1000, 'vertical');

        // Center intersection
        this.addIntersection(centerX, centerY, roadWidth);

        console.log('🛤️ Konoha village roads created');
        console.log(`   Main horizontal: Y=${centerY - roadWidth/2} to ${centerY + roadWidth/2}`);
        console.log(`   Main vertical: X=${centerX - roadWidth/2} to ${centerX + roadWidth/2}`);
    }
}

// Global instance
const Roads = new RoadSystem();
