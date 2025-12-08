export class GameState {
    constructor() {
        if (GameState.instance) {
            return GameState.instance;
        }
        GameState.instance = this;

        // Action definition
        this.actions = {
            'family_time': {
                label: 'Family Time',
                cost: { politicalFunding: 0 },
                req: { wellBeing: 20 },
                effect: { selfEsteem: 15, wellBeing: 5 }
            },
            'corporate_party': {
                label: 'Corporate Party',
                cost: { politicalFunding: 0 },
                req: {},
                effect: { selfEsteem: 10, wellBeing: -5, politicalFunding: 10 }
            },
            'therapist': {
                label: 'See Therapist',
                cost: { politicalFunding: 20 },
                req: {},
                effect: { selfEsteem: 20, wellBeing: 10 }
            }
        };

        // Initialize metrics
        this.reset();
    }

    reset() {
        this.publicSupport = 20;
        this.politicalFunding = 20;
        this.cityEconomy = 20;
        this.wellBeing = 20;
        this.selfEsteem = 20;
        this.gameOver = false;
    }

    checkFailConditions() {
        if (this.selfEsteem <= 0) {
            this.gameOver = true;
            return true;
        }
        return false;
    }

    canAffordAction(actionKey) {
        const action = this.actions[actionKey];
        if (!action) return false;

        // Check costs
        if (action.cost.politicalFunding && this.politicalFunding < action.cost.politicalFunding) return false;

        // Check requirements
        if (action.req.wellBeing && this.wellBeing < action.req.wellBeing) return false;

        return true;
    }

    performAction(actionKey) {
        if (!this.canAffordAction(actionKey)) return false;

        const action = this.actions[actionKey];

        // Pay costs
        if (action.cost.politicalFunding) this.politicalFunding -= action.cost.politicalFunding;

        // Apply effects
        this.applyEffects(action.effect);
        return true;
    }

    applyEffects(effects) {
        if (!effects) return;

        if (effects.publicSupport !== undefined) this.publicSupport += effects.publicSupport;
        if (effects.politicalFunding !== undefined) this.politicalFunding += effects.politicalFunding;
        if (effects.cityEconomy !== undefined) this.cityEconomy += effects.cityEconomy;
        if (effects.wellBeing !== undefined) this.wellBeing += effects.wellBeing;
        if (effects.selfEsteem !== undefined) this.selfEsteem += effects.selfEsteem;

        // Clamp values
        this.publicSupport = Phaser.Math.Clamp(this.publicSupport, 0, 100);
        if (this.politicalFunding < 0) this.politicalFunding = 0;
        this.cityEconomy = Phaser.Math.Clamp(this.cityEconomy, -100, 100);
        this.wellBeing = Phaser.Math.Clamp(this.wellBeing, 0, 100);
        this.selfEsteem = Phaser.Math.Clamp(this.selfEsteem, 0, 100);
    }
}
