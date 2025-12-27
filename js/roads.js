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
    }

    update(dt) {
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }
    }

    isNearby(px, py, radius = 80) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const dx = px - centerX;
        const dy = py - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < radius;
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

    draw(ctx, camera) {
        const screen = Utils.worldToScreen(this.x, this.y, camera);

        // Draw trigger zone for debugging
        if (false) { // Set to true to see trigger zones
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 107, 26, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(screen.x, screen.y, this.width, this.height);
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

            // Check if player is nearby
            if (game.player && trigger.isNearby(game.player.x, game.player.y)) {
                // Auto-trigger on approach (could also require button press)
                if (!trigger.triggered || trigger.cooldown <= 0) {
                    trigger.trigger(game);
                }
            } else {
                trigger.triggered = false;
            }
        }
    }

    draw(ctx, camera) {
        // Draw intersections first
        for (const intersection of this.intersections) {
            intersection.draw(ctx, camera);
        }

        // Draw roads
        for (const road of this.roads) {
            road.draw(ctx, camera);
        }

        // Draw building triggers (for debugging)
        for (const trigger of this.buildingTriggers) {
            trigger.draw(ctx, camera);
        }
    }

    // Create a sample Konoha village road layout
    createKonohaVillageRoads() {
        this.clear();

        const roadWidth = 120;
        const centerX = 400;
        const centerY = 300;

        // Main horizontal road (west to east)
        this.addRoad(centerX - 600, centerY - roadWidth / 2, 1200, roadWidth, 'horizontal');

        // Vertical road (north to south)
        this.addRoad(centerX - roadWidth / 2, centerY - 400, roadWidth, 800, 'vertical');

        // Secondary horizontal road (upper)
        this.addRoad(centerX - 400, centerY - 250 - roadWidth / 2, 800, roadWidth, 'horizontal');

        // Secondary horizontal road (lower)
        this.addRoad(centerX - 400, centerY + 250 - roadWidth / 2, 800, roadWidth, 'horizontal');

        // Add intersections
        this.addIntersection(centerX, centerY, roadWidth);
        this.addIntersection(centerX, centerY - 250, roadWidth);
        this.addIntersection(centerX, centerY + 250, roadWidth);

        console.log('🛤️ Konoha village roads created');
    }
}

// Global instance
const Roads = new RoadSystem();
