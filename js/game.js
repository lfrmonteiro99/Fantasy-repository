// Main Game Engine for Naruto Action RPG

class NarutoActionRPG {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.state = 'loading'; // loading, menu, playing, paused
        this.lastTime = 0;
        this.fpsCounter = Utils.createFPSCounter();

        // Game objects
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.itemDrops = [];

        // Camera
        this.camera = {
            x: 0,
            y: 0,
            smoothing: 0.1
        };

        // Input
        this.input = {
            mouse: { x: 0, y: 0, down: false },
            keys: {},
            touch: null,
            space: false
        };

        // Joystick (mobile)
        this.joystick = {
            active: false,
            baseX: 0,
            baseY: 0,
            stickX: 0,
            stickY: 0,
            angle: 0,
            distance: 0
        };

        // Current map
        this.currentMap = null;

        // Game progress
        this.completedMissions = [];
        this.currentMission = null;

        // Flags
        this.paused = false;
        this.showDebug = false;
    }

    async init() {
        // Setup canvas
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize UI system
        UISystem.init(this);

        // Setup input handlers
        this.setupInputHandlers();

        // Simulate loading
        for (let i = 0; i <= 100; i += 20) {
            UISystem.updateLoadingProgress(i);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Hide loading screen
        UISystem.hideLoadingScreen();

        this.state = 'menu';

        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInputHandlers() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handlePointerUp(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePointerDown(e.touches[0]);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handlePointerMove(e.touches[0]);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePointerUp(e);
        }, { passive: false });

        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.input.keys[e.key.toLowerCase()] = true;

            // Ability shortcuts
            if (this.state === 'playing' && !this.paused) {
                if (e.key === 'q' || e.key === 'Q') this.useAbility(0);
                if (e.key === 'w' || e.key === 'W') this.useAbility(1);
                if (e.key === 'e' || e.key === 'E') this.useAbility(2);
                if (e.key === 'r' || e.key === 'R') this.useAbility(3);

                if (e.key === ' ') {
                    this.input.space = true;
                }

                // Debug toggle
                if (e.key === 'F3') {
                    this.showDebug = !this.showDebug;
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.input.keys[e.key.toLowerCase()] = false;
        });

        // Ability button clicks (mobile)
        const abilityBtns = document.querySelectorAll('.ability-btn');
        abilityBtns.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.state === 'playing' && !this.paused) {
                    this.useAbility(index);
                }
            });
        });

        // Joystick setup
        this.setupJoystick();
    }

    setupJoystick() {
        const joystickArea = document.getElementById('joystick-area');
        const joystickStick = document.getElementById('joystick-stick');

        const handleJoystickStart = (e) => {
            if (this.state !== 'playing' || this.paused) return;

            const rect = joystickArea.getBoundingClientRect();
            const touch = e.touches ? e.touches[0] : e;

            this.joystick.active = true;
            this.joystick.baseX = rect.left + rect.width / 2;
            this.joystick.baseY = rect.top + rect.height / 2;

            this.updateJoystick(touch);
        };

        const handleJoystickMove = (e) => {
            if (!this.joystick.active) return;
            const touch = e.touches ? e.touches[0] : e;
            this.updateJoystick(touch);
        };

        const handleJoystickEnd = () => {
            this.joystick.active = false;
            this.joystick.distance = 0;
            joystickStick.style.transform = 'translate(-50%, -50%)';
        };

        joystickArea.addEventListener('touchstart', handleJoystickStart, { passive: false });
        joystickArea.addEventListener('touchmove', handleJoystickMove, { passive: false });
        joystickArea.addEventListener('touchend', handleJoystickEnd);
        joystickArea.addEventListener('mousedown', handleJoystickStart);
        document.addEventListener('mousemove', handleJoystickMove);
        document.addEventListener('mouseup', handleJoystickEnd);
    }

    updateJoystick(touch) {
        const dx = touch.clientX - this.joystick.baseX;
        const dy = touch.clientY - this.joystick.baseY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 50; // Max stick distance from center

        this.joystick.distance = Math.min(distance, maxDistance);
        this.joystick.angle = Math.atan2(dy, dx);

        // Update visual
        const stick = document.getElementById('joystick-stick');
        const limitedDx = Math.cos(this.joystick.angle) * this.joystick.distance;
        const limitedDy = Math.sin(this.joystick.angle) * this.joystick.distance;

        stick.style.transform = `translate(calc(-50% + ${limitedDx}px), calc(-50% + ${limitedDy}px))`;

        // Set player target based on joystick
        if (this.player && this.joystick.distance > 5) {
            const moveDistance = 100;
            this.player.targetX = this.player.x + Math.cos(this.joystick.angle) * moveDistance;
            this.player.targetY = this.player.y + Math.sin(this.joystick.angle) * moveDistance;
        }
    }

    handlePointerDown(e) {
        const pos = Utils.getInputPosition(e, this.canvas);
        this.input.mouse.down = true;

        if (this.state === 'playing' && !this.paused) {
            // Convert to world coordinates
            const worldPos = Utils.screenToWorld(pos.x, pos.y, this.camera);

            // Check if clicking on UI elements (ability buttons, etc.)
            // For now, just set move target
            if (this.player) {
                this.player.targetX = worldPos.x;
                this.player.targetY = worldPos.y;
                this.player.lastMouseX = worldPos.x;
                this.player.lastMouseY = worldPos.y;
            }
        }
    }

    handlePointerMove(e) {
        const pos = Utils.getInputPosition(e, this.canvas);
        this.input.mouse.x = pos.x;
        this.input.mouse.y = pos.y;

        if (this.state === 'playing' && !this.paused && this.player) {
            const worldPos = Utils.screenToWorld(pos.x, pos.y, this.camera);
            this.player.lastMouseX = worldPos.x;
            this.player.lastMouseY = worldPos.y;
        }
    }

    handlePointerUp(e) {
        this.input.mouse.down = false;
    }

    useAbility(slot) {
        if (!this.player) return;
        PlayerSystem.useAbility(this.player, slot, this);
    }

    startGame(characterId) {
        // Create player
        this.player = PlayerSystem.createPlayer(characterId);

        // Give starting equipment
        const startingItems = ItemSystem.createStartingInventory();
        this.player.inventory = startingItems;

        // Equip first items
        if (startingItems.length > 0) {
            ItemSystem.equipItem(this.player, startingItems.shift());
        }
        if (startingItems.length > 0) {
            ItemSystem.equipItem(this.player, startingItems.shift());
        }
        if (startingItems.length > 0) {
            ItemSystem.equipItem(this.player, startingItems.shift());
        }

        // Load starting map
        MapSystem.loadMap('konoha_hub', this);

        // Start game
        this.state = 'playing';
        UISystem.showScreen('game');
    }

    update(dt) {
        if (this.paused) return;

        // Update player
        if (this.player && !this.player.isDead) {
            PlayerSystem.update(this.player, this, dt);
        }

        // Update enemies
        if (this.enemies) {
            for (let enemy of this.enemies) {
                EnemySystem.update(enemy, this, dt);
            }

            // Remove dead enemies after delay
            this.enemies = this.enemies.filter(enemy => {
                return !enemy.isDead || enemy.deathTime < 2;
            });
        }

        // Update projectiles
        AbilitySystem.updateProjectiles(this, dt);

        // Update particles
        if (this.particles) {
            this.particles = this.particles.filter(particle => {
                return Utils.updateParticle(particle, dt);
            });
        }

        // Update item drops
        ItemSystem.updateItemDrops(this, dt);

        // Update map
        MapSystem.update(this, dt);

        // Update camera
        this.updateCamera(dt);

        // Update UI
        UISystem.updateHUD(this.player);

        // Clear space input after frame
        this.input.space = false;
    }

    updateCamera(dt) {
        if (!this.player) return;

        // Target camera position (centered on player)
        const targetX = this.player.x - this.canvas.width / 2;
        const targetY = this.player.y - this.canvas.height / 2;

        // Smooth camera movement
        this.camera.x += (targetX - this.camera.x) * this.camera.smoothing;
        this.camera.y += (targetY - this.camera.y) * this.camera.smoothing;

        // Keep camera in map bounds
        if (this.currentMap) {
            this.camera.x = Utils.clamp(this.camera.x, 0, Math.max(0, this.currentMap.width - this.canvas.width));
            this.camera.y = Utils.clamp(this.camera.y, 0, Math.max(0, this.currentMap.height - this.canvas.height));
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'playing') {
            // Draw map
            MapSystem.draw(this.ctx, this);

            // Draw item drops
            ItemSystem.drawItemDrops(this.ctx, this);

            // Draw enemies
            if (this.enemies) {
                for (let enemy of this.enemies) {
                    EnemySystem.draw(this.ctx, enemy, this.camera);
                }
            }

            // Draw player
            if (this.player) {
                PlayerSystem.draw(this.ctx, this.player, this.camera);
                PlayerSystem.drawHealthBar(this.ctx, this.player, this.camera);
            }

            // Draw projectiles
            AbilitySystem.drawProjectiles(this.ctx, this);

            // Draw particles
            if (this.particles) {
                for (let particle of this.particles) {
                    Utils.drawParticle(this.ctx, particle, this.camera);
                }
            }

            // Draw debug info
            if (this.showDebug) {
                this.drawDebugInfo();
            }
        }

        // Update FPS counter
        this.fpsCounter.update();
    }

    drawDebugInfo() {
        const debugInfo = [
            `FPS: ${this.fpsCounter.fps}`,
            `Player: (${Math.floor(this.player?.x || 0)}, ${Math.floor(this.player?.y || 0)})`,
            `Enemies: ${this.enemies?.length || 0}`,
            `Projectiles: ${this.projectiles?.length || 0}`,
            `Particles: ${this.particles?.length || 0}`,
            `Camera: (${Math.floor(this.camera.x)}, ${Math.floor(this.camera.y)})`
        ];

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, debugInfo.length * 20 + 10);

        debugInfo.forEach((line, index) => {
            Utils.drawText(this.ctx, line, 15, 15 + index * 20, {
                font: '14px monospace',
                color: '#00FF00'
            });
        });
        this.ctx.restore();
    }

    gameLoop(currentTime) {
        // Calculate delta time
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;

        // Update and render
        if (this.state === 'playing') {
            this.update(dt);
        }

        this.render();

        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
    }

    returnToMainMenu() {
        this.state = 'menu';
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.itemDrops = [];
        this.currentMap = null;

        UISystem.showScreen('main-menu');
        UISystem.hideModal('pause-menu');
    }

    onPlayerDeath() {
        setTimeout(() => {
            if (confirm('You died! Return to village?')) {
                // Respawn in hub
                this.player.isDead = false;
                this.player.health = this.player.maxHealth;
                this.player.chakra = this.player.maxChakra;

                MapSystem.loadMap('konoha_hub', this);
            } else {
                this.returnToMainMenu();
            }
        }, 1000);
    }

    onBossDefeated(boss) {
        setTimeout(() => {
            this.showNotification(`${boss.name} Defeated!`, 3000);

            // Mark mission complete
            if (!this.completedMissions.includes('land_of_waves')) {
                this.completedMissions.push('land_of_waves');
            }

            // Deactivate hidden mist
            MapSystem.deactivateHiddenMist();
        }, 500);
    }

    activateHiddenMist() {
        MapSystem.activateHiddenMist();
        this.showNotification('Hidden Mist Technique!', 2000);
    }

    showDamageNumber(x, y, damage, type) {
        UISystem.showDamageNumber(x, y, damage, type);
    }

    showNotification(message, duration) {
        UISystem.showNotification(message, duration);
    }

    showLevelUpNotification(level) {
        UISystem.showLevelUpNotification(level);
    }

    showInteractPrompt(message) {
        UISystem.showInteractPrompt(message);
    }

    openShop(npc) {
        alert(`Shop: ${npc.name}\n\nShop system coming soon!`);
    }

    openMissionSelect(npc) {
        if (!npc.missions || npc.missions.length === 0) return;

        const mission = npc.missions[0]; // Land of Waves

        if (confirm(`${mission.name}\n${mission.description}\n\nDifficulty: ${mission.difficulty}\n\nAccept mission?`)) {
            this.currentMission = mission.id;
            MapSystem.loadMap('land_of_waves', this);
        }
    }
}

// Initialize game when page loads
let game;

window.addEventListener('DOMContentLoaded', () => {
    game = new NarutoActionRPG();
    game.init();
});
