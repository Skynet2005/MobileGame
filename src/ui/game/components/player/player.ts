// Player class - represents the player's furnace and stats
export class Player {
  // Define properties for TypeScript
  furnaceLevel: number;
  furnaceMaxLevel: number;
  furnaceTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  temperatureDecayRate: number;
  coalBurnRate: number;
  x: number;
  y: number;
  powerLevel: number;
  isUpgrading: boolean;
  upgradeProgress: number;
  upgradeTime: number;
  upgradeRequirements: { meat: number; wood: number; coal: number; iron: number };
  allianceId: number | null;
  resourceManager: {
      getResource: (resource: string) => number;
      consumeResource: (resource: string, amount: number) => void;
  };

  constructor(resourceManager: {
      getResource: (resource: string) => number;
      consumeResource: (resource: string, amount: number) => void;
  }) {
      this.resourceManager = resourceManager;

      // Furnace properties
      this.furnaceLevel = 1;
      this.furnaceMaxLevel = 30;
      this.furnaceTemperature = 20; // Starting temperature in Celsius
      this.maxTemperature = 100;
      this.minTemperature = 0;
      this.temperatureDecayRate = 2; // Degrees per second
      this.coalBurnRate = 0.5; // Coal per second when furnace is active

      // Position on the map
      this.x = 0;
      this.y = 0;

      // Power level
      this.powerLevel = 100; // Starting power level

      // Upgrade properties
      this.isUpgrading = false;
      this.upgradeProgress = 0;
      this.upgradeTime = 30; // Seconds to upgrade
      this.upgradeRequirements = {
          meat: 50,
          wood: 100,
          coal: 30,
          iron: 20
      };

      // Alliance
      this.allianceId = null;
  }

  update(deltaTime: number): void {
      // Update furnace temperature
      this.updateTemperature(deltaTime);

      // Update upgrade progress if upgrading
      if (this.isUpgrading) {
          this.updateUpgrade(deltaTime);
      }
  }

  updateTemperature(deltaTime: number): void {
      // Temperature decreases over time
      this.furnaceTemperature -= this.temperatureDecayRate * deltaTime;

      // Ensure temperature doesn't go below minimum
      if (this.furnaceTemperature < this.minTemperature) {
          this.furnaceTemperature = this.minTemperature;
      }

      // If temperature is above minimum, burn coal
      if (this.furnaceTemperature > this.minTemperature) {
          const coalToConsume = this.coalBurnRate * deltaTime;
          this.resourceManager.consumeResource('coal', coalToConsume);
      }
  }

  addCoal(amount: number): boolean {
      // Add coal to increase temperature
      if (this.resourceManager.getResource('coal') >= amount) {
          this.resourceManager.consumeResource('coal', amount);

          // Increase temperature based on coal amount
          this.furnaceTemperature += amount * 5;

          // Cap temperature at maximum
          if (this.furnaceTemperature > this.maxTemperature) {
              this.furnaceTemperature = this.maxTemperature;
          }

          return true;
      }
      return false;
  }

  startUpgrade(): boolean {
      // Check if already upgrading
      if (this.isUpgrading) return false;

      // Check if at max level
      if (this.furnaceLevel >= this.furnaceMaxLevel) return false;

      // Check if player has enough resources
      const requirements = this.getUpgradeRequirements();
      for (const [resource, amount] of Object.entries(requirements)) {
          if (this.resourceManager.getResource(resource) < amount) {
              return false;
          }
      }

      // Consume resources
      for (const [resource, amount] of Object.entries(requirements)) {
          this.resourceManager.consumeResource(resource, amount);
      }

      // Start upgrading
      this.isUpgrading = true;
      this.upgradeProgress = 0;

      return true;
  }

  updateUpgrade(deltaTime: number): void {
      // Increase upgrade progress
      this.upgradeProgress += deltaTime;

      // Check if upgrade is complete
      if (this.upgradeProgress >= this.upgradeTime) {
          this.completeFurnaceUpgrade();
      }
  }

  completeFurnaceUpgrade(): void {
      // Increase furnace level
      this.furnaceLevel++;

      // Update power level
      this.powerLevel += 50 * this.furnaceLevel;

      // Reset upgrade state
      this.isUpgrading = false;
      this.upgradeProgress = 0;

      // Update upgrade requirements for next level
      this.updateUpgradeRequirements();
  }

  updateUpgradeRequirements(): void {
      // Increase resource requirements for next level
      const multiplier = 1.2;
      for (const resource in this.upgradeRequirements) {
          if (Object.prototype.hasOwnProperty.call(this.upgradeRequirements, resource)) {
              const resourceKey = resource as keyof typeof this.upgradeRequirements;
              this.upgradeRequirements[resourceKey] = Math.ceil(
                  this.upgradeRequirements[resourceKey] * multiplier
              );
          }
      }

      // Increase upgrade time
      this.upgradeTime = Math.ceil(this.upgradeTime * 1.1);
  }

  getUpgradeRequirements(): { meat: number; wood: number; coal: number; iron: number } {
      return this.upgradeRequirements;
  }

  getUpgradeProgress(): number {
      return this.isUpgrading ? this.upgradeProgress / this.upgradeTime : 0;
  }

  getFurnaceLevelDisplay(): string {
      return `F${this.furnaceLevel}`;
  }

  setPosition(x: number, y: number): void {
      this.x = x;
      this.y = y;
  }
}
