# Naruto Action RPG

A browser-based action RPG set in the Naruto universe, featuring top-down Diablo-style gameplay with real-time combat, character progression, and epic boss battles.

## Overview

This is a **Phase 1 Vertical Slice** build featuring:
- **Playable Character**: Naruto Uzumaki (Ninjutsu Specialist)
- **Abilities**: 4 active abilities + 2 passive abilities
- **Hub Area**: Mini Konoha Village with NPC interactions
- **Mission**: Land of Waves arc with enemy waves and boss fight
- **Boss**: Zabuza Momochi with multi-phase mechanics
- **Systems**: Full gear/inventory, progression (XP/leveling), and save/load

## Features

### Character System
- **Naruto Uzumaki** - Ninjutsu Specialist (Starter)
- Shadow Clone Jutsu - Summon clones to fight alongside you
- Rasengan - Powerful spiraling chakra sphere
- Kunai Throw - Ranged projectile attack
- Nine-Tails Chakra - Ultimate buff ability
- 2 Passive Abilities unlocked through leveling

### Combat System
- Real-time action combat
- Click/tap to move
- 4 ability slots with cooldowns and chakra costs
- Auto-attack nearby enemies
- Status effects and buffs
- Particle effects and visual feedback

### Progression
- XP and leveling (infinite scaling)
- Ability upgrades through usage
- Stat increases per level
- Passive ability unlocks

### Gear & Loot
- 3 Equipment Slots: Weapon, Armor, Accessory
- 3 Rarity Tiers: Normal, Enhanced, Legendary
- Drop system from enemies
- Equipment stats (Attack, Defense, Chakra, etc.)
- Full inventory management

### Game Modes
- **Konoha Hub**: Village exploration with NPCs, shop, and mission board
- **Land of Waves Mission**: Linear combat mission with enemy waves
- **Boss Fight**: Zabuza with 3 phases and special mechanics

### Boss: Zabuza Momochi
- **Phase 1**: Melee sword combat
- **Phase 2 (50% HP)**: Hidden Mist - Screen obscured, increased damage/speed
- **Phase 3 (25% HP)**: Enraged - Much faster attacks and movement

### Controls

#### Desktop
- **Click**: Move to location
- **Q/W/E/R**: Use abilities (slots 1-4)
- **Space**: Interact with NPCs/objects
- **Mouse**: Aim abilities
- **F3**: Toggle debug info

#### Mobile
- **Tap**: Move to location
- **Virtual Joystick**: Continuous movement (bottom-left)
- **Ability Buttons**: Use abilities (bottom-right)
- **Tap NPCs**: Interact

### UI Features
- Mobile-first responsive design
- Naruto-themed color scheme (orange/black/gold)
- Health, Chakra, and XP bars
- Ability cooldown indicators
- Inventory and equipment screen
- Pause menu
- Save/Load system (JSON export/import)

## Technical Details

### Architecture
- **Pure Vanilla JavaScript** - No frameworks
- **HTML5 Canvas** - 2D rendering
- **Mobile-First** - Touch controls primary
- **Modular Design** - Separate systems for easy expansion

### File Structure
```
/
├── index.html              # Main entry point
├── css/
│   └── styles.css         # All styling
├── js/
│   ├── utils.js           # Utility functions
│   ├── audio.js           # Sound system
│   ├── abilities.js       # Ability definitions & logic
│   ├── items.js           # Item/gear system
│   ├── player.js          # Player character system
│   ├── enemies.js         # Enemy AI and types
│   ├── maps.js            # Map/level system
│   ├── ui.js              # UI management
│   ├── save.js            # Save/load system
│   └── game.js            # Main game loop
└── assets/
    ├── sprites/           # Character sprites (placeholder)
    ├── ui/                # UI elements (placeholder)
    └── audio/             # Sound effects (placeholder)
```

### Code Systems

#### Utils (utils.js)
- Math utilities (distance, angles, collision)
- Particle system helpers
- XP/damage calculations
- Canvas drawing helpers

#### Audio (audio.js)
- Web Audio API integration
- Sound effect management
- Simple beep synthesis (for demo)

#### Abilities (abilities.js)
- Ability definitions and effects
- Projectile system
- Shadow clone AI
- Cooldown management
- Ability ranking/upgrades

#### Items (items.js)
- Item database
- Loot generation
- Equipment management
- Stat bonuses
- Item drops in world

#### Player (player.js)
- Character definitions
- Movement and combat
- Stat management
- Progression (XP/leveling)
- Status effects

#### Enemies (enemies.js)
- Enemy types (fodder, elite, boss)
- AI behaviors
- Boss phase system
- Death and loot

#### Maps (maps.js)
- Map definitions
- Enemy wave triggers
- NPC interactions
- Map decorations
- Hidden Mist effect

#### UI (ui.js)
- Screen management
- HUD updates
- Modal dialogs
- Damage numbers
- Notifications

#### Save (save.js)
- JSON export/import
- Save validation
- Auto-save (localStorage)

#### Game (game.js)
- Main game loop
- Input handling
- Camera system
- State management
- Integration of all systems

## Getting Started

### Running the Game
1. Open `index.html` in a modern web browser
2. Click "New Game"
3. Select Naruto Uzumaki
4. Explore Konoha and accept the Land of Waves mission!

### Saving Your Progress
1. Pause the game (≡ button)
2. Click "Save Game"
3. Download JSON file

### Loading Your Save
1. From main menu, click "Load Game"
2. Select your save JSON file

## Future Expansion (Phase 2+)

The code is structured to easily support:
- ✅ Additional characters (13 more defined)
- ✅ More abilities per character
- ✅ Additional gear tiers (Epic, etc.)
- ✅ More missions and story arcs
- ✅ Side quests
- ✅ Skill trees
- ✅ Multiplayer (state-based architecture)
- ✅ Cloud saves
- ✅ Background music
- ✅ Advanced visual effects

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Target: 60 FPS on modern devices
- Mobile-optimized rendering
- Particle system with limits
- Efficient collision detection

## Development Notes

### Extensibility
- **Character System**: Add new characters by defining in `PlayerSystem.characters`
- **Abilities**: Add to `AbilitySystem.abilities` with cast functions
- **Items**: Add to `ItemSystem.items` with stats
- **Enemies**: Add to `EnemySystem.enemyTypes` with AI behaviors
- **Maps**: Add to `MapSystem.maps` with decorations and triggers

### Audio
Currently uses Web Audio API to generate simple beeps. To add real sounds:
1. Place MP3/WAV files in `assets/audio/`
2. Update paths in `audio.js` sound definitions
3. Implement proper Audio element loading

### Sprites
Currently uses colored circles and emoji. To add real sprites:
1. Place PNG/SVG files in `assets/sprites/`
2. Load images in game initialization
3. Update draw functions to use sprites instead of shapes

## License

This is a fan project for educational purposes. Naruto and all related characters are property of Masashi Kishimoto and Shueisha.

## Credits

- **Game Design**: Based on Naruto universe
- **Development**: Custom JavaScript engine
- **Inspiration**: Diablo-style action RPGs

---

**Version**: 1.0.0 - Phase 1 Vertical Slice
**Build Date**: 2025-12-26
**Platform**: Browser (HTML5)
