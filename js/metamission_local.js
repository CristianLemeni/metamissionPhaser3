
const spiderTank = {

    preload() {
        this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);
        this.load.atlas('spaceships', './assets/spaceships.png', './assets/spaceships.json')
        this.load.atlas('engines', './assets/engines.png', './assets/engines.json')
        this.load.atlas('guns', './assets/guns.png', './assets/guns.json')
        this.load.atlas('planets', './assets/planets.png', './assets/planets.json')
        this.load.atlas('missiles', './assets/missiles.png', './assets/missiles.json')
        this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
        this.load.atlas('menuAssets', './assets/menuAssets.png', './assets/menuAssets.json')
        this.load.image('shootBtn', './assets/shootBtn.png')
        this.load.image('star', './assets/star.png')
        this.load.image('fullscreenBtn', './assets/fullscreenBtn.png')
        this.load.spritesheet("shield", "./assets/shield.png", { frameWidth: 170, frameHeight: 170 });
        this.load.spritesheet("shield2", "./assets/shield2.png", { frameWidth: 160, frameHeight: 160 });
        this.load.spritesheet("shield3", "./assets/shield3.png", { frameWidth: 160, frameHeight: 160 });
        this.load.spritesheet('lightning', './assets/lightning.png', { frameWidth: 85, frameHeight: 85 })
        this.load.audio('bkMusic', ['./assets/sounds/bkMusic.wav'])
        this.load.audio('laserSmall', ['./assets/sounds/laserSFX.wav'])
        this.load.audio('laserBig', ['./assets/sounds/bigLaser.wav'])
        this.load.audio('shieldHit', ['./assets/sounds/shieldHit.wav'])
        this.load.audio('explosion', ['./assets/sounds/explode.wav'])
        this.load.audio('laserBig2', ['./assets/sounds/bigLaser2.wav'])


    },

    create() {

        const rootObj = this;
        rootObj.shipAtlas = rootObj.textures.get('spaceships');
        rootObj.shipFrames = rootObj.shipAtlas.getFrameNames();
        rootObj.shipEnginesAtlas = rootObj.textures.get('engines');
        rootObj.shipEnginesFrames = rootObj.shipEnginesAtlas.getFrameNames();
        rootObj.shipGunsAtlas = rootObj.textures.get('guns');
        rootObj.shipGunsFrames = rootObj.shipGunsAtlas.getFrameNames();
        rootObj.missilesAtlas = rootObj.textures.get('missiles');
        rootObj.missilesFrames = rootObj.missilesAtlas.getFrameNames();

        rootObj.anims.create({
            key: "shield",
            frameRate: 10,
            frames: rootObj.anims.generateFrameNumbers("shield", { start: 0, end: 10 }),
            repeat: -1
        });

        rootObj.anims.create({
            key: "shield2",
            frameRate: 15,
            frames: rootObj.anims.generateFrameNumbers("shield2", { start: 0, end: 11 }),
            repeat: -1
        });

        rootObj.anims.create({
            key: "shield3",
            frameRate: 15,
            frames: rootObj.anims.generateFrameNumbers("shield3", { start: 0, end: 11 }),
            repeat: -1
        });

        rootObj.anims.create({
            key: "lightning",
            frameRate: 15,
            frames: rootObj.anims.generateFrameNumbers("lightning", { start: 0, end: 17 }),
            repeat: -1
        });

        rootObj.anims.create({
            key: 'explosion',
            frames: rootObj.anims.generateFrameNames('explosion'),
            frameRate: 30
        });

        rootObj.bkMusic = rootObj.sound.add('bkMusic', { volume: 0.25 });
        rootObj.bkMusic.play({ loop: true })
        rootObj.explosionAudio = this.sound.add('explosion');
        rootObj.shieldHit = this.sound.add('shieldHit');
        rootObj.laserSmall = this.sound.add('laserSmall');
        rootObj.laserBig = this.sound.add('laserBig');
        rootObj.laserBig2 = this.sound.add('laserBig2');


        rootObj.emitter = new Phaser.Events.EventEmitter();

        rootObj.horizontalVelocity = 0
        rootObj.verticalVelocity = 0
        rootObj.speed = 350
        rootObj.soundOn = 1
        rootObj.playerContainer = rootObj.add.container()
        rootObj.playerContainer.health = 10
        rootObj.enemies = []
        rootObj.target = new Phaser.Math.Vector2();
        rootObj.physics.world.enableBody(rootObj.playerContainer);

        rootObj.waveNumber = 0
        rootObj.playerWeaponLoaded = true

        rootObj.battleshipHealth = 15 + rootObj.waveNumber * 3
        rootObj.droneHealth = 3 + rootObj.waveNumber * 3
        rootObj.strikerHealth = 0 + rootObj.waveNumber * 3
        rootObj.tankerHealth = 10 + rootObj.waveNumber * 3

        rootObj.mainMenu = rootObj.add.container()
        rootObj.endGameMenu = rootObj.add.container()



        rootObj.aGrid = new AlignGrid({ scene: rootObj, rows: 7, cols: 13 })

        addBackground()
        addPlayer()
        addKeyboardControls()
        rootObj.children.bringToTop(rootObj.playerContainer);
        rootObj.input.addPointer(1)
        rootObj.joyStick = rootObj.plugins.get('rexvirtualjoystickplugin').add(rootObj, {
            x: rootObj.cameras.main.worldView.x + rootObj.cameras.main.width / 2,
            y: rootObj.cameras.main.worldView.y + rootObj.cameras.main.height * 0.85,
            radius: 25,
            base: rootObj.add.circle(0, 0, 25, 0x888888),
            thumb: rootObj.add.circle(0, 0, 12, 0xcccccc),
        }).on('update', joystickFunction, rootObj);
        rootObj.joyStick.setVisible(false);

        dynamicJoystick()

        rootObj.emitter.on("spawnBattleship", (positionIndex) => {
            let battleship = addBattleship(positionIndex)
            addEnemyShipMovement(battleship)
        })

        rootObj.emitter.on("spawnTanker", (positionIndex) => {
            let tanker = addTanker(positionIndex)
            addEnemyShipMovement(tanker)
        })

        rootObj.emitter.on("spawnStriker", (positionIndex) => {
            let striker = addStriker(positionIndex)
            addEnemyShipMovement(striker)
            rootObj.time.delayedCall(1, () => {
                striker.charge()
            })
        })

        rootObj.emitter.on('enemyShoot', () => {
            for (let i = 0; i < rootObj.enemies.length; i++) {
                rootObj.enemies[i].shoot()
            }
        }, this);

        //to be replaced with socket logic
        //each wave will spawn two rows of Drone enemies(small ships)
        //Each third wave a Tanker enemy will appear(medium ship)
        //Each fifth wave a Battleship will appear(large ship)
        //Each wave is currently triggered when you defeat all the enemies
        //each wave will also increase the health of all enemies by 1
        rootObj.emitter.on('newWave', () => {
            addEnemyRow(16, 4, 1)
            rootObj.time.delayedCall(3000, () => {
                addEnemyRow(29, 4, 1)
            })
            if (rootObj.waveNumber % 3 == 0 && rootObj.waveNumber != 0) {
                rootObj.emitter.emit("spawnTanker", 45)
            }
            if (rootObj.waveNumber % 5 == 0 && rootObj.waveNumber != 0) {
                rootObj.emitter.emit("spawnBattleship", 32)
            }
        }, this);

        //this timer triggers all enemies to shoot
        rootObj.timer = rootObj.time.addEvent({
            delay: 6000,// ms
            callback: () => {
                rootObj.emitter.emit('enemyShoot');
            },
            //args: [],
            // callbackScope: thisArg,
            loop: true
        });

        createMenu()
        addUI()
        addScoreCounter()

        rootObj.shootBtn = rootObj.physics.add.sprite(rootObj.cameras.main.worldView.x + rootObj.cameras.main.width / 1.25, rootObj.cameras.main.worldView.y + rootObj.cameras.main.height * 0.85, 'shootBtn')
        Align.scaleToGameW(rootObj.shootBtn, 0.1)
        rootObj.shootBtn.setInteractive()

        rootObj.shootBtn.on('pointerdown', function (event) {
            if (rootObj.playerWeaponLoaded) {
                rootObj.playerContainer.shoot()
            }
            rootObj.playerWeaponLoaded = false
        });
        rootObj.shootBtn.on('pointerup', () => {
            rootObj.playerWeaponLoaded = true
        })
        function addBackground() {
            for (let i = 0; i < getRandomInt(100, 1000); i++) {
                let star = rootObj.physics.add.sprite(getRandomInt(0, rootObj.cameras.main.worldView.width), getRandomInt(0, rootObj.cameras.main.worldView.height), 'star');
                star.alpha = 0
                star.setScale(Math.random() * (0.25 - 0.1) + 0.1)
                rootObj.tweens.add({
                    targets: star,
                    alpha: { value: 1, duration: getRandomInt(2500, 5000), ease: 'Power1' },
                    yoyo: true,
                    loop: -1
                });
            }

            let atlasTexture = rootObj.textures.get('planets');
            let frames = atlasTexture.getFrameNames();
            rootObj.physics.add.sprite(getRandomInt(0, rootObj.cameras.main.worldView.width), getRandomInt(0, rootObj.cameras.main.worldView.height), 'planets', frames[getRandomInt(0, 6)]);
        }

        function addPlayer() {
            let playerShip = rootObj.physics.add.sprite(0, 0, 'spaceships', rootObj.shipFrames[4])
            Align.scaleToGameW(playerShip, 0.05)
            let playerShipEngine = rootObj.physics.add.sprite(0, 0, 'engines', rootObj.shipEnginesFrames[2])
            Align.scaleToGameW(playerShipEngine, 0.025)
            let playerShipGun = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[1])
            Align.scaleToGameW(playerShipGun, 0.01)

            let playerShield = rootObj.physics.add.sprite(0, 0, 'shield2')
            Align.scaleToGameW(playerShield, 0.11)
            playerShield.play('shield2')

            rootObj.playerContainer.add(playerShipGun)
            rootObj.playerContainer.add(playerShipEngine)
            rootObj.playerContainer.add(playerShip)
            rootObj.playerContainer.add(playerShield)

            playerShipEngine.y += playerShip.displayHeight / 1.5
            playerShipGun.y -= playerShip.displayHeight / 2

            rootObj.playerContainer.tween = rootObj.tweens.add({
                targets: playerShipEngine,
                y: { value: playerShipEngine.y + 10, duration: 10, ease: 'Power1' },
                yoyo: true,
                loop: -1
            });

            rootObj.playerContainer.shoot = () => {
                rootObj.laserBig.play({ volume: 0.15 })
                shootProjectile(rootObj.playerContainer.list[0].x + rootObj.playerContainer.x,
                    rootObj.playerContainer.list[0].y + rootObj.playerContainer.y,
                    9, 500, true, -1, true, 0.035, 0)
            }


            rootObj.aGrid.placeAtIndex(71, rootObj.playerContainer)
        }

        function addDrone(index) {
            let enemyContainer = rootObj.add.container()
            let enemyShip = rootObj.physics.add.sprite(0, 0, 'spaceships', rootObj.shipFrames[2])
            enemyShip.flipY = true
            Align.scaleToGameW(enemyShip, 0.025)
            let enemyShipShipEngine = rootObj.physics.add.sprite(0, 0, 'engines', rootObj.shipEnginesFrames[3])
            enemyShipShipEngine.flipY = true
            Align.scaleToGameW(enemyShipShipEngine, 0.025)
            let enemyShipShipGun1 = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[2])
            enemyShipShipGun1.flipY = true
            Align.scaleToGameW(enemyShipShipGun1, 0.0075)
            let enemyShipShipGun2 = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[2])
            enemyShipShipGun2.flipY = true
            enemyShipShipGun2.flipX = true
            Align.scaleToGameW(enemyShipShipGun2, 0.0075)

            let enemyShield = rootObj.physics.add.sprite(0, 0, 'shield')
            enemyShield.setAlpha(0.5)
            Align.scaleToGameW(enemyShield, 0.05)
            enemyShield.play('shield')

            enemyShipShipEngine.y -= enemyShip.displayHeight / 1.1
            enemyShipShipEngine.x += enemyShip.displayWidth * 0.03
            enemyShipShipGun1.x -= enemyShip.displayWidth / 2
            enemyShipShipGun2.x += enemyShip.displayWidth / 2

            enemyContainer.add(enemyShipShipEngine)
            enemyContainer.add(enemyShipShipGun1)
            enemyContainer.add(enemyShipShipGun2)
            enemyContainer.add(enemyShip)
            enemyContainer.add(enemyShield)

            rootObj.playerContainer.tween = rootObj.tweens.add({
                targets: enemyShipShipEngine,
                y: { value: enemyShipShipEngine.y + 5, duration: 50, ease: 'Power1' },
                yoyo: true,
                loop: -1
            });

            enemyContainer.shoot = () => {
                rootObj.laserSmall.play({ volume: 0.25 })
                shootProjectile(enemyContainer.list[1].x + enemyContainer.x,
                    enemyContainer.list[1].y + enemyContainer.y * 1.25, 5,
                    500, false, 1, true, 0.035, 4.71239, true)
                shootProjectile(enemyContainer.list[2].x + enemyContainer.x,
                    enemyContainer.list[2].y + enemyContainer.y * 1.25, 5,
                    500, false, 1, true, 0.035, 4.71239, true)
            }


            enemyShip.health = rootObj.droneHealth

            rootObj.aGrid.placeAtIndex(index, enemyContainer)

            return enemyContainer
        }

        function addTanker(index) {
            let enemyContainer = rootObj.add.container()
            let enemyShip = rootObj.physics.add.sprite(0, 0, 'spaceships', rootObj.shipFrames[5])
            enemyShip.flipY = true
            Align.scaleToGameW(enemyShip, 0.05)
            let enemyShipShipEngine = rootObj.physics.add.sprite(0, 0, 'engines', rootObj.shipEnginesFrames[2])
            enemyShipShipEngine.flipY = true
            Align.scaleToGameW(enemyShipShipEngine, 0.025)
            let enemyShipShipGun1 = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[3])
            enemyShipShipGun1.flipY = true
            Align.scaleToGameW(enemyShipShipGun1, 0.0075)
            let enemyShipShipGun2 = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[3])
            enemyShipShipGun2.flipY = true
            enemyShipShipGun2.flipX = true
            Align.scaleToGameW(enemyShipShipGun2, 0.0075)
            let enemyShipShipGun3 = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[5])
            enemyShipShipGun3.flipY = true
            Align.scaleToGameW(enemyShipShipGun3, 0.015)

            enemyShipShipEngine.y -= enemyShip.displayHeight / 1.5
            enemyShipShipGun1.x -= enemyShip.displayWidth / 2
            enemyShipShipGun2.x += enemyShip.displayWidth / 2
            enemyShipShipGun3.y += enemyShip.displayHeight / 2

            let enemyShield = rootObj.physics.add.sprite(0, 0, 'shield')
            enemyShield.setAlpha(0.5)
            Align.scaleToGameW(enemyShield, 0.1)
            enemyShield.play('shield')


            enemyContainer.add(enemyShipShipEngine)
            enemyContainer.add(enemyShipShipGun3)
            enemyContainer.add(enemyShipShipGun1)
            enemyContainer.add(enemyShipShipGun2)
            enemyContainer.add(enemyShip)
            enemyContainer.add(enemyShield)

            rootObj.aGrid.placeAtIndex(index, enemyContainer)

            enemyContainer.shoot = () => {
                rootObj.laserSmall.play({ volume: 0.35 })
                rootObj.laserBig.play({ volume: 0.35 })
                shootProjectile(enemyContainer.list[3].x + enemyContainer.x,
                    enemyContainer.list[3].y + enemyContainer.y, 3,
                    500, false, 1, true, 0.015, 1.5708)
                shootProjectile(enemyContainer.list[2].x + enemyContainer.x,
                    enemyContainer.list[2].y + enemyContainer.y, 3,
                    500, false, 1, true, 0.015, 1.5708)
                shootProjectile(enemyContainer.list[1].x + enemyContainer.x,
                    enemyContainer.list[1].y + enemyContainer.y * 1.05, 0,
                    500, false, 1, true, 0.035, 0)
            }

            rootObj.playerContainer.tween = rootObj.tweens.add({
                targets: enemyShipShipEngine,
                y: { value: enemyShipShipEngine.y + 5, duration: 50, ease: 'Power1' },
                yoyo: true,
                loop: -1
            });

            enemyShip.health = rootObj.tankerHealth

            return enemyContainer
        }

        function addStriker(index) {
            let enemyContainer = rootObj.add.container()
            let enemyShip = rootObj.physics.add.sprite(0, 0, 'spaceships', rootObj.shipFrames[1])
            enemyShip.flipY = true
            Align.scaleToGameW(enemyShip, 0.03)
            let enemyShipShipEngine = rootObj.physics.add.sprite(0, 0, 'engines', rootObj.shipEnginesFrames[1])
            enemyShipShipEngine.flipY = true
            Align.scaleToGameW(enemyShipShipEngine, 0.015)
            let enemyShipEffect = rootObj.physics.add.sprite(0, 0, 'lightning')
            enemyShipEffect.play('lightning')
            enemyShipEffect.flipY = true
            Align.scaleToGameW(enemyShipEffect, 0.05)

            enemyShipShipEngine.y -= enemyShip.displayHeight / 1.5

            enemyContainer.add(enemyShipShipEngine)
            enemyContainer.add(enemyShip)
            enemyContainer.add(enemyShipEffect)

            enemyContainer.charge = () => {
                const angle = Phaser.Math.RAD_TO_DEG * Phaser.Math.Angle.Between(enemyContainer.x, enemyContainer.y, rootObj.playerContainer.x, rootObj.playerContainer.y);
                enemyContainer.setAngle(angle - 90);

                rootObj.physics.add.overlap(rootObj.playerContainer.list[rootObj.playerContainer.list.length - 2], enemyShip, (evt) => {
                    playerTakeDamage()
                    explode(rootObj.playerContainer.x, rootObj.playerContainer.y)
                    removeItemOnce(rootObj.enemies, enemyContainer)
                    enemyContainer.destroy()
                }, null, this);

                rootObj.tweens.add({
                    targets: enemyContainer,
                    y: rootObj.playerContainer.y + rootObj.playerContainer.height,
                    x: rootObj.playerContainer.x,
                    duration: 2000,
                    onComplete: () => {
                        removeItemOnce(rootObj.enemies, enemyContainer)
                        enemyContainer.destroy()
                    }
                })
            }

            enemyContainer.shoot = () => {

            }

            enemyShip.health = rootObj.strikerHealth
            rootObj.aGrid.placeAtIndex(index, enemyContainer)

            return enemyContainer
        }

        function addBattleship(index) {
            let enemyContainer = rootObj.add.container()
            let enemyShip = rootObj.physics.add.sprite(0, 0, 'spaceships', rootObj.shipFrames[6])
            enemyShip.flipY = true
            Align.scaleToGameW(enemyShip, 0.1)
            let enemyShipShipEngine = rootObj.physics.add.sprite(0, 0, 'engines', rootObj.shipEnginesFrames[5])
            enemyShipShipEngine.flipY = true
            Align.scaleToGameW(enemyShipShipEngine, 0.035)
            let enemyShipShipGun1 = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[2])
            enemyShipShipGun1.flipY = true
            Align.scaleToGameW(enemyShipShipGun1, 0.0075)
            let enemyShipShipGun2 = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[2])
            enemyShipShipGun2.flipY = true
            enemyShipShipGun2.flipX = true
            Align.scaleToGameW(enemyShipShipGun2, 0.0075)
            let enemyShipShipGun3 = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[4])
            enemyShipShipGun3.flipY = true
            Align.scaleToGameW(enemyShipShipGun3, 0.0075)
            let enemyShipShipGun4 = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[4])
            enemyShipShipGun4.flipY = true
            enemyShipShipGun4.flipX = true
            Align.scaleToGameW(enemyShipShipGun4, 0.0075)

            let enemyShipShipGun5 = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[1])
            enemyShipShipGun5.flipY = true
            Align.scaleToGameW(enemyShipShipGun5, 0.015)

            let enemyShield = rootObj.physics.add.sprite(0, 0, 'shield3')
            enemyShield.setAlpha(0.5)
            Align.scaleToGameW(enemyShield, 0.25)
            enemyShield.play('shield3')

            enemyShipShipEngine.y -= enemyShip.displayHeight

            enemyShipShipGun1.x -= enemyShip.displayWidth / 2.25
            enemyShipShipGun2.x += enemyShip.displayWidth / 2.25
            enemyShipShipGun1.y -= enemyShip.displayWidth / 7.5
            enemyShipShipGun2.y -= enemyShip.displayWidth / 7.5

            enemyShipShipGun3.x -= enemyShip.displayWidth / 7
            enemyShipShipGun4.x += enemyShip.displayWidth / 7
            enemyShipShipGun3.y += enemyShip.displayWidth / 2.15
            enemyShipShipGun4.y += enemyShip.displayWidth / 2.15

            enemyShipShipGun5.y += enemyShip.displayWidth / 2

            enemyContainer.add(enemyShipShipEngine)
            enemyContainer.add(enemyShipShipGun1)
            enemyContainer.add(enemyShipShipGun2)
            enemyContainer.add(enemyShipShipGun3)
            enemyContainer.add(enemyShipShipGun4)
            enemyContainer.add(enemyShipShipGun5)
            enemyContainer.add(enemyShip)
            enemyContainer.add(enemyShield)


            rootObj.aGrid.placeAtIndex(index, enemyContainer)

            enemyContainer.shoot = () => {
                rootObj.laserBig2.play({ volume: 0.35 })
                rootObj.laserSmall.play({ volume: 0.35 })
                rootObj.laserBig.play({ volume: 0.35 })
                shootProjectile(enemyContainer.list[1].x + enemyContainer.x,
                    enemyContainer.list[1].y + enemyContainer.y * 1.05, 1,
                    500, false, 1, true, 0.015, 0)
                shootProjectile(enemyContainer.list[2].x + enemyContainer.x,
                    enemyContainer.list[2].y + enemyContainer.y * 1.05, 1,
                    500, false, 1, true, 0.015, 0)
                shootProjectile(enemyContainer.list[3].x + enemyContainer.x,
                    enemyContainer.list[3].y + enemyContainer.y * 1.05, 3,
                    500, false, 1, true, 0.015, 1.5708)
                shootProjectile(enemyContainer.list[4].x + enemyContainer.x,
                    enemyContainer.list[4].y + enemyContainer.y * 1.05, 3,
                    500, false, 1, true, 0.015, 1.5708)
                shootProjectile(enemyContainer.list[5].x + enemyContainer.x,
                    enemyContainer.list[5].y + enemyContainer.y * 1.2, 2,
                    500, false, 1, true, 0.035, 0)
            }

            rootObj.playerContainer.tween = rootObj.tweens.add({
                targets: enemyShipShipEngine,
                y: { value: enemyShipShipEngine.y + 5, duration: 50, ease: 'Power1' },
                yoyo: true,
                loop: -1
            });

            enemyShip.health = rootObj.battleshipHealth

            return enemyContainer
        }

        function shootProjectile(x, y, missileIndex, velocity, playerMissile, up, flipY, scale, rotation, isProjectile = false) {
            let missile = rootObj.physics.add.sprite(x, y, 'missiles', rootObj.missilesFrames[missileIndex]);
            Align.scaleToGameW(missile, scale)
            missile.setVelocity(0, velocity * up)
            missile.flipY = flipY
            missile.rotation = rotation
            if (isProjectile) {
                missile.displayHeight = missile.displayHeight / 10
            }
            if (playerMissile) {
                for (let i = 0; i < rootObj.enemies.length; i++) {
                    rootObj.physics.add.overlap(rootObj.enemies[i].list[rootObj.enemies[i].list.length - 2], missile, (evt) => {
                        enemyTakeDamage(evt)
                        missile.destroy()
                    }, null, this);
                }
            }
            else {
                rootObj.physics.add.overlap(rootObj.playerContainer.list[rootObj.playerContainer.list.length - 2], missile, (evt) => {
                    playerTakeDamage()
                    missile.destroy()
                }, null, this);
            }
            rootObj.children.bringToTop(rootObj.playerContainer);
        }

        function addKeyboardControls() {
            // KEYS WSAD
            rootObj.keyW = rootObj.input.keyboard.addKey('W');
            rootObj.keyW.on('down', () => {
                rootObj.verticalVelocity--
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyW.on('up', () => {
                if (rootObj.verticalVelocity < 0) {
                    rootObj.verticalVelocity++
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyA = rootObj.input.keyboard.addKey('A');
            rootObj.keyA.on('down', () => {
                rootObj.horizontalVelocity--
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyA.on('up', () => {
                if (rootObj.horizontalVelocity < 0) {
                    rootObj.horizontalVelocity++
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyS = rootObj.input.keyboard.addKey('S');
            rootObj.keyS.on('down', () => {
                rootObj.verticalVelocity++
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyS.on('up', () => {
                if (rootObj.verticalVelocity > 0) {
                    rootObj.verticalVelocity--
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyD = rootObj.input.keyboard.addKey('D');
            rootObj.keyD.on('down', () => {
                rootObj.horizontalVelocity++
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyD.on('up', () => {
                if (rootObj.horizontalVelocity > 0) {
                    rootObj.horizontalVelocity--
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })

            //arrows
            rootObj.keyW = rootObj.input.keyboard.addKey('up');
            rootObj.keyW.on('down', () => {
                rootObj.verticalVelocity--
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyW.on('up', () => {
                if (rootObj.verticalVelocity < 0) {
                    rootObj.verticalVelocity++
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyA = rootObj.input.keyboard.addKey('left');
            rootObj.keyA.on('down', () => {
                rootObj.horizontalVelocity--
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyA.on('up', () => {
                if (rootObj.horizontalVelocity < 0) {
                    rootObj.horizontalVelocity++
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyS = rootObj.input.keyboard.addKey('down');
            rootObj.keyS.on('down', () => {
                rootObj.verticalVelocity++
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyS.on('up', () => {
                if (rootObj.verticalVelocity > 0) {
                    rootObj.verticalVelocity--
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyD = rootObj.input.keyboard.addKey('right');
            rootObj.keyD.on('down', () => {
                rootObj.horizontalVelocity++
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })
            rootObj.keyD.on('up', () => {
                if (rootObj.horizontalVelocity > 0) {
                    rootObj.horizontalVelocity--
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer, true)
            })

            rootObj.input.keyboard.addCapture('SPACE');
            rootObj.input.keyboard.on('keydown-SPACE', function (event) {
                if (rootObj.playerWeaponLoaded) {
                    rootObj.playerContainer.shoot()
                }
                rootObj.playerWeaponLoaded = false
            });
            rootObj.input.keyboard.on('keyup-SPACE', () => {
                rootObj.playerWeaponLoaded = true
            })
        }

        function setPlayerVelocity(x, y, playerContainer, key = false) {
            if (key) {
                rootObj.target.x = playerContainer.x + x
                rootObj.target.y = playerContainer.y + y
            }
            else {
                rootObj.target.x += x
                rootObj.target.y += y
            }
            rootObj.physics.moveToObject(playerContainer, rootObj.target, 200);
        }

        function removeItemOnce(arr, value) {
            let index = arr.indexOf(value);
            if (index > -1) {
                arr.splice(index, 1);
            }
            return arr;
        }

        function playerTakeDamage() {
            rootObj.playerContainer.health--
            if (rootObj.playerContainer.health < 0) {
                const x = rootObj.playerContainer.x
                const y = rootObj.playerContainer.y
                rootObj.playerContainer.destroy()
                explode(x, y)
                rootObj.emitter.emit("endGame")
                addEndGameMenu()
                showEndGameMenu()
            }
            else if (rootObj.playerContainer.health == 0) {
                rootObj.shieldHit.play({ volume: 0.15 })
                rootObj.playerContainer.list[rootObj.playerContainer.list.length - 1].visible = false
            }
            else {
                rootObj.shieldHit.play({ volume: 0.15 })
                rootObj.tweens.add({
                    targets: rootObj.playerContainer.list[rootObj.playerContainer.list.length - 1],
                    alpha: { value: 0 },
                    duration: 10,
                    repeat: 4,
                    yoyo: true
                });
            }

        }

        function enemyTakeDamage(enemy) {
            enemy.health--
            if (enemy.health < 0) {
                const x = enemy.parentContainer.x
                const y = enemy.parentContainer.y
                removeItemOnce(rootObj.enemies, enemy.parentContainer)
                enemy.parentContainer.destroy()
                explode(x, y)
                rootObj.scoreCounter.text = (parseInt(rootObj.scoreCounter.text) + 1).toString()
            }
            else if (enemy.health == 0) {
                rootObj.shieldHit.play({ volume: 0.15 })
                enemy.parentContainer.list[enemy.parentContainer.list.length - 1].visible = false
            }
            else {
                console.log(enemy.health)
                rootObj.shieldHit.play({ volume: 0.15 })
                let timeline = rootObj.tweens.createTimeline()
                timeline.add({
                    targets: enemy.parentContainer.list[enemy.parentContainer.list.length - 1],
                    alpha: { value: 0.1 },
                    duration: 100,
                });
                timeline.add({
                    targets: enemy.parentContainer.list[enemy.parentContainer.list.length - 1],
                    alpha: { value: 0.5 },
                    duration: 100,
                });
                timeline.play()
            }
        }

        function addEnemyRow(startIndex, rowLength, distance = 0) {
            let pos = startIndex
            for (let i = 0; i < rowLength; i++) {
                let d = addDrone(pos)
                rootObj.enemies.push(d)
                let oldY = d.y
                pos += 1 + distance
                d.y = -100
                rootObj.tweens.add({
                    targets: d,
                    y: oldY,
                    duration: 2000,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        d.timeline = rootObj.tweens.createTimeline()
                        d.timeline.add({
                            targets: d,
                            x: rootObj.cameras.main.width + d.width,
                            duration: 10000 / (i + 1),
                            ease: 'Sine.easeInOut'
                        })
                        d.timeline.add({
                            targets: d,
                            x: - d.width,
                            duration: 30000 / (i + 1),
                            ease: 'Sine.easeInOut',
                            repeat: -1,
                            yoyo: true
                        })
                        d.timeline.play()
                    }
                });
            }
            rootObj.children.bringToTop(rootObj.mainMenu)
            rootObj.children.bringToTop(rootObj.fullScreen)
        }

        function addEnemyShipMovement(ship) {
            let enemy = ship
            rootObj.enemies.push(enemy)
            let oldY = enemy.y
            enemy.y = -100
            rootObj.tweens.add({
                targets: enemy,
                y: oldY,
                duration: 2000,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    enemy.timeline = rootObj.tweens.createTimeline()
                    enemy.timeline.add({
                        targets: enemy,
                        x: rootObj.cameras.main.width + enemy.width,
                        duration: 30000,
                        ease: 'Sine.easeInOut'
                    })
                    enemy.timeline.add({
                        targets: enemy,
                        x: -enemy.width,
                        duration: 30000,
                        ease: 'Sine.easeInOut',
                        repeat: -1,
                        yoyo: true
                    })
                    enemy.timeline.play()
                }
            });
            rootObj.children.bringToTop(rootObj.mainMenu)
            rootObj.children.bringToTop(rootObj.fullScreen)
        }

        function joystickFunction() {
            rootObj.target.x = rootObj.playerContainer.x
            rootObj.target.y = rootObj.playerContainer.y
            let cursorKeys = rootObj.joyStick.createCursorKeys();
            let forceFactor = rootObj.joyStick.force
            if (forceFactor > 1) {
                forceFactor = 1
            }
            let s = ''
            for (var name in cursorKeys) {
                if (cursorKeys[name].isDown) {
                    s += name;
                }
            }
            switch (s) {
                case "down":
                    setPlayerVelocity(0, forceFactor, rootObj.playerContainer)
                    break;
                case "up":
                    setPlayerVelocity(0, -forceFactor, rootObj.playerContainer)
                    break;
                case "left":
                    setPlayerVelocity(-forceFactor, 0, rootObj.playerContainer)
                    break;
                case "right":
                    setPlayerVelocity(forceFactor, 0, rootObj.playerContainer)
                    break;
                case "downright":
                    setPlayerVelocity(forceFactor, forceFactor, rootObj.playerContainer)
                    break;
                case "upright":
                    setPlayerVelocity(forceFactor, -forceFactor, rootObj.playerContainer)
                    break;
                case "downleft":
                    setPlayerVelocity(-forceFactor, forceFactor, rootObj.playerContainer)
                    break;
                case "upleft":
                    setPlayerVelocity(-forceFactor, -forceFactor, rootObj.playerContainer)
                    break;
                default:
                    rootObj.playerContainer.body.stop()

            }
        }

        function dynamicJoystick() {
            rootObj.input.on('pointerdown', (pointer) => {
                console.log(checkButton(pointer, rootObj.shootBtn))
                if (!rootObj.menuOpen && checkButton(pointer, rootObj.shootBtn)) {
                    rootObj.joyStick.setVisible(true);
                    rootObj.joyStick.x = pointer.x
                    rootObj.joyStick.y = pointer.y
                }
            })
            rootObj.input.on('pointerup', (pointer) => {
                if (!rootObj.menuOpen) {
                    rootObj.joyStick.setVisible(false);
                }
            })
        }

        function explode(x, y) {
            let exp = rootObj.add.sprite(x, y, 'explosion', frames[0])
            exp.play('explosion', false)
            rootObj.explosionAudio.play({ volume: 0.35 })
            exp.once('animationcomplete', () => {
                rootObj.tweens.add({
                    targets: exp,
                    alpha: { value: 0, duration: 500 },
                    onComplete: () => {
                        exp.destroy()
                    }
                })
            });
        }

        function pauseGame() {
            rootObj.gamePaused = true
            rootObj.physics.world.isPaused = true;
            rootObj.tweens.pauseAll();
            rootObj.timer.paused = true
        }

        function resumeGame() {
            rootObj.gamePaused = false
            rootObj.physics.world.isPaused = false;
            rootObj.tweens.resumeAll();
            rootObj.timer.paused = false
        }

        function resetGame() {
            rootObj.registry.destroy(); // destroy registry
            rootObj.scene.restart(); // restart current scene
            rootObj.sound.removeAll();
        }

        function addScoreCounter() {
            rootObj.scoreCounter = rootObj.add.text(0, 0, '0', {
                dropShadowAngle: 1.1,
                dropShadowBlur: 5,
                dropShadowDistance: 3,
                fill: "white",
                fontFamily: "Helvetica",
                fontSize: 75,
                letterSpacing: 1,
                lineHeight: 1,
                lineJoin: "round",
                miterLimit: 1,
                padding: 1,
                strokeThickness: 1,
                leading: 1
            })
            rootObj.scoreCounter.setOrigin(0.5)
            rootObj.aGrid.placeAtIndex(1, rootObj.scoreCounter)
            Align.scaleToGameW(rootObj.scoreCounter, 0.025)
        }

        function addUI() {
            let atlasTexture = rootObj.textures.get('menuAssets');
            let frames = atlasTexture.getFrameNames();
            rootObj.settingsBtn = rootObj.physics.add.sprite(0, 0, 'menuAssets', frames[2]);
            rootObj.aGrid.placeAtIndex(11, rootObj.settingsBtn)
            Align.scaleToGameW(rootObj.settingsBtn, 0.05)
            rootObj.settingsBtn.setInteractive({ useHandCursor: true })
            rootObj.settingsBtn.on('pointerdown', () => {
                if (!rootObj.menuOpen) {
                    openMenu()
                    rootObj.menuOpen = true
                }
                else {
                    closeMenu()
                    rootObj.menuOpen = false
                }
            })

            rootObj.fullScreen = rootObj.physics.add.sprite(0, 0, 'fullscreenBtn');
            rootObj.aGrid.placeAtIndex(9, rootObj.fullScreen)
            Align.scaleToGameW(rootObj.fullScreen, 0.05)
            rootObj.fullScreen.setInteractive({ useHandCursor: true })
            rootObj.fullScreen.on('pointerdown', () => {
                if (!rootObj.menuOpen) {
                    if (document.body.requestFullscreen) {
                        document.body.requestFullscreen();
                    } else if (document.body.webkitRequestFullscreen) { /* Safari */
                        document.body.webkitRequestFullscreen();
                    } else if (document.body.msRequestFullscreen) { /* IE11 */
                        document.body.msRequestFullscreen();
                    }
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) { /* Safari */
                        document.webkitExitFullscreen();
                    } else if (document.msExitFullscreen) { /* IE11 */
                        document.msExitFullscreen();
                    }
                    rootObj.menuOpen = true
                }
            })

            rootObj.fullScreen.on('pointerdown', () => {
                rootObj.menuOpen = false
            })
        }

        function createMenu() {
            let atlasTexture = rootObj.textures.get('menuAssets');
            let frames = atlasTexture.getFrameNames();
            let menuWindow = rootObj.physics.add.sprite(0, 0, 'menuAssets', frames[0]);
            rootObj.aGrid.placeAtIndex(45, menuWindow)
            Align.scaleToGameW(menuWindow, 0.35)

            rootObj.mainMenu.add(menuWindow)

            let soundBtnAct = rootObj.physics.add.sprite(0, 0, 'menuAssets', frames[1]);
            rootObj.aGrid.placeAtIndex(31, soundBtnAct)
            Align.scaleToGameW(soundBtnAct, 0.15)

            let soundText = rootObj.add.text(0, 0, 'Sound', { font: "34px" })
            rootObj.aGrid.placeAtIndex(31, soundText)
            Align.scaleToGameW(soundText, 0.125)
            soundText.setOrigin(0.5)

            let soundSwitchOn = rootObj.physics.add.sprite(0, 0, 'menuAssets', frames[3]);
            rootObj.aGrid.placeAtIndex(33, soundSwitchOn)
            Align.scaleToGameW(soundSwitchOn, 0.055)

            soundSwitchOn.setInteractive({ useHandCursor: true })
            soundSwitchOn.visible = rootObj.soundOn
            soundSwitchOn.on('pointerdown', () => {
                soundSwitchOff.visible = true
                soundSwitchOn.visible = false
                stopSound()
            })

            rootObj.mainMenu.add(soundBtnAct)
            rootObj.mainMenu.add(soundText)
            rootObj.mainMenu.add(soundSwitchOn)

            let soundSwitchOff = rootObj.physics.add.sprite(0, 0, 'menuAssets', frames[4]);
            rootObj.aGrid.placeAtIndex(33, soundSwitchOff)
            Align.scaleToGameW(soundSwitchOff, 0.055)

            soundSwitchOff.setInteractive({ useHandCursor: true })
            soundSwitchOff.visible = !rootObj.soundOn
            soundSwitchOff.on('pointerdown', () => {
                soundSwitchOn.visible = true
                soundSwitchOff.visible = false
                playSound()
            })
            rootObj.mainMenu.add(soundSwitchOff)

            let scoreBtn = rootObj.physics.add.sprite(0, 0, 'menuAssets', frames[1]);
            rootObj.aGrid.placeAtIndex(45, scoreBtn)
            Align.scaleToGameW(scoreBtn, 0.15)

            let scoreText = rootObj.add.text(0, 0, 'Score', { font: "34px" });
            rootObj.aGrid.placeAtIndex(45, scoreText)
            Align.scaleToGameW(scoreText, 0.125)
            scoreText.setOrigin(0.5)

            rootObj.score = rootObj.add.text(0, 0, '0', { font: "40px" });
            rootObj.score.setOrigin(0.5)
            rootObj.aGrid.placeAtIndex(58, rootObj.score)
            Align.scaleToGameW(rootObj.score, 0.035 * rootObj.score.text.length)


            rootObj.mainMenu.add(scoreBtn)
            rootObj.mainMenu.add(scoreText)
            rootObj.mainMenu.add(rootObj.score)

            rootObj.mainMenu.visible = false
        }

        function closeMenu() {
            resumeGame()
            rootObj.mainMenu.visible = false
        }

        function openMenu() {
            pauseGame()
            rootObj.children.bringToTop(rootObj.mainMenu)
            rootObj.mainMenu.visible = true
        }

        function stopSound() {
            rootObj.soundOn = 0
            rootObj.explosionAudio.setMute(true)
            rootObj.bkMusic.setMute(true)
            rootObj.shieldHit.setMute(true)
            rootObj.laserSmall.setMute(true)
            rootObj.laserBig.setMute(true)
            rootObj.laserBig2.setMute(true)
        }

        function playSound() {
            rootObj.soundOn = 1
            rootObj.explosionAudio.setMute(false)
            rootObj.bkMusic.setMute(false)
            rootObj.shieldHit.setMute(false)
            rootObj.laserSmall.setMute(false)
            rootObj.laserBig.setMute(false)
            rootObj.laserBig2.setMute(false)
        }

        function addEndGameMenu() {
            let atlasTexture = rootObj.textures.get('menuAssets');
            let frames = atlasTexture.getFrameNames();
            let menuWindow = rootObj.physics.add.sprite(0, 0, 'menuAssets', frames[0]);
            rootObj.aGrid.placeAtIndex(45, menuWindow)
            Align.scaleToGameW(menuWindow, 0.5)
            rootObj.endGameMenu.add(menuWindow)

            let scoreBtn = rootObj.physics.add.sprite(0, 0, 'menuAssets', frames[1]);
            rootObj.aGrid.placeAtIndex(45, scoreBtn)
            Align.scaleToGameW(scoreBtn, 0.2)

            let scoreText = rootObj.add.text(0, 0, 'Score', { font: "34px" });
            scoreText.setOrigin(0.5)
            rootObj.aGrid.placeAtIndex(45, scoreText)
            Align.scaleToGameW(scoreText, 0.175)
            Align.center(scoreText)

            let score = rootObj.add.text(0, 0, 'test', { font: "40px" });
            score.text = rootObj.score.text
            score.setOrigin(0.5)
            rootObj.aGrid.placeAtIndex(58, score)
            Align.scaleToGameW(score, 0.035 * score.text.length)

            rootObj.endGameMenu.add(scoreBtn)
            rootObj.endGameMenu.add(scoreText)
            rootObj.endGameMenu.add(score)

            let restartBtn = rootObj.physics.add.sprite(0, 0, 'menuAssets', frames[5]);
            rootObj.aGrid.placeAtIndex(71, restartBtn)
            Align.scaleToGameW(restartBtn, 0.075)
            restartBtn.setInteractive({ useHandCursor: true })
            restartBtn.on('pointerdown', () => {
                resetGame()
            })
            rootObj.endGameMenu.add(restartBtn)

            rootObj.endGameMenu.visible = false
        }

        function showEndGameMenu() {
            rootObj.children.bringToTop(rootObj.endGameMenu)
            rootObj.endGameMenu.visible = true
            rootObj.settingsBtn.visible = false
            rootObj.physics.world.isPaused = true;
            rootObj.tweens.killAll();
        }
    },

    update() {
        if (this.enemies.length < 1) {
            this.emitter.emit('newWave');
            this.waveNumber++
        }
        if (this.playerContainer.body) {
            let distance = Phaser.Math.Distance.Between(this.playerContainer.x, this.playerContainer.y, this.target.x, this.target.y);
            if (this.playerContainer.body.y < this.scale.gameSize.height / 2) {
                this.playerContainer.body.stop()
                this.playerContainer.body.y += 5
            }
            if (this.playerContainer.body.speed > 0) {
                if (distance < 1) {
                    this.playerContainer.body.stop()
                }
            }
        }
    },

}

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkButton(pointer, button) {
    if (pointer.x < button.x && pointer.y < button.y) {
        return true
    }
    else if (pointer.x < button.x && pointer.y > button.y + button.displayHeight) {
        return true
    }
    else if (pointer.x > button.x + button.displayWidth && pointer.y < button.y) {
        return true
    }
    else if (pointer.x > button.x + button.displayWidth && pointer.y > button.y + button.displayHeight) {
        return true
    }
    else {
        return false
    }
}


let c = document.createElement('canvas')
c.width = window.innerWidth * window.devicePixelRatio
c.height = window.innerHeight * window.devicePixelRatio

const scale = Math.max(window.innerWidth / c.width, window.innerHeight / c.height);
const w = c.width * scale;
const h = c.height * scale;

const gameConf = {
    type: Phaser.AUTO,
    parent: "gameContainer",
    width: w,
    height: h,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: spiderTank,
    activePointers: 3
};

let game = new Phaser.Game(gameConf);
