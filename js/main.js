import { GameState } from './GameState.js';
import { CardManager } from './CardManager.js';
import { StartMenuScene } from './StartMenuScene.js';

class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Load data
        this.load.json('decisions', 'assets/data/decisions.json');

        // Load Images
        this.load.image('bg_intro', 'assets/Images/Intro.png'); // Intro Sequence Background
        this.load.image('intro_bg', 'assets/Images/MayorSpeech.png'); // Card Audio Placeholder
        this.load.image('bg_decision', 'assets/Images/Decision 2.png'); // Card Options Background

        // Outcome Images
        this.load.image('img_win', 'assets/Images/GameWin.png');
        this.load.image('img_riot', 'assets/Images/Riot.png');
        this.load.image('img_assassination', 'assets/Images/Assassinate.png');
        this.load.image('img_resignation', 'assets/Images/Resigns.png');
        this.load.image('img_suicide', 'assets/Images/suicide.png');



        this.load.on('loaderror', (file) => {
            console.error('File failed to load:', file.key, file.src);
        });


        this.load.audio('typing_sfx', 'audio/keyboard-typing-effect-free-393912.mp3');
        this.load.audio('sfx_ui_click', 'audio/arcade-ui-6-229503.mp3');
        this.load.audio('sfx_ui_select', 'audio/select-button-ui-395763.mp3');
        this.load.audio('bgm_menu', 'audio/retro-wave-loop-125-bpm-8963.mp3');

        // --- NEW AUDIO LOADING (DYNAMIC) ---
        // Loading static special options
        this.load.audio('sfx_silence', 'audio/SpeechAudio/Option_Silence.mp3');
        this.load.audio('sfx_wellbeing', 'audio/SpeechAudio/Option_WellBeing.mp3');

        // Loading Game Over / Win
        this.load.audio('sfx_go_suicide', 'audio/SpeechAudio/GameOver_Suicide.mp3');
        this.load.audio('sfx_go_assassination', 'audio/SpeechAudio/GameOver_Assassination.mp3');
        this.load.audio('sfx_go_resignation', 'audio/SpeechAudio/GameOver_Resignation.mp3');
        this.load.audio('sfx_go_riots', 'audio/SpeechAudio/GameOver_Riots.mp3');
        this.load.audio('sfx_win', 'audio/SpeechAudio/GameWin.mp3');

        // Intro Audio
        this.load.audio('sfx_intro_1', 'audio/SpeechAudio/Intro.mp3');
        this.load.audio('sfx_intro_2', 'audio/SpeechAudio/Intro 2.mp3');

        // Loading Card Specific Audio (Card1 to Card12)
        for (let i = 1; i <= 12; i++) {
            const id = `Card${i}`;
            this.load.audio(`${id}_intro`, `audio/SpeechAudio/${id}.mp3`);
            this.load.audio(`${id}_A`, `audio/SpeechAudio/${id}-A.mp3`);
            this.load.audio(`${id}_B`, `audio/SpeechAudio/${id}-B.mp3`);

            // Card 12 has no bridge
            if (i !== 12) {
                this.load.audio(`${id}_Bridge`, `audio/SpeechAudio/${id}-Bridge.mp3`);
            }
        }
    }

    create() {
        this.generatePlaceholders();
        // Go to Start Menu instead of Main Game directly
        this.scene.start('StartMenuScene');
    }

    generatePlaceholders() {
        // 1. Card Background / Art Placeholder
        if (!this.textures.exists('card_bg')) {
            const graphics = this.make.graphics();
            // Retro Look: Dark Blue Fill, White Border
            graphics.fillStyle(0x000066, 1); // Dark Blue
            graphics.fillRect(0, 0, 300, 200);
            graphics.lineStyle(4, 0x33FF00); // Phosphor Green Border
            graphics.strokeRect(0, 0, 300, 200);

            // Draw a quick "Image" icon
            graphics.lineStyle(2, 0x33FF00);
            graphics.beginPath();
            graphics.moveTo(50, 150);
            graphics.lineTo(100, 100);
            graphics.lineTo(150, 130);
            graphics.lineTo(200, 80);
            graphics.lineTo(250, 150);
            graphics.strokePath();

            graphics.generateTexture('card_bg', 300, 200);
        }

        // 2. UI Icons
        const icons = [
            { key: 'icon_funding', color: 0x33FF00, char: '$' },
            { key: 'icon_support', color: 0x33FF00, char: 'U' },
            { key: 'icon_wellbeing', color: 0x33FF00, char: 'H' },
            { key: 'icon_selfesteem', color: 0x33FF00, char: 'E' },
            { key: 'icon_economy', color: 0x33FF00, char: 'G' }
        ];

        icons.forEach(icon => {
            if (!this.textures.exists(icon.key)) {
                // Background
                const g = this.make.graphics();
                // Simple outline icon for retro feel
                g.lineStyle(2, icon.color);
                g.fillStyle(0x000000, 1);
                g.fillCircle(16, 16, 14);
                g.strokeCircle(16, 16, 14);
                g.generateTexture(icon.key, 32, 32);
            }
        });
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        this.gameState = new GameState();
        this.cardManager = new CardManager(this);
        this.decisions = this.cache.json.get('decisions');
        this.currentDecisionIndex = 0;

        // --- LAYER GROUPS ---
        // 1. Game World (Card) - created by CardManager
        // 2. HUD (Top)
        // 3. Modal (Overlay)

        this.createHUD();
        // this.createActionPanel(); // Removed in favor of DOM button

        // --- 4. BIND HTML BUTTON ---
        const manageBtn = document.getElementById('manage-btn');
        if (manageBtn) {
            // Clone to remove old listeners (if scene restarts)
            const newBtn = manageBtn.cloneNode(true);
            manageBtn.parentNode.replaceChild(newBtn, manageBtn);

            newBtn.addEventListener('click', () => {
                this.openSelfEsteemModal();
            });
        }

        this.createHUD();
        this.enableSettingsButton(); // Enable Settings Button Logic

        this.createHUD();
        this.enableSettingsButton(); // Enable Settings Button Logic

        // Start Intro Sequence instead of direct game start
        this.createSubtitles();
        this.playIntroSequence();
    }

    createSubtitles() {
        this.subtitleBg = this.add.rectangle(640, 560, 800, 60, 0x000000, 0.8)
            .setDepth(100)
            .setVisible(false);
        this.subtitleText = this.add.text(640, 560, "", {
            fontFamily: '"VT323", monospace',
            fontSize: '24px',
            color: '#FFFF00',
            align: 'center',
            wordWrap: { width: 780 }
        }).setOrigin(0.5).setDepth(101).setVisible(false);
    }

    playIntroSequence() {
        const introTextContent =
            `You are moments away from the most important speech of your life.
The city is divided. The polls are tied.

Tonight, you must complete the speech that will define your legacy.
Choose your words carefully.
Every sentence has a price.

PREPARING AUDIO FEED...`;

        const introText = this.add.text(240, 360, "", {
            fontFamily: '"VT323", monospace',
            fontSize: '32px',
            color: '#33FF00',
            align: 'left',
            wordWrap: { width: 800 }
        }).setOrigin(0, 0.5);

        // Typewriter Logic
        let length = 0;
        const totalLength = introTextContent.length;

        // Start Typing Sound
        if (this.cache.audio.exists('typing_sfx')) {
            this.typingSound = this.sound.add('typing_sfx', { loop: true, volume: 0.5 });
            this.typingSound.play();
        }

        const timer = this.time.addEvent({
            callback: () => {
                length++;
                introText.setText(introTextContent.substr(0, length));

                if (length >= totalLength) {
                    // Typing Complete
                    timer.remove();
                    if (this.typingSound) {
                        this.typingSound.stop();
                        this.typingSound = null;
                    }

                    // Delay then Fade Out Text
                    this.time.delayedCall(1500, () => {
                        this.tweens.add({
                            targets: introText,
                            alpha: 0,
                            duration: 1000,
                            onComplete: () => {
                                introText.destroy();
                                this.playIntroAudioSequence();
                            }
                        });
                    });
                }
            },
            repeat: totalLength - 1,
            delay: 60
        });

        // Skip on click (optional but good for UX)
        this.input.once('pointerdown', () => {
            if (length < totalLength) {
                timer.remove();
                introText.setText(introTextContent);
                if (this.typingSound) {
                    this.typingSound.stop();
                    this.typingSound = null;
                }
                // Trigger completion logic immediately
                this.time.delayedCall(500, () => {
                    this.tweens.add({
                        targets: introText,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => {
                            introText.destroy();
                            this.playIntroAudioSequence();
                        }
                    });
                });
            }
        });
    }

    playIntroAudioSequence() {
        // Show Placeholder Image
        const placeholder = this.add.image(640, 360, 'bg_intro').setDepth(50);
        // Scale to fit if needed (1280x720)
        placeholder.setDisplaySize(1280, 720);

        // Skip Button
        const skipBtn = this.add.text(1200, 680, "[ SKIP ]", {
            fontFamily: '"VT323", monospace',
            fontSize: '32px',
            color: '#FFFFFF'
        }).setOrigin(1, 1).setDepth(60).setInteractive({ useHandCursor: true });

        // Skip Logic
        skipBtn.once('pointerdown', () => {
            // Stop current sound
            if (this.currentSequenceSound) {
                this.currentSequenceSound.stop();
                this.currentSequenceSound = null;
            }

            placeholder.destroy();
            skipBtn.destroy();
            this.showNextCard();
        });

        // Hover
        skipBtn.on('pointerover', () => skipBtn.setColor('#33FF00'));
        skipBtn.on('pointerout', () => skipBtn.setColor('#FFFFFF'));

        // Play Intro 1 -> Intro 2 -> Game Start
        this.playSequence(['sfx_intro_1', 'sfx_intro_2'], () => {
            // Audio Complete
            if (skipBtn.active) skipBtn.destroy(); // Only if not skipped
            this.tweens.add({
                targets: placeholder,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    placeholder.destroy();
                    this.showNextCard();
                }
            });
        });
    }

    // --- TOP HUD (V3) ---
    createHUD() {
        // No canvas HUD elements needed for V3 - all moved to DOM side panel.
        // We just call updateHUD to set initial values.
        this.updateHUD();
    }

    updateHUD() {
        // Update Side Panel (DOM)

        // 0. Chapter & Counter (V3 Refinement)
        const chapterEl = document.querySelector('.chapter-text');
        if (chapterEl) {
            const current = this.currentDecisionIndex + 1;
            const total = this.decisions.length;
            chapterEl.innerHTML = `THE RISE < br > <span style="color:#FFF; font-size:24px">${current}/${total}</span>`;
        }

        // 1. Support
        const supportEl = document.getElementById('val-support');
        if (supportEl) {
            supportEl.innerText = `${this.gameState.publicSupport}% `;
            supportEl.style.color = this.getColorForValue(this.gameState.publicSupport);
        }

        // 2. Esteem
        const esteemEl = document.getElementById('val-esteem');
        if (esteemEl) {
            esteemEl.innerText = `${this.gameState.selfEsteem}% `;
            esteemEl.style.color = this.getColorForValue(this.gameState.selfEsteem);
        }

        // 3. Funding
        const fundingEl = document.getElementById('val-funding');
        if (fundingEl) {
            fundingEl.innerText = `$${this.gameState.politicalFunding} `;
            // Simple color logic for funding low/high?
            fundingEl.style.color = this.gameState.politicalFunding < 20 ? '#FF0000' : '#FFFFFF';
        }

        // 4. Economy
        const economyEl = document.getElementById('val-economy');
        if (economyEl) {
            economyEl.innerText = `${this.gameState.cityEconomy}% `;
            economyEl.style.color = this.getColorForValue(this.gameState.cityEconomy);
        }
    }

    // --- SETTINGS (V3) ---
    enableSettingsButton() {
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            const newBtn = settingsBtn.cloneNode(true);
            settingsBtn.parentNode.replaceChild(newBtn, settingsBtn);

            newBtn.addEventListener('click', () => {
                this.sound.play('sfx_ui_select');
                this.openSettingsModal();
            });
        }
    }

    getColorForValue(value) {
        if (value >= 80) return '#33FF00'; // Green
        if (value >= 60) return '#FFFF00'; // Yellow
        return '#FF0000'; // Red
    }

    openSettingsModal() {
        if (this.isModalOpen) return;
        this.isModalOpen = true;

        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.9).setInteractive().setDepth(500);
        const modal = this.add.container(640, 360).setDepth(501);

        const bg = this.add.rectangle(0, 0, 400, 300, 0x333333).setStrokeStyle(4, 0xd48e00); // Orange border
        const title = this.add.text(0, -100, "SETTINGS", { fontFamily: '"VT323", monospace', fontSize: '32px', color: '#d48e00' }).setOrigin(0.5);
        modal.add([bg, title]);

        // Restart
        const restartBtn = this.createModalButton(0, -20, "RESTART GAME", 0xd48e00, () => {
            window.location.reload();
        });
        modal.add(restartBtn);

        // Quit (Just close tab or show message for web)
        const quitBtn = this.createModalButton(0, 60, "QUIT", 0xFF0000, () => {
            alert("Thanks for playing!");
        });
        modal.add(quitBtn);

        // Cancel
        const cancelBtn = this.createModalButton(0, 120, "CLOSE", 0xAAAAAA, () => {
            this.closeModal(modal, overlay);
        });
        modal.add(cancelBtn);
    }

    createModalButton(x, y, text, color, callback) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 200, 50, 0x000000).setStrokeStyle(2, color).setInteractive({ useHandCursor: true });
        const label = this.add.text(0, 0, text, { fontFamily: '"VT323", monospace', fontSize: '24px', color: '#FFFFFF' }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setFillStyle(color));
        bg.on('pointerout', () => bg.setFillStyle(0x000000));
        bg.on('pointerdown', callback);

        container.add([bg, label]);
        return container;
    }

    updateProgressBar(barObj, value) {
        const percent = Phaser.Math.Clamp(value, 0, 100) / 100;

        // Width
        this.tweens.add({
            targets: barObj.fill,
            width: barObj.maxWidth * percent,
            duration: 500,
            ease: 'Power2'
        });

        // Color Logic
        // > 80% Green, 60-80% Yellow, < 60% Red
        let color = 0x00FF00; // Green
        if (value < 60) color = 0xFF0000; // Red
        else if (value < 80) color = 0xFFFF00; // Yellow

        barObj.fill.setFillStyle(color);
    }

    // --- ACTION PANEL (Self-Esteem) ---
    // --- ACTION PANEL (Self-Esteem) ---
    // Moved to HTML button logic in create()

    openSelfEsteemModal() {
        if (this.isModalOpen) return;
        this.isModalOpen = true;

        // Overlay
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.9)
            .setInteractive() // Blocks clicks
            .setDepth(200);

        // Modal Container
        const modal = this.add.container(640, 360).setDepth(201);

        // Retro Window
        const bg = this.add.rectangle(0, 0, 600, 450, 0x0000AA).setStrokeStyle(4, 0xFFFFFF); // Blue Background, White Border
        const titleBar = this.add.rectangle(0, -200, 590, 40, 0xFFFFFF);
        const title = this.add.text(0, -200, "MANAGE SELF-ESTEEM", {
            fontFamily: '"VT323", monospace',
            fontSize: '32px',
            color: '#0000AA'
        }).setOrigin(0.5);

        modal.add([bg, titleBar, title]);

        // Actions
        const actions = ['family_time', 'corporate_party', 'therapist'];
        let yOffset = -80;

        actions.forEach(actionKey => {
            const actionData = this.gameState.actions[actionKey];
            const canAfford = this.gameState.canAffordAction(actionKey);

            // Row
            const rowBg = this.add.rectangle(0, yOffset, 500, 60, 0x000000)
                .setStrokeStyle(2, canAfford ? 0x33FF00 : 0x550000)
                .setInteractive({ useHandCursor: canAfford });

            // Text Color
            const textColor = canAfford ? '#33FF00' : '#550000';

            if (canAfford) {
                rowBg.on('pointerover', () => {
                    rowBg.setFillStyle(0x33FF00);
                    label.setColor('#000000');
                    info.setColor('#000000');
                });
                rowBg.on('pointerout', () => {
                    rowBg.setFillStyle(0x000000);
                    label.setColor('#33FF00');
                    info.setColor(textColor);
                });
                rowBg.on('pointerdown', () => {
                    this.gameState.performAction(actionKey);
                    this.updateHUD();
                    this.closeModal(modal, overlay);
                });
            }

            const label = this.add.text(-230, yOffset, actionData.label.toUpperCase(), {
                fontFamily: '"VT323", monospace',
                fontSize: '24px',
                color: textColor
            }).setOrigin(0, 0.5);

            // Cost/Effect Text
            let costTextStr = "";
            if (actionData.cost.politicalFunding) costTextStr += `- $${actionData.cost.politicalFunding} `;
            if (actionData.effect.selfEsteem) costTextStr += `+ ${actionData.effect.selfEsteem} EGO`;

            const info = this.add.text(230, yOffset, costTextStr, {
                fontFamily: '"VT323", monospace',
                fontSize: '24px',
                color: textColor
            }).setOrigin(1, 0.5);

            modal.add([rowBg, label, info]);
            yOffset += 80;
        });

        // Close Button
        const closeBtnBg = this.add.rectangle(0, 180, 140, 40, 0xFF0000).setInteractive({ useHandCursor: true });
        const closeBtnText = this.add.text(0, 180, "EXIT", {
            fontFamily: '"VT323", monospace',
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        closeBtnBg.on('pointerdown', () => this.closeModal(modal, overlay));
        modal.add([closeBtnBg, closeBtnText]);

        // Animation
        modal.setScale(0.8);
        this.tweens.add({
            targets: modal,
            scale: 1,
            duration: 200,
            ease: 'Back.out'
        });
    }

    closeModal(modal, overlay) {
        this.tweens.add({
            targets: modal,
            scale: 0.8,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                modal.destroy();
                overlay.destroy();
                this.isModalOpen = false;
            }
        });
    }

    // --- GAME LOOP ---
    showNextCard() {
        // Ensure HUD is fresh (updates counter to current index)
        this.updateHUD();

        // Check Victory (End of Card 12)
        if (this.currentDecisionIndex >= this.decisions.length || this.currentDecisionIndex >= 12) {
            this.triggerGameOver("VICTORY: Re-elected!", 'sfx_win', true, 'img_win');
            return;
        }

        // FAIL STATE CHECKS
        const fail = this.checkFailStates();
        if (fail) {
            this.triggerGameOver(fail.txt, fail.sfx, false, fail.img);
            return;
        }

        const decision = this.decisions[this.currentDecisionIndex];

        // 1. Play Intro Audio with Placeholder
        const prefix = decision.id.toString().startsWith('Card') ? '' : 'Card';
        const introKey = `${prefix}${decision.id}_intro`;
        const introTranscript = decision.introTranscript || "";

        this.playAudioWithPlaceholder([{ key: introKey, text: introTranscript }], () => {
            // 2. Show Card UI after audio finishes
            this.cardManager.showCard(decision, this.decisions.length, this.currentDecisionIndex, {
                onOption: (selectedOption, index) => this.handleOptionSelection(selectedOption, decision.id, index),
                onStayQuiet: () => this.handleStayQuiet(decision.id),
                onManage: () => this.openSelfEsteemModal(true, decision.id)
            });
        });
    }

    handleStayQuiet(cardId) {
        // Play Silence then Bridge
        const prefix = cardId.toString().startsWith('Card') ? '' : 'Card';

        // Find decision to get bridge text
        // Note: cardId might be string "1", so we compare loosely or find by id
        const decision = this.decisions.find(d => d.id == cardId) || this.decisions[this.currentDecisionIndex];
        const bridgeTranscript = (decision && decision.options && decision.options[0]) ? decision.options[0].bridgeTranscript : "";

        this.playAudioWithPlaceholder([
            { key: 'sfx_silence', text: "" },
            { key: `${prefix}${cardId}_Bridge`, text: bridgeTranscript }
        ], () => {
            this.currentDecisionIndex++;
            this.showNextCard();
        });
    }

    // Updated to handle "Consumes Turn" logic
    openSelfEsteemModal(consumesTurn = false, cardId = null) {
        if (this.isModalOpen) return;
        this.isModalOpen = true;

        // Overlay
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.9).setInteractive().setDepth(200);

        // Modal Container
        const modal = this.add.container(640, 360).setDepth(201);

        // ... (Retro Window BG code same as before) ...
        const bg = this.add.rectangle(0, 0, 600, 450, 0x0000AA).setStrokeStyle(4, 0xFFFFFF);
        const title = this.add.text(0, -200, "MANAGE SELF-ESTEEM", { fontFamily: '"VT323", monospace', fontSize: '32px', color: '#FFFFFF' }).setOrigin(0.5);
        modal.add([bg, title]);

        const actions = ['family_time', 'corporate_party', 'therapist'];
        let yOffset = -80;

        actions.forEach(actionKey => {
            const actionData = this.gameState.actions[actionKey];
            const canAfford = this.gameState.canAffordAction(actionKey);

            // ... (Button creation same as before) ...
            const rowBg = this.add.rectangle(0, yOffset, 500, 60, 0x000000).setStrokeStyle(2, canAfford ? 0x33FF00 : 0x550000).setInteractive({ useHandCursor: canAfford });
            const textColor = canAfford ? '#33FF00' : '#550000';

            if (canAfford) {
                rowBg.on('pointerover', () => { rowBg.setFillStyle(0x33FF00); label.setColor('#000000'); info.setColor('#000000'); });
                rowBg.on('pointerout', () => { rowBg.setFillStyle(0x000000); label.setColor('#33FF00'); info.setColor(textColor); });
                rowBg.on('pointerdown', () => {
                    this.gameState.performAction(actionKey);
                    this.updateHUD();

                    // Close Modal
                    this.closeModal(modal, overlay);

                    if (consumesTurn) {
                        // If opened from card, this counts as the turn.
                        // Destroy card and move next.
                        this.cardManager.destroy();

                        // Play WellBeing sound
                        const prefix = cardId.toString().startsWith('Card') ? '' : 'Card';

                        const decision = this.decisions.find(d => d.id == cardId);
                        const bridgeTranscript = (decision && decision.options && decision.options[0]) ? decision.options[0].bridgeTranscript : "";

                        this.playAudioWithPlaceholder([
                            { key: 'sfx_wellbeing', text: "" },
                            { key: `${prefix}${cardId}_Bridge`, text: bridgeTranscript }
                        ], () => {
                            this.currentDecisionIndex++;
                            this.showNextCard();
                        });
                    }
                });
            }

            const label = this.add.text(-230, yOffset, actionData.label.toUpperCase(), { fontFamily: '"VT323", monospace', fontSize: '24px', color: textColor }).setOrigin(0, 0.5);

            // Cost text
            let costTextStr = "";
            if (actionData.cost.politicalFunding) costTextStr += `- $${actionData.cost.politicalFunding} `;
            if (actionData.effect.selfEsteem) costTextStr += `+ ${actionData.effect.selfEsteem} EGO`;

            const info = this.add.text(230, yOffset, costTextStr, { fontFamily: '"VT323", monospace', fontSize: '24px', color: textColor }).setOrigin(1, 0.5);
            modal.add([rowBg, label, info]);
            yOffset += 80;
        });

        // Close/Cancel Button
        const closeBtnBg = this.add.rectangle(0, 180, 140, 40, 0xFF0000).setInteractive({ useHandCursor: true });
        const closeBtnText = this.add.text(0, 180, "CANCEL", { fontFamily: '"VT323", monospace', fontSize: '24px', color: '#FFFFFF' }).setOrigin(0.5);

        closeBtnBg.on('pointerdown', () => {
            this.closeModal(modal, overlay);
            // If canceled, user is just back at the card (consumesTurn is ignored)
        });
        modal.add([closeBtnBg, closeBtnText]);

        modal.setScale(0.8);
        this.tweens.add({ targets: modal, scale: 1, duration: 200, ease: 'Back.out' });
    }

    // Updated handleOptionSelection to take 3 args (option, cardId, optionIndex)
    // However, CardManager calls it with 2 args: option, index. We need to patch CardManager or pass logic.
    // Let's rely on logic update in showNextCard: (selectedOption, index) => this.handleOptionSelection(selectedOption, decision.id, index)

    handleOptionSelection(option, cardId, optIndex) {
        // Apply effects
        if (option && option.effects) {
            this.gameState.applyEffects(option.effects);
            this.showFloatingFeedback(option.effects);
        }

        this.updateHUD();

        // Sound Logic: CardID-A or CardID-B
        // optIndex 0 = A, 1 = B
        const prefix = cardId.toString().startsWith('Card') ? '' : 'Card';
        const suffix = (optIndex === 0) ? '_A' : '_B';
        const resultKey = `${prefix}${cardId}${suffix}`;
        const bridgeKey = `${prefix}${cardId}_Bridge`;

        const resultTranscript = option.resultTranscript || "";
        const bridgeTranscript = option.bridgeTranscript || "";

        this.playAudioWithPlaceholder([
            { key: resultKey, text: resultTranscript },
            { key: bridgeKey, text: bridgeTranscript }
        ], () => {
            this.currentDecisionIndex++;
            this.showNextCard();
        });
    }

    playSequence(items, onComplete) {
        if (items.length === 0) {
            this.subtitleBg.setVisible(false);
            this.subtitleText.setVisible(false);
            if (onComplete) onComplete();
            return;
        }

        const item = items.shift();
        const key = (typeof item === 'string') ? item : item.key;
        const text = (typeof item === 'string') ? "" : item.text;

        // Display Subtitle
        if (text) {
            this.subtitleBg.setVisible(true);
            this.subtitleText.setVisible(true).setText(text.toUpperCase());
        } else {
            this.subtitleBg.setVisible(false);
            this.subtitleText.setVisible(false);
        }

        if (this.cache.audio.exists(key)) {
            const sound = this.sound.add(key);
            this.currentSequenceSound = sound; // Track for skipping
            sound.once('complete', () => {
                this.currentSequenceSound = null;
                this.playSequence(items, onComplete);
            });
            sound.play();
        } else {
            console.warn("Audio missing:", key);
            this.time.delayedCall(500, () => this.playSequence(items, onComplete));
        }
    }

    playAudioWithPlaceholder(keys, onComplete) {
        // Show Placeholder (MayorSpeech.png)
        const placeholder = this.add.image(640, 360, 'intro_bg').setDepth(50);
        placeholder.setDisplaySize(1280, 720);

        // Skip Button
        const skipBtn = this.add.text(1200, 680, "[ SKIP ]", {
            fontFamily: '"VT323", monospace',
            fontSize: '32px',
            color: '#FFFFFF'
        }).setOrigin(1, 1).setDepth(60).setInteractive({ useHandCursor: true });

        // Hover
        skipBtn.on('pointerover', () => skipBtn.setColor('#33FF00'));
        skipBtn.on('pointerout', () => skipBtn.setColor('#FFFFFF'));

        // Skip Logic
        skipBtn.once('pointerdown', () => {
            // Stop current sound to break recursion mechanism if waiting for 'complete'
            if (this.currentSequenceSound) {
                this.currentSequenceSound.stop();
                this.currentSequenceSound = null;
            }

            // Empty the keys array so no more items are processed
            keys.length = 0;

            // Hide Subtitles
            if (this.subtitleBg) this.subtitleBg.setVisible(false);
            if (this.subtitleText) this.subtitleText.setVisible(false);

            // Cleanup
            if (skipBtn.active) skipBtn.destroy();
            if (placeholder.active) placeholder.destroy();

            // Proceed
            if (onComplete) onComplete();
        });

        this.playSequence(keys, () => {
            // Audio Complete
            if (skipBtn.active) skipBtn.destroy();
            placeholder.destroy();
            if (onComplete) onComplete();
        });
    }

    checkFailStates() {
        if (this.gameState.selfEsteem <= 0) return { txt: "GAME OVER: Suicide on stage.", sfx: 'sfx_go_suicide', img: 'img_suicide' };
        if (this.gameState.politicalFunding <= 0) return { txt: "GAME OVER: Assassinated by unpaid donors.", sfx: 'sfx_go_assassination', img: 'img_assassination' };
        if (this.gameState.cityEconomy <= 0) return { txt: "GAME OVER: Resigned due to bankruptcy.", sfx: 'sfx_go_resignation', img: 'img_resignation' };
        if (this.gameState.publicSupport <= 0) return { txt: "GAME OVER: Chased out by riots.", sfx: 'sfx_go_riots', img: 'img_riot' };
        return null;
    }

    triggerGameOver(text, sfx, isWin = false, imgKey = null) {
        this.cardManager.destroy(); // Hide current card

        // Play Sound
        if (this.cache.audio.exists(sfx)) {
            this.sound.play(sfx);
        }

        // Show Outcome Image if available
        if (imgKey && this.textures.exists(imgKey)) {
            this.add.image(640, 360, imgKey).setDisplaySize(1280, 720).setDepth(400);
        } else {
            // Fallback Overlay if no image
            const color = isWin ? '#33FF00' : '#FF0000';
            this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.95).setDepth(400);
        }

        // Text (Overlay on top of image)
        // Ensure text is readable - maybe add a semi-transparent box behind text if using image
        const textColor = isWin ? '#33FF00' : '#FF0000';

        // Background for text readability
        this.add.rectangle(640, 360, 1000, 150, 0x000000, 0.7).setDepth(400);

        this.add.text(640, 360, text.toUpperCase(), {
            fontFamily: '"VT323", monospace', fontSize: '64px', color: textColor, align: 'center', wordWrap: { width: 1000 }
        }).setOrigin(0.5).setDepth(401);

        // Add Buttons (Restart / Exit)
        // Restart
        const restartBtn = this.createModalButton(640, 500, "RESTART", 0xd48e00, () => {
            window.location.reload();
        });
        restartBtn.setDepth(402);

        // Exit (Only if Win)
        if (isWin) {
            const exitBtn = this.createModalButton(640, 580, "EXIT", 0xAAAAAA, () => {
                if (this.currentIntroSound) this.currentIntroSound.stop();
                if (this.currentSequenceSound) this.currentSequenceSound.stop();
                this.sound.stopAll();
                this.scene.start('StartMenuScene');
            });
            exitBtn.setDepth(402);
        }
    }

    showFloatingFeedback(effects) {
        let delay = 0;
        if (!effects) return; // Safety check

        for (const [key, value] of Object.entries(effects)) {
            if (value === 0) continue;

            const text = value > 0 ? `+ ${value} ${key} ` : `${value} ${key} `;
            const color = value > 0 ? '#33FF00' : '#FF0000';

            // Determine Position based on V2 UI Layout
            let xPos = 640;
            let yPos = 360;

            if (key === 'publicSupport') {
                xPos = 200; yPos = 80;
            } else if (key === 'selfEsteem') {
                xPos = 200; yPos = 120;
            } else if (key === 'politicalFunding' || key === 'cityEconomy') {
                xPos = 1100; yPos = 400; // General area near side panel
            }

            const floatingText = this.add.text(xPos, yPos, text.toUpperCase(), {
                fontFamily: '"VT323", monospace',
                fontSize: '32px',
                color: color,
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5, 0.5).setDepth(300);

            this.tweens.add({
                targets: floatingText,
                y: yPos - 50,
                alpha: 0,
                duration: 1500,
                delay: delay,
                onComplete: () => floatingText.destroy()
            });

            delay += 200;
        }
    }
}

const config = {
    type: Phaser.AUTO,
    title: 'The Politician',
    banner: false,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000', // Black for CRT
    scene: [PreloadScene, StartMenuScene, MainScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
