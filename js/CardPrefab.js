
// You can write more code here

/* START OF COMPILED CODE */

export default class CardPrefab extends Phaser.GameObjects.Container {

    constructor(scene, x, y) {
        super(scene, x ?? 0, y ?? 0);

        // bg
        const bg = scene.add.image(0, -50, "card_bg");
        this.add(bg);

        // promptText
        const promptText = scene.add.text(0, -180, "Prompt Text Goes Here", {});
        promptText.setOrigin(0.5, 0.5);
        promptText.setStyle({ "align": "center", "color": "#ffffff", "fontFamily": "Arial", "fontSize": "24px" });
        promptText.setWordWrapWidth(500);
        this.add(promptText);

        // idText
        const idText = scene.add.text(0, -50, "ID_001", {});
        idText.setOrigin(0.5, 0.5);
        idText.setStyle({ "align": "center", "color": "#000000", "fontFamily": "Arial", "fontSize": "16px" });
        this.add(idText);

        // fields
        this.promptText = promptText;
        this.idText = idText;

        /* START-USER-CTR-CODE */
        // Write your code here.
        /* END-USER-CTR-CODE */
    }

    /** @type {Phaser.GameObjects.Text} */
    promptText;
    /** @type {Phaser.GameObjects.Text} */
    idText;

    /* START-USER-CODE */

    // Write your code here.
    setCardData(data) {
        this.promptText.setText(data.prompt);
        this.idText.setText(data.id);
        // Buttons are added dynamically in CardManager for now, or we could add them to the prefab?
        // Let's keep button logic dynamic for now as the quantity is 2 but could change.
        // Actually, let's just expose the container for the manager to use.
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
