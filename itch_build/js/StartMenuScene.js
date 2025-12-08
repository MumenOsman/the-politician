export class StartMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartMenuScene' });
    }

    create() {
        // Background
        this.add.rectangle(640, 360, 1280, 720, 0x000000);

        // Title
        this.add.text(640, 200, "THE POLITICIAN", {
            fontFamily: '"VT323", monospace',
            fontSize: '120px',
            color: '#33FF00',
            stroke: '#0f380f',
            strokeThickness: 10,
            shadow: { offsetX: 5, offsetY: 5, color: '#333', blur: 0, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(640, 300, "A GAME OF MORAL DECAY", {
            fontFamily: '"VT323", monospace',
            fontSize: '40px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        // Start Button
        const startBtn = this.add.text(640, 500, "> START CAMPAIGN <", {
            fontFamily: '"VT323", monospace',
            fontSize: '50px',
            color: '#33FF00'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Blink Animation
        this.tweens.add({
            targets: startBtn,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Hover Effect
        startBtn.on('pointerover', () => startBtn.setColor('#FFFFFF'));
        startBtn.on('pointerout', () => startBtn.setColor('#33FF00'));

        // Music
        this.menuMusic = this.sound.add('bgm_menu', { loop: true, volume: 0.5 });
        this.menuMusic.play();

        // Click Action
        startBtn.on('pointerdown', () => {
            // Transition Sound?
            if (this.cache.audio.exists('transition_sfx')) this.sound.play('transition_sfx');

            // Stop Music
            this.tweens.add({
                targets: this.menuMusic,
                volume: 0,
                duration: 500,
                onComplete: () => {
                    this.menuMusic.stop();
                }
            });

            // Fade out
            this.cameras.main.fade(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainScene');
            });
        });

        // Credits / Copyright
        this.add.text(640, 680, "KOODHACK 2025 - PHASER ENGINE", {
            fontFamily: '"VT323", monospace',
            fontSize: '18px',
            color: '#444444'
        }).setOrigin(0.5);
    }
}
