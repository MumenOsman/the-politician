
// You can write more code here

/* START OF COMPILED CODE */

export default class MainGame extends Phaser.Scene {

    constructor() {
        super("MainGame");

        /* START-USER-CTR-CODE */
        // Write your code here.
        /* END-USER-CTR-CODE */
    }

    /** @returns {void} */
    editorCreate() {

        // hudBg
        const hudBg = this.add.rectangle(640, 30, 1280, 60);
        hudBg.isFilled = true;
        hudBg.fillColor = 2236962;

        // publicSupportText
        const publicSupportText = this.add.text(100, 30, "Support: 0%", {});
        publicSupportText.setOrigin(0, 0.5);
        publicSupportText.setStyle({ "color": "#ffffff", "fontFamily": "Arial", "fontSize": "18px" });

        this.publicSupportText = publicSupportText;

        this.events.emit("scene-awake");
    }

    /** @type {Phaser.GameObjects.Text} */
    publicSupportText;

    /* START-USER-CODE */

    // Write your code here.

    create() {
        this.editorCreate();
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
