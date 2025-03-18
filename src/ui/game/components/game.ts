// Import modules
import { Player } from './player/player';
import { ThreeWorldMap, ViewMode } from './map/ThreeWorldMap';

// Define interfaces for game components
interface PlayerLocation {
    x: number;
    y: number;
}

// Created Logic for review: Add map tiers interface
interface MapTier {
    name: string;
    startRadius: number;
    endRadius: number;
}

interface DebugElements {
    testDiv: HTMLDivElement | null;
    debugInfo: HTMLDivElement | null;
    testDivTimeout: number | null;
    debugInfoTimeout: number | null;
}

// Game class - main controller
export class Game {
    private player: Player;
    private worldMap: ThreeWorldMap;
    private isRunning: boolean;
    private lastTimestamp: number;
    private frameId: number | null;
    private debugElements: DebugElements;
    private characterId: string | null = null;  // Added to track character ID

    // Created Logic for review: Updated map configuration with named tiers
    private static readonly MAP_CONFIG = {
        MAP_SIZE: 1200,         // Map size from GameState
        TIERS: {
            ICEFIELD: {
                name: 'Icefield',
                startRadius: 0.7,  // 70% of map radius
                endRadius: 0.95    // 95% of map radius
            },
            TUNDRA: {
                name: 'Tundra',
                startRadius: 0.4,  // 40% of map radius
                endRadius: 0.7     // 70% of map radius
            },
            RUINS: {
                name: 'Ruins',
                startRadius: 0,    // Center
                endRadius: 0.4     // 40% of map radius
            }
        }
    };

    // Created Logic for review: Modified to use new tier configuration
    private generateOuterTierCoordinates(): { x: number, y: number } {
        const icefield = Game.MAP_CONFIG.TIERS.ICEFIELD;
        const radius = Math.random() *
            (icefield.endRadius - icefield.startRadius) +
            icefield.startRadius;

        const angle = Math.random() * 2 * Math.PI;
        const halfMapSize = Game.MAP_CONFIG.MAP_SIZE / 2;

        // Convert polar coordinates to Cartesian
        const x = Math.round(halfMapSize + radius * halfMapSize * Math.cos(angle));
        const y = Math.round(halfMapSize + radius * halfMapSize * Math.sin(angle));

        return { x, y };
    }

    // Created Logic for review: Add method to save position to database
    private async savePositionToDatabase(x: number, y: number): Promise<void> {
        if (!this.characterId) {
            // Get character ID from localStorage
            const accountStr = localStorage.getItem('account');
            if (!accountStr) {
                console.error('No account found in localStorage');
                return;
            }
            const account = JSON.parse(accountStr);

            // Get character ID
            try {
                const characterResponse = await fetch(`/api/characters/search?accountId=${account.id}`);
                if (!characterResponse.ok) {
                    throw new Error('Failed to find character');
                }
                const characters = await characterResponse.json();
                if (!characters || characters.length === 0) {
                    throw new Error('No character found');
                }
                this.characterId = characters[0].id;
            } catch (error) {
                console.error('Error getting character ID:', error);
                return;
            }
        }

        // Save position to database
        try {
            const response = await fetch(`/api/characters/${this.characterId}/position`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    worldLocationX: x,
                    worldLocationY: y
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update position in database');
            }

            console.log('Position saved to database:', { x, y });
        } catch (error) {
            console.error('Error saving position to database:', error);
        }
    }

    constructor() {
        // Initialize game components
        this.worldMap = new ThreeWorldMap();

        // Initialize player with basic resource manager
        const resourceManager = {
            getResource: (resource: string) => 100,
            consumeResource: (resource: string, amount: number) => {
                console.log(`Consuming ${amount} of ${resource}`);
            }
        };

        // Created Logic for review: Load existing position or generate new one
        let position: PlayerLocation;
        const savedPosition = localStorage.getItem('playerPosition');

        if (savedPosition) {
            position = JSON.parse(savedPosition);
            console.log('Loaded saved position:', position);
        } else {
            position = this.generateOuterTierCoordinates();
            // Persist the new position
            localStorage.setItem('playerPosition', JSON.stringify(position));
            console.log('Generated new position:', position);

            // Save new position to database
            this.savePositionToDatabase(position.x, position.y)
                .catch(error => console.error('Failed to save initial position to database:', error));
        }

        this.player = new Player(resourceManager);
        this.player.setPosition(position.x, position.y);

        // Game state
        this.isRunning = false;
        this.lastTimestamp = 0;
        this.frameId = null;

        // Initialize debug elements tracking
        this.debugElements = {
            testDiv: null,
            debugInfo: null,
            testDivTimeout: null,
            debugInfoTimeout: null
        };

        // Initialize the game
        this.init();
    }

    // Modify setPosition to also update database
    public setPosition(x: number, y: number): void {
        this.player.setPosition(x, y);

        // Update localStorage
        localStorage.setItem('playerPosition', JSON.stringify({ x, y }));

        // Update database
        this.savePositionToDatabase(x, y)
            .catch(error => console.error('Failed to save position to database:', error));
    }

    // Created Logic for review: Add method to get tier name from coordinates
    public getTierNameFromPosition(x: number, y: number): string {
        const halfMapSize = Game.MAP_CONFIG.MAP_SIZE / 2;
        const distance = Math.sqrt(
            Math.pow(x - halfMapSize, 2) +
            Math.pow(y - halfMapSize, 2)
        ) / halfMapSize;

        if (distance >= Game.MAP_CONFIG.TIERS.ICEFIELD.startRadius) {
            return Game.MAP_CONFIG.TIERS.ICEFIELD.name;
        } else if (distance >= Game.MAP_CONFIG.TIERS.TUNDRA.startRadius) {
            return Game.MAP_CONFIG.TIERS.TUNDRA.name;
        } else {
            return Game.MAP_CONFIG.TIERS.RUINS.name;
        }
    }

    async init(): Promise<void> {
        try {
            console.log('Game initialization starting');

            // Start the game loop
            this.start();

            console.log('Game initialization completed successfully');
            return;
        } catch (error) {
            console.error('Error during game initialization:', error);
            throw error;
        }
    }

    // Initialize the world map with a container element
    initWorldMap(containerElement: HTMLElement): boolean {
        console.log('Game.initWorldMap called with container element:', containerElement);
        console.log('Container dimensions:', containerElement.clientWidth, 'x', containerElement.clientHeight);

        if (!containerElement) {
            console.error('No container element provided for world map');
            return false;
        }

        // First, apply some styling to ensure the container is properly sized and visible
        containerElement.style.overflow = 'hidden';
        containerElement.style.position = 'absolute';
        containerElement.style.width = '100%';
        containerElement.style.height = '100%';
        containerElement.style.backgroundColor = '#000033'; // Dark blue background
        containerElement.style.zIndex = '1'; // Ensure container has a low z-index

        // Add a fallback colored div for testing if THREE.js fails to display
        const testDiv = document.createElement('div');
        testDiv.id = 'map-fallback-test';
        testDiv.style.position = 'absolute';
        testDiv.style.top = '10px';
        testDiv.style.right = '10px';
        testDiv.style.width = '50px';
        testDiv.style.height = '50px';
        testDiv.style.backgroundColor = 'red';
        testDiv.style.zIndex = '1000';
        testDiv.innerHTML = 'Test element';
        containerElement.appendChild(testDiv);

        // Store reference for cleanup
        this.debugElements.testDiv = testDiv;

        console.log('Added test div for visibility checking');

        // Add a debug info element
        const debugInfo = document.createElement('div');
        debugInfo.id = 'map-debug-info';
        debugInfo.style.position = 'absolute';
        debugInfo.style.bottom = '10px';
        debugInfo.style.right = '10px';
        debugInfo.style.color = 'white';
        debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        debugInfo.style.padding = '10px';
        debugInfo.style.zIndex = '1000';
        debugInfo.style.fontSize = '12px';
        debugInfo.style.fontFamily = 'monospace';
        debugInfo.textContent = 'Initializing world map...';
        containerElement.appendChild(debugInfo);

        // Store reference for cleanup
        this.debugElements.debugInfo = debugInfo;

        console.log('Initializing ThreeWorldMap...');

        try {
            // Initialize the Three.js world map
            const success = this.worldMap.init(containerElement);
            console.log('ThreeWorldMap init result:', success);

            if (success) {
                // Update debug info
                debugInfo.textContent = 'World map loaded successfully';

                // If successful, remove the test div after 5 seconds
                if (this.debugElements.testDivTimeout) {
                    clearTimeout(this.debugElements.testDivTimeout);
                }

                this.debugElements.testDivTimeout = window.setTimeout(() => {
                    this.safelyRemoveElement(testDiv);
                    this.debugElements.testDivTimeout = null;
                }, 5000);

                // Force a render to make sure things are visible
                if (typeof this.worldMap.render === 'function') {
                    this.worldMap.render();
                }

                // Place furnace at player's position
                console.log('Placing furnace at player position:', this.player.x, this.player.y);
                const tierName = this.getTierNameFromPosition(this.player.x, this.player.y);
                console.log(`Player location tier: ${tierName}`);

                if (typeof this.worldMap.placeFurnace === 'function') {
                    const furnaceSuccess = this.worldMap.placeFurnace(this.player.x, this.player.y, this.player);
                    console.log('Placed furnace result:', furnaceSuccess);

                    // Update debug info with position and tier
                    if (this.debugElements.debugInfo) {
                        this.debugElements.debugInfo.textContent =
                            `Furnace placed at (${this.player.x}, ${this.player.y}) - ${tierName}`;
                    }
                }

                // Add a scheduled re-render to help with visibility issues
                setTimeout(() => {
                    console.log('Scheduled re-render triggered');
                    if (typeof this.worldMap.render === 'function') {
                        this.worldMap.render();
                    }

                    // Update debug info
                    debugInfo.textContent = 'Map rendering active';

                    // Remove debug info after 5 seconds
                    if (this.debugElements.debugInfoTimeout) {
                        clearTimeout(this.debugElements.debugInfoTimeout);
                    }

                    this.debugElements.debugInfoTimeout = window.setTimeout(() => {
                        this.safelyRemoveElement(debugInfo);
                        this.debugElements.debugInfoTimeout = null;
                    }, 5000);
                }, 1000);

                return success;
            } else {
                // Update debug info on failure
                debugInfo.textContent = 'Error initializing world map!';
                debugInfo.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                console.error('ThreeWorldMap initialization failed');
                return false;
            }
        } catch (error) {
            console.error('Error in initWorldMap:', error);
            // Update debug info on exception
            debugInfo.textContent = 'Exception: ' + (error instanceof Error ? error.message : String(error));
            debugInfo.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            return false;
        }
    }

    // Helper method to safely remove an element
    private safelyRemoveElement(element: HTMLDivElement | null): void {
        if (!element) return;

        try {
            console.log(`Attempting to remove element with id: ${element.id}`);

            // Check if the element is still in the DOM before removing
            if (document.contains(element)) {
                if (element.parentNode) {
                    console.log(`Element ${element.id} is in DOM, removing safely`);
                    element.parentNode.removeChild(element);
                } else {
                    console.warn(`Element ${element.id} has no parent node`);
                }
            } else {
                console.log(`Element ${element.id} is not in the DOM, no need to remove`);
            }
        } catch (error) {
            console.error(`Error removing element ${element.id}:`, error);
        }
    }

    // Set the view mode for the world map
    setViewMode(mode: ViewMode): void {
        if (this.worldMap) {
            this.worldMap.setViewMode(mode);
        }
    }

    // Start the game loop
    start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTimestamp = performance.now();
        this.gameLoop(this.lastTimestamp);
    }

    // Stop the game loop
    stop(): void {
        this.isRunning = false;
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    // Main game loop
    gameLoop(timestamp: number): void {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        // Update game state
        this.update(deltaTime);

        // Continue the loop if game is running
        if (this.isRunning) {
            this.frameId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    // Update game state
    update(deltaTime: number): void {
        // Update game components
        this.player.update(deltaTime);
    }
}
