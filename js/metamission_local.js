
const spiderTank = {

    preload() {
        this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);
        this.load.atlas('spaceships', './assets/spaceships.png', './assets/spaceships.json')
        this.load.atlas('engines', './assets/engines.png', './assets/engines.json')
        this.load.atlas('guns', './assets/guns.png', './assets/guns.json')
        this.load.atlas('planets', './assets/planets.png', './assets/planets.json')
        this.load.atlas('missiles', './assets/missiles.png', './assets/missiles.json')
        this.load.image('star', './assets/star.png')
        this.load.spritesheet("shield", "./assets/shield.png", { frameWidth: 170, frameHeight: 170 });
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
            frameRate: 30,
            frames: rootObj.anims.generateFrameNumbers("shield", { start: 0, end: 10 }),
            repeat: -1
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
        // rootObj.aGrid.showNumbers()
        rootObj.children.bringToTop(rootObj.playerContainer);

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
            delay: 6000,                // ms
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
            let playerShip = rootObj.physics.add.sprite(0, 0, 'spaceships', rootObj.shipFrames[3])
            Align.scaleToGameW(playerShip, 0.05)
            let playerShipEngine = rootObj.physics.add.sprite(0, 0, 'engines', rootObj.shipEnginesFrames[1])
            Align.scaleToGameW(playerShipEngine, 0.05)
            let playerShipGun = rootObj.physics.add.sprite(0, 0, 'guns', rootObj.shipGunsFrames[1])
            Align.scaleToGameW(playerShipGun, 0.01)

            rootObj.playerContainer.add(playerShipGun)
            rootObj.playerContainer.add(playerShipEngine)
            rootObj.playerContainer.add(playerShip)

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

            enemyShipShipEngine.y -= enemyShip.displayHeight / 1.1
            enemyShipShipEngine.x += enemyShip.displayWidth * 0.03
            enemyShipShipGun1.x -= enemyShip.displayWidth / 2
            enemyShipShipGun2.x += enemyShip.displayWidth / 2

            enemyContainer.add(enemyShipShipEngine)
            enemyContainer.add(enemyShipShipGun1)
            enemyContainer.add(enemyShipShipGun2)
            enemyContainer.add(enemyShip)

            enemyContainer.shoot = () => {
                shootProjectile(enemyContainer.list[1].x + enemyContainer.x,
                    enemyContainer.list[1].y + enemyContainer.y, 1,
                    500, false, 1, true, 0.015)
                shootProjectile(enemyContainer.list[2].x + enemyContainer.x,
                    enemyContainer.list[2].y + enemyContainer.y, 1,
                    500, false, 1, true, 0.015)
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

            enemyContainer.add(enemyShipShipEngine)
            enemyContainer.add(enemyShipShipGun3)
            enemyContainer.add(enemyShipShipGun1)
            enemyContainer.add(enemyShipShipGun2)
            enemyContainer.add(enemyShip)

            rootObj.aGrid.placeAtIndex(index, enemyContainer)

            return enemyContainer
        }

        function shootProjectile(x, y, missileIndex, velocity, playerMissile, up, flipY, scale) {
            let missile = rootObj.physics.add.sprite(x, y, 'missiles', rootObj.missilesFrames[missileIndex]);
            Align.scaleToGameW(missile, scale)
            missile.setVelocity(0, velocity * up)
            missile.flipY = flipY
            if (playerMissile) {
                for (let i = 0; i < rootObj.enemies.length; i++) {
                    rootObj.physics.add.overlap(rootObj.enemies[i].list[rootObj.enemies[i].list.length - 1], missile, (evt) => {
                        enemyTakeDamage(evt)
                        missile.destroy()
                    }, null, this);
                }
            }
            else {
                rootObj.physics.add.overlap(rootObj.playerContainer.list[rootObj.playerContainer.list.length - 1], missile, (evt) => {
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
                shootProjectile(rootObj.playerContainer.list[0].x + rootObj.playerContainer.x, rootObj.playerContainer.list[0].y + rootObj.playerContainer.y, 0, 500, true, -1, true, 0.05)
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
            var index = arr.indexOf(value);
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
                removeItemOnce(rootObj.enemies, enemy.parentContainer)
                enemy.parentContainer.destroy()
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
