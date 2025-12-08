export class CardManager {
    constructor(scene) {
        this.scene = scene;
        this.cardContainer = null;
    }

    showCard(decisionData, totalDecisions, currentIndex, callbacks) {
        // callbacks = { onOption: fn, onStayQuiet: fn, onManage: fn }

        if (this.cardContainer) {
            this.destroy(); // Ensure full cleanup
        }

        // Layout Constants
        const CARD_WIDTH = 900;
        const CARD_HEIGHT = 550; // Taller for grid
        const ART_HEIGHT = 350; // Top

        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2 + 50;

        this.cardContainer = this.scene.add.container(centerX, centerY);

        // Frame with Decision Background
        const cardBg = this.scene.add.image(0, 0, 'bg_decision');
        cardBg.setDisplaySize(CARD_WIDTH, CARD_HEIGHT);
        cardBg.setInteractive(); // Block clicks behind
        // Keep stroke if desired, but image usually sufficient. Or add stroke on top.
        // Let's add a border rect on top if we want the "white outline" look to remain.
        const border = this.scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT).setStrokeStyle(3, 0xffffff);




        // --- PROMPT (V3) ---
        // Top of the card area
        // Container is at center (640, 360). Card Top is -275. 
        // We want prompt above art. 
        const promptText = this.scene.add.text(-450, -CARD_HEIGHT / 2 - 40, "", {
            fontFamily: '"VT323", monospace',
            fontSize: '32px',
            color: '#FFFFFF',
            align: 'left',
            wordWrap: { width: 900 }
        }).setOrigin(0, 0.5);

        // Start Typewriter
        this.startTypewriterEffect(promptText, decisionData.prompt || "Situation...");

        // --- BUTTONS (2x2 Grid) ---
        // Option A | Option B
        // Quiet    | Manage

        const gridY = CARD_HEIGHT / 2 - 90; // Bottom area
        const btnWidth = 400;
        const btnHeight = 60;
        const gap = 20;

        this.cardContainer.add([cardBg, border, promptText]);

        // 1. Option A (Top Left) (Index 0)
        this.createButton(-btnWidth / 2 - gap / 2, gridY - btnHeight / 2 - gap / 2, btnWidth, btnHeight, decisionData.options[0].text, () => {
            this.scene.sound.play('sfx_ui_click');
            this.animateDestroy(() => callbacks.onOption(decisionData.options[0], 0));
        });

        // 2. Option B (Top Right) (Index 1)
        this.createButton(btnWidth / 2 + gap / 2, gridY - btnHeight / 2 - gap / 2, btnWidth, btnHeight, decisionData.options[1].text, () => {
            this.scene.sound.play('sfx_ui_click');
            this.animateDestroy(() => callbacks.onOption(decisionData.options[1], 1));
        });

        // 3. Stay Quiet (Bottom Left)
        this.createButton(-btnWidth / 2 - gap / 2, gridY + btnHeight / 2 + gap / 2, btnWidth, btnHeight, "Stay Quiet", () => {
            this.scene.sound.play('sfx_ui_click');
            this.animateDestroy(callbacks.onStayQuiet);
        });

        // 4. Manage Self (Bottom Right)
        this.createButton(btnWidth / 2 + gap / 2, gridY + btnHeight / 2 + gap / 2, btnWidth, btnHeight, "Manage Self", () => {
            this.scene.sound.play('sfx_ui_click');
            // Note: We do NOT destroy card immediately, we open modal. 
            // If modal action taken -> then destroy. 
            callbacks.onManage();
        });



        // Animate In
        this.cardContainer.setAlpha(0);
        this.scene.tweens.add({
            targets: this.cardContainer,
            alpha: 1,
            duration: 300
        });
    }

    createButton(x, y, w, h, text, onClick) {
        const btn = this.scene.add.container(x, y);

        const bg = this.scene.add.rectangle(0, 0, w, h, 0x000000)
            .setStrokeStyle(2, 0xFFFFFF)
            .setInteractive({ useHandCursor: true });

        const label = this.scene.add.text(0, 0, text.toUpperCase(), {
            fontFamily: '"VT323", monospace',
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        bg.on('pointerover', () => { bg.setFillStyle(0xFFFFFF); label.setColor('#000000'); });
        bg.on('pointerout', () => { bg.setFillStyle(0x000000); label.setColor('#FFFFFF'); });
        bg.on('pointerdown', onClick);

        btn.add([bg, label]);
        this.cardContainer.add(btn);
    }



    animateDestroy(callback) {
        // Stop Intro Audio if still playing
        if (this.currentIntroSound) {
            this.currentIntroSound.stop();
            this.currentIntroSound = null;
        }

        if (!this.cardContainer) return;
        this.scene.tweens.add({
            targets: this.cardContainer,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.destroy(); // Use destroy() to clean up everything
                this.cardContainer = null;
                callback();
            }
        });
    }

    startTypewriterEffect(textObj, fullText) {
        let length = 0;
        const totalLength = fullText.length;

        // Start Looping Sound
        if (this.scene.cache.audio.exists('typing_sfx')) {
            this.typingSound = this.scene.sound.add('typing_sfx', { loop: true, volume: 0.5 });
            this.typingSound.play();
        }

        this.stopTypewriter(); // Clear any existing

        this.typewriterTimer = this.scene.time.addEvent({
            callback: () => {
                length++;
                textObj.setText(fullText.substr(0, length));

                if (length >= totalLength) {
                    // Stop Sound on complete
                    if (this.typingSound) {
                        this.typingSound.stop();
                        this.typingSound = null;
                    }
                }
            },
            repeat: totalLength - 1,
            delay: 40 // Adjust speed here (ms per char)
        });
    }

    stopTypewriter() {
        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
            this.typewriterTimer = null;
        }
        if (this.typingSound) {
            this.typingSound.stop();
            this.typingSound = null;
        }
    }

    destroy() {
        this.stopTypewriter();
        if (this.currentIntroSound) {
            this.currentIntroSound.stop();
            this.currentIntroSound = null;
        }
        if (this.cardContainer) {
            this.cardContainer.destroy();
            this.cardContainer = null;
        }
    }
}
