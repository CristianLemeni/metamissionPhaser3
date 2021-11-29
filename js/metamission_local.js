
const spiderTank = {

    preload() {
        this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);
        this.load.atlas('spaceships', './assets/spaceships.png', './assets/spaceships.json')
        this.load.atlas('engines', './assets/engines.png', './assets/engines.json')
        this.load.atlas('guns', './assets/guns.png', './assets/guns.json')
        this.load.atlas('planets', './assets/planets.png', './assets/planets.json')
        this.load.atlas('missiles', './assets/missiles.png', './assets/missiles.json')
        this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
        this.load.image('star', './assets/star.png')
        this.load.spritesheet("shield", "./assets/shield.png", { frameWidth: 170, frameHeight: 170 });
        this.load.spritesheet("shield2", "./assets/shield2.png", { frameWidth: 160, frameHeight: 160 });
        this.load.spritesheet("shield3", "./assets/shield3.png", { frameWidth: 160, frameHeight: 160 });
        this.load.spritesheet('lightning', './assets/lightning.png', { frameWidth: 85, frameHeight: 85 })
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

        rootObj.emitter = new Phaser.Events.EventEmitter();

        rootObj.horizontalVelocity = 0
        rootObj.verticalVelocity = 0
        rootObj.speed = 350
        rootObj.playerContainer = rootObj.add.container()
        rootObj.playerContainer.health = 10
        rootObj.enemies = []

        rootObj.aGrid = new AlignGrid({ scene: rootObj, rows: 7, cols: 13 })

        addBackground()
        addPlayer()
        addKeyboardControls()
        rootObj.aGrid.showNumbers()
        rootObj.children.bringToTop(rootObj.playerContainer);

        rootObj.joyStick = rootObj.plugins.get('rexvirtualjoystickplugin').add(rootObj, {
            x: rootObj.cameras.main.worldView.x + rootObj.cameras.main.width / 2,
            y: rootObj.cameras.main.worldView.y + rootObj.cameras.main.height * 0.85,
            radius: 50,
            base: rootObj.add.circle(0, 0, 50, 0x888888),
            thumb: rootObj.add.circle(0, 0, 25, 0xcccccc),
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

        rootObj.emitter.on('newWave', () => {
            addEnemyRow(3, 6)
            rootObj.time.delayedCall(3000, () => {
                addEnemyRow(16, 6)
            })
        }, this);

        addEnemyRow(3, 6)
        rootObj.time.delayedCall(3000, () => {
            addEnemyRow(16, 6)
        })

        const timer = rootObj.time.addEvent({
            delay: 6000,// ms
            callback: () => {
                rootObj.emitter.emit('enemyShoot');
            },
            //args: [],
            // callbackScope: thisArg,
            loop: true
        });

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

            enemyContainer.shoot = () => {
                shootProjectile(enemyContainer.list[1].x + enemyContainer.x,
                    enemyContainer.list[1].y + enemyContainer.y * 1.25, 5,
                    500, false, 1, true, 0.035, 4.71239, true)
                shootProjectile(enemyContainer.list[2].x + enemyContainer.x,
                    enemyContainer.list[2].y + enemyContainer.y * 1.25, 5,
                    500, false, 1, true, 0.035, 4.71239, true)
            }


            enemyShip.health = 3

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

                rootObj.tweens.add({
                    targets: enemyContainer,
                    y: rootObj.playerContainer.y,
                    x: rootObj.playerContainer.x,
                    duration: 2000,
                    onComplete: () => {
                        enemyContainer.destroy()
                    }
                })
            }


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
                    playerTakeDamage
                    missile.destroy()
                }, null, this);
            }
            rootObj.children.bringToTop(rootObj.playerContainer);
        }

        function addKeyboardControls() {
            // KEYS WSAD
            rootObj.keyW = rootObj.input.keyboard.addKey('W');
            rootObj.keyW.on('down', () => {
                console.log("TEST")
                rootObj.verticalVelocity--
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyW.on('up', () => {
                if (rootObj.verticalVelocity < 0) {
                    rootObj.verticalVelocity++
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyA = rootObj.input.keyboard.addKey('A');
            rootObj.keyA.on('down', () => {
                rootObj.horizontalVelocity--
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyA.on('up', () => {
                if (rootObj.horizontalVelocity < 0) {
                    rootObj.horizontalVelocity++
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyS = rootObj.input.keyboard.addKey('S');
            rootObj.keyS.on('down', () => {
                rootObj.verticalVelocity++
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyS.on('up', () => {
                if (rootObj.verticalVelocity > 0) {
                    rootObj.verticalVelocity--
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyD = rootObj.input.keyboard.addKey('D');
            rootObj.keyD.on('down', () => {
                rootObj.horizontalVelocity++
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyD.on('up', () => {
                if (rootObj.horizontalVelocity > 0) {
                    rootObj.horizontalVelocity--
                }
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })

            //arrows
            rootObj.keyW = rootObj.input.keyboard.addKey('up');
            rootObj.keyW.on('down', () => {
                rootObj.verticalVelocity--
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyW.on('up', () => {
                rootObj.verticalVelocity++
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyA = rootObj.input.keyboard.addKey('left');
            rootObj.keyA.on('down', () => {
                rootObj.horizontalVelocity--
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyA.on('up', () => {
                rootObj.horizontalVelocity++
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyS = rootObj.input.keyboard.addKey('down');
            rootObj.keyS.on('down', () => {
                rootObj.verticalVelocity++
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyS.on('up', () => {
                rootObj.verticalVelocity--
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyD = rootObj.input.keyboard.addKey('right');
            rootObj.keyD.on('down', () => {
                rootObj.horizontalVelocity++
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })
            rootObj.keyD.on('up', () => {
                rootObj.horizontalVelocity--
                setPlayerVelocity(rootObj.horizontalVelocity, rootObj.verticalVelocity, rootObj.playerContainer)
            })

            rootObj.input.keyboard.addCapture('SPACE');
            rootObj.input.keyboard.on('keydown-SPACE', function (event) {
                shootProjectile(rootObj.playerContainer.list[0].x + rootObj.playerContainer.x,
                    rootObj.playerContainer.list[0].y + rootObj.playerContainer.y,
                    9, 500, true, -1, true, 0.035, 0)
            });
        }

        function setPlayerVelocity(x, y, playerContainer) {
            const vx = x * rootObj.speed
            const vy = y * rootObj.speed
            for (let i = 0; i < playerContainer.list.length; i++) {
                playerContainer.list[i].setVelocity(vx, vy)
            }
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
                rootObj.playerContainer.destroy()
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
            }
        }

        function addEnemyRow(startIndex, rowLength) {
            let pos = startIndex
            for (let i = 0; i < rowLength; i++) {
                let d = addDrone(pos)
                rootObj.enemies.push(d)
                let oldY = d.y
                pos++
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
                            x: rootObj.cameras.main.width + d.x,
                            duration: 30000,
                            ease: 'Sine.easeInOut'
                        })
                        d.timeline.add({
                            targets: d,
                            x: (rootObj.cameras.main.width - d.x) * -1,
                            duration: 30000,
                            ease: 'Sine.easeInOut',
                            repeat: -1,
                            yoyo: true
                        })
                        d.timeline.play()
                    }
                });
            }
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
                        x: rootObj.cameras.main.width + enemy.x,
                        duration: 30000,
                        ease: 'Sine.easeInOut'
                    })
                    enemy.timeline.add({
                        targets: enemy,
                        x: (rootObj.cameras.main.width - enemy.x) * -1,
                        duration: 30000,
                        ease: 'Sine.easeInOut',
                        repeat: -1,
                        yoyo: true
                    })
                    enemy.timeline.play()
                }
            });
        }

        function joystickFunction() {
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
                    for (let i = 0; i < rootObj.playerContainer.list.length; i++) {
                        rootObj.playerContainer.list[i].body.stop()
                    }

            }
        }

        function dynamicJoystick() {
            rootObj.input.on('pointerdown', (pointer) => {
                if (!rootObj.menuOpen) {
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
    },

    update() {
        if (this.enemies.length < 1) {
            this.emitter.emit('newWave');
        }
    },

}

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
};

let game = new Phaser.Game(gameConf);