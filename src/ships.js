var ships = (function(hulls, ai, upgrades, utils) {
    var game;
    var enemies;

    function preload(newGame) {
        game = newGame;
    }

    function create() {
        enemies = new Enemies();
    }

    function Enemies() {
        var ships = [];

        this.group = game.add.group();
        this.group.enableBody = true;

        this.add = function(enemy) {
            ships.push(enemy);
        };

        this.getExisting = function() {
            var existingShips = [];

            ships.forEach(function(enemy) {
                if(enemy.sprite.alive == true) {
                    existingShips.push(enemy);
                }
            });

            return existingShips;
        };

        this.getByGuid = function(guid) {
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].sprite.guid == guid) {
                    return ships[i];
                }
            }
        };

        this.move = function() {
            ships.forEach(function(enemy) {
                if(enemy.dead == false) {
                    if(enemy.sprite.x <= enemy.hull.width * -1) {
                        enemy.sprite.kill();
                        return;
                    }

                    enemy.play();
                }
            });
        };

        this.remove = function(enemy) {
            ships.splice(ships.indexOf(enemy), 1);
        };

        this.coolDown = function() {
            ships.forEach(function(ship) {
                ship.coolDown();
            });
        };
    }

    var Ship = function() {};
    Ship.prototype.positionUpdated = function() {
        this.hull.positionUpdated(this);
    };
    Ship.prototype.kill = function() {
        this.dead = true;
        this.stopFiring();
        this.sprite.animations.stop();
        this.sprite.animations.play('death', 30, false, true);

        if(this.isEnemy) {
            game.increaseScore(this.score);
            enemies.remove(this);
            game.enemiesKilled++;
            if(this.shouldSpawnUpgrade()) {
                upgrades.getUpgrades().spawnRandom();
            }
        }
    };
    Ship.prototype.shouldSpawnUpgrade = function() {
        var rndm = Math.floor(Math.random() * this.dropRate);
        console.log(rndm);
        return rndm == 1;
    };
    Ship.prototype.damage = function(incomingProjectile) {
        incomingProjectile.hit();
        this.sprite.animations.play('hit');
        this.health -= incomingProjectile.getPower();
        this.stopFiring();

        if(this.health <= 0 && this.dead == false) {
            this.kill();
        }

        if(!this.isEnemy) {
            game.updatePlayerHealth(this.health);
        }
    };
    Ship.prototype.fire = function(coordinatePair) {
        this.hull.fire(this, coordinatePair);
    };
    Ship.prototype.stopFiring = function() {
        this.hull.stopFiring();
    };
    Ship.prototype.upgradeWeapon = function(weaponSlotName, weapon) {
        this.hull.upgradeWeapon(weaponSlotName, weapon);
    };
    Ship.prototype.addWeapon = function(weaponSlotName, weapon) {
        this.hull.addWeapon(weaponSlotName, weapon);
    };
    Ship.prototype.coolDown = function() {
        this.hull.coolDown();
    };
    Ship.prototype.dropRate = 1;

    var Player = function() {
        this.score = 0;
        this.velocity = 350;
        this.dead = false;
        this.isEnemy = false;
        this.hull = new hulls.StandardHull();
        this.health = this.hull.maxHealth;
        this.sprite = game.add.sprite(0, game.world.height / 2 - 32, this.hull.skin);

        this.hull.addWeapon('left wing', new weapons.LightLaser(directions.EAST));
        this.hull.addWeapon('right wing', new weapons.LightLaser(directions.EAST));

        game.physics.arcade.enable(this.sprite);
        this.sprite.body.collideWorldBounds = true;
    };
    Player.prototype = Ship.prototype;
    Player.prototype.constructor = Player;

    var Pirate = function() {
        this.score = 100;
        this.dead = false;
        this.velocity = -50;
        this.isEnemy = true;
        this.hull = new hulls.LightHull();
        this.health = this.hull.maxHealth;
        this.dropRate = 10;
        this.hull.addWeapon('left wing', new weapons.LightLaser(directions.WEST));
        this.hull.addWeapon('right wing', new weapons.LightLaser(directions.WEST));

        this.sprite = enemies.group.create(game.world.width, Math.floor(Math.random() * 601), this.hull.skin);
        this.sprite.guid = createGuid();
        this.sprite.animations.add('death', [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 30);
        this.sprite.animations.add('hit', [1, 0], 30);
        this.sprite.frame = 0;

        enemies.add(this);

        this.play = function() {
            new ai.FollowAndFire().play(this);
        }
    };
    Pirate.prototype = Ship.prototype;
    Pirate.prototype.constructor = Pirate;

    var Genocide = function() {
        var ship = this;
        this.score = 5000;
        this.dead = false;
        this.velocity = 0;
        this.isEnemy = true;
        this.hull = new hulls.CruiserHull();
        this.health = this.hull.maxHealth;
        this.ais = {};

        setUpWeapons();
        setUpSprite();
        setUpAi();

        enemies.add(this);

        this.play = function() {
            //ship.ais.move.play(this, new utils.CoordinatePair(500, 100));
            //if(ship.ais.move.isComplete == true) {
            if(this.health < this.hull.maxHealth / 2) {
                speedUp();
            }

            ship.ais.follow.play(this);
            ship.ais.burst.loop(this, ['left wing tip', 'right wing tip']);
            ship.ais.slowBurst.loop(this, ['left core tip', 'right core tip']);
            ship.ais.bombardmentTop.loop(this, ['left wing']);
            ship.ais.bombardmentBottom.loop(this, ['right wing']);
            ship.ais.slowFire.loop(this, ['right core']);
            ship.ais.delayedSlowFire.loop(this, ['left core']);
            //}
        };

        function setUpWeapons() {
            ship.hull.addWeapon('left wing', new weapons.LightLaser(directions.WEST));
            ship.hull.addWeapon('right wing', new weapons.LightLaser(directions.WEST));
            ship.hull.addWeapon('left wing tip', new weapons.HeavyLaser(directions.WEST));
            ship.hull.addWeapon('right wing tip', new weapons.HeavyLaser(directions.WEST));
            ship.hull.addWeapon('left core', new weapons.PlasmaCannon(directions.WEST));
            ship.hull.addWeapon('right core', new weapons.PlasmaCannon(directions.WEST));
            ship.hull.addWeapon('left core tip', new weapons.ParticleBeam(directions.WEST));
            ship.hull.addWeapon('right core tip', new weapons.ParticleBeam(directions.WEST));
        }

        function setUpSprite() {
            ship.sprite = enemies.group.create(game.world.width - 300, 100, ship.hull.skin);
            ship.sprite.guid = createGuid();
            ship.sprite.animations.add('death', [1, 0], 30);
            ship.sprite.animations.add('hit', [1, 0], 30);
            ship.sprite.frame = 0;
        }

        function setUpAi() {
            ship.ais.bombardmentTop = new ai.Bombardment(directions.NORTH, directions.SOUTH);
            ship.ais.bombardmentTop.setCooldown(500);
            ship.ais.bombardmentBottom = new ai.Bombardment(directions.SOUTH, directions.NORTH, true);
            ship.ais.bombardmentBottom.setCooldown(500);
            ship.ais.bombardmentBottom.setDelay(100);
            ship.ais.move = new ai.Move();
            ship.ais.slowFire = new ai.Fire();
            ship.ais.slowFire.setCooldown(1000);
            ship.ais.delayedSlowFire = new ai.Fire();
            ship.ais.delayedSlowFire.setCooldown(1000);
            ship.ais.delayedSlowFire.setDelay(100);
            ship.ais.follow = new ai.Follow();
            ship.ais.burst = new ai.Burst(20);
            ship.ais.burst.setCooldown(100);
            ship.ais.slowBurst = new ai.Burst(40);
            ship.ais.slowBurst.setCooldown(250);
        }

        function speedUp() {
            if(ship.hasSpedUp == true) {
                return;
            }

            ship.ais.bombardmentTop.setCooldown(250);
            ship.ais.bombardmentBottom.setCooldown(250);
            ship.ais.slowFire.setCooldown(500);
            ship.ais.delayedSlowFire.setCooldown(500);
            ship.ais.burst.setCooldown(50);
            ship.ais.slowBurst.setCooldown(125);
            ship.hasSpedUp = true;
        }

    };
    Genocide.prototype = Ship.prototype;
    Genocide.prototype.constructor = Genocide;

    function createGuid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    function getEnemies() {
        return enemies;
    }

    return {
        preload: preload,
        create: create,
        getEnemies: getEnemies,
        Player: Player,
        enemies: {
            Pirate: Pirate,
            Genocide: Genocide
        }
    };
})(hulls, ai, upgrades, utils);