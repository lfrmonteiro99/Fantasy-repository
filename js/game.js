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
        this.notifications = [];

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

        // Mobile interaction tracking
        this.lastTapNearNPC = null;
        this.lastTapInExitZone = false;
        this.lastTapInZone = null;
    }

    async init() {
        // Setup canvas
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 100);
        });

        // Initialize UI system
        UISystem.init(this);

        // Setup input handlers
        this.setupInputHandlers();

        // Load environment objects
        await Environment.loadSprites();

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
        // Set CSS custom property for viewport height (fixes mobile browser chrome)
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Force layout recalculation
        document.body.style.height = `${window.innerHeight}px`;
        document.getElementById('game-container').style.height = `${window.innerHeight}px`;
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

        // Melee attack button (mobile)
        const meleeBtn = document.getElementById('melee-attack-btn');
        if (meleeBtn) {
            meleeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.state === 'playing' && !this.paused) {
                    this.performMeleeAttack();
                }
            });
        }

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

            // Deactivate player joystick input
            if (this.player) {
                this.player.joystickInput.active = false;
                this.player.joystickInput.magnitude = 0;
            }
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

        // Feed joystick input to player for analog control
        if (this.player) {
            const magnitude = this.joystick.distance / maxDistance; // Normalize to 0-1

            if (magnitude > 0.1) {
                this.player.joystickInput.active = true;
                this.player.joystickInput.angle = this.joystick.angle;
                this.player.joystickInput.magnitude = magnitude;
            } else {
                this.player.joystickInput.active = false;
                this.player.joystickInput.magnitude = 0;
            }
        }
    }

    handlePointerDown(e) {
        const pos = Utils.getInputPosition(e, this.canvas);
        this.input.mouse.down = true;

        // Debug: show tap detected
        if (!this.notifications) this.notifications = [];
        this.notifications.push({ message: `Tap at (${Math.floor(pos.x)}, ${Math.floor(pos.y)})`, duration: 1 });

        if (this.state === 'playing' && !this.paused) {
            // Convert to world coordinates
            const worldPos = Utils.screenToWorld(pos.x, pos.y, this.camera);

            // Check if tapped near active NPC (for mobile interaction)
            if (MapSystem.activeInteractNPC && this.player) {
                const npc = MapSystem.activeInteractNPC;
                const distToNPC = Utils.distance(worldPos.x, worldPos.y, npc.x, npc.y);

                if (distToNPC <= npc.radius + 50) {
                    // Tapped on or near the NPC
                    this.lastTapNearNPC = npc;
                    return; // Don't set move target
                }
            }

            // Check if tapped in exit zone
            if (this.currentMap && this.currentMap.exitZone && this.player) {
                const exitZone = this.currentMap.exitZone;
                const distToExit = Utils.distance(worldPos.x, worldPos.y, exitZone.x, exitZone.y);

                if (distToExit <= exitZone.radius) {
                    // Tapped in exit zone
                    this.lastTapInExitZone = true;
                    return; // Don't set move target
                }
            }

            // Check if tapped near active interaction zone (for Mission Log, etc.)
            if (MapSystem.activeInteractZone && this.player) {
                // When zone prompt is showing, any tap triggers interaction
                this.lastTapInZone = MapSystem.activeInteractZone;
                if (!this.notifications) this.notifications = [];
                this.notifications.push({ message: 'Tap detected on zone!', duration: 2 });
                return; // Don't set move target
            }

            // Set move target
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
        this.player.useAbility(slot, this);
    }

    performMeleeAttack() {
        if (!this.player || this.player.isDead) return;

        // Trigger attack animation
        this.player.isAttacking = true;
        this.player.attackAnimationTime = 0.5;  // Attack animation duration

        // Find nearest enemy in melee range
        const meleeRange = 80;
        let nearestEnemy = null;
        let nearestDist = Infinity;

        if (this.enemies) {
            for (let enemy of this.enemies) {
                if (enemy.isDead) continue;
                const dist = Utils.distance(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist < nearestDist && dist <= meleeRange) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }
        }

        if (nearestEnemy) {
            // Calculate damage
            const stats = ItemSystem.getTotalStats(this.player);
            let damage = stats.attack;

            // Apply damage boost from Nine-Tails
            if (this.player.statusEffects) {
                for (let effect of this.player.statusEffects) {
                    if (effect.type === 'nine_tails' && effect.value.damageBoost) {
                        damage *= effect.value.damageBoost;
                    }
                }
            }

            damage = Utils.calculateDamage(damage);
            nearestEnemy.takeDamage(damage, this);

            this.showDamageNumber(nearestEnemy.x, nearestEnemy.y, damage, 'player-damage');
            AudioManager.play('naruto_attack');

            // Face enemy
            this.player.facingAngle = Utils.angleBetween(this.player.x, this.player.y, nearestEnemy.x, nearestEnemy.y);

            // Visual feedback
            this.createMeleeAttackEffect(nearestEnemy);
        }
    }

    createMeleeAttackEffect(enemy) {
        // Create particles for melee hit
        if (!this.particles) this.particles = [];

        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.randomFloat(50, 150);
            const particle = Utils.createParticle(
                enemy.x,
                enemy.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#FFD700',
                Utils.randomFloat(3, 6),
                0.3
            );
            this.particles.push(particle);
        }
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
            this.player.update(this, dt);
        }

        // Update enemies
        if (this.enemies) {
            for (let enemy of this.enemies) {
                enemy.update(this, dt);
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

        // Update notifications
        if (this.notifications) {
            this.notifications = this.notifications.filter(notif => {
                notif.duration -= dt;
                return notif.duration > 0;
            });
        }

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
        // Lock camera for fullscreen hub maps, move for others
        if (this.currentMap && this.currentMap.type === 'hub' && this.currentMap.backgroundImage) {
            // Keep camera locked at (0,0) for fullscreen hub maps
            this.camera.x = 0;
            this.camera.y = 0;
        } else {
            // Normal camera follow for other maps
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
                    enemy.draw(this.ctx, this.camera);
                }
            }

            // Draw player
            if (this.player) {
                this.player.draw(this.ctx, this.camera);
            }

            // Draw projectiles
            AbilitySystem.drawProjectiles(this.ctx, this);

            // Draw particles
            if (this.particles) {
                for (let particle of this.particles) {
                    Utils.drawParticle(this.ctx, particle, this.camera);
                }
            }

            // Draw notifications
            this.drawNotifications();

            // Always show walkable area info
            this.drawWalkableInfo();

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

        // Add walkable area info if available
        if (this.currentMap?.walkableInfo) {
            const w = this.currentMap.walkableInfo;
            debugInfo.push('');
            debugInfo.push(`Scale: ${w.scaleX}x, ${w.scaleY}y`);
            debugInfo.push(`Walkable: (${w.scaledBounds.minX},${w.scaledBounds.minY})`);
            debugInfo.push(`       to (${w.scaledBounds.maxX},${w.scaledBounds.maxY})`);
        }

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 280, debugInfo.length * 20 + 10);

        debugInfo.forEach((line, index) => {
            Utils.drawText(this.ctx, line, 15, 15 + index * 20, {
                font: '14px monospace',
                color: '#00FF00'
            });
        });
        this.ctx.restore();
    }

    drawWalkableInfo() {
        if (!this.currentMap?.walkableInfo) return;

        const w = this.currentMap.walkableInfo;
        const info = [
            'WALKABLE AREA (Scaled Coords):',
            `Scale: ${w.scaleX}x, ${w.scaleY}y`,
            `From: (${w.scaledBounds.minX}, ${w.scaledBounds.minY})`,
            `To: (${w.scaledBounds.maxX}, ${w.scaledBounds.maxY})`,
            `Player: (${Math.floor(this.player?.x || 0)}, ${Math.floor(this.player?.y || 0)})`
        ];

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, this.canvas.height - 130, 320, 120);

        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(10, this.canvas.height - 130, 320, 120);

        info.forEach((line, index) => {
            Utils.drawText(this.ctx, line, 20, this.canvas.height - 110 + index * 22, {
                font: index === 0 ? 'bold 14px monospace' : '14px monospace',
                color: index === 0 ? '#FFD700' : '#00FF00'
            });
        });
        this.ctx.restore();
    }

    drawNotifications() {
        if (!this.notifications || this.notifications.length === 0) return;

        this.ctx.save();

        const startY = 100;
        const spacing = 50;

        this.notifications.forEach((notif, index) => {
            const y = startY + index * spacing;
            const alpha = Math.min(1, notif.duration);

            // Background
            this.ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
            this.ctx.fillRect(this.canvas.width / 2 - 150, y - 15, 300, 40);

            // Border
            this.ctx.strokeStyle = notif.color || '#FF6B1A';
            this.ctx.globalAlpha = alpha;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.canvas.width / 2 - 150, y - 15, 300, 40);

            // Text
            Utils.drawText(this.ctx, notif.message, this.canvas.width / 2, y + 5, {
                font: 'bold 16px Arial',
                color: notif.color || '#FFFFFF',
                align: 'center',
                alpha: alpha
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
            UISystem.showDeathModal(this);
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

            // Award mission completion rewards
            setTimeout(() => {
                const goldReward = 500;
                const xpReward = 300;

                this.player.gold += goldReward;
                this.player.gainXP(xpReward, this);

                // Show mission complete modal
                setTimeout(() => {
                    UISystem.showMissionCompleteModal(goldReward, xpReward, this);
                }, 1000);
            }, 1500);
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
        UISystem.showShopModal(npc, this);
    }

    openMissionSelect(npc) {
        // Handle both NPC-based and zone-based mission selection
        let mission;

        if (npc && npc.missions && npc.missions.length > 0) {
            mission = npc.missions[0];
        } else {
            // Default mission for Mission Log zone
            mission = {
                id: 'land_of_waves',
                name: 'Mission: Land of Waves',
                description: 'Travel to the Land of Waves and protect the bridge builder',
                difficulty: 'C-Rank',
                unlocked: true
            };
        }

        UISystem.showMissionSelectModal(mission, this);
    }
}

// Initialize game when page loads
let game;

window.addEventListener('DOMContentLoaded', () => {
    game = new NarutoActionRPG();
    game.init();
});
