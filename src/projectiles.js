var projectiles = (function(utils) {
    var game;
    var projectiles;

    function preload(newGame) {
        game = newGame;
    }

    function create() {
        projectiles = new Projectiles();
    }

    function Projectiles() {
        this.entities = [];

        this.group = game.add.group();
        this.group.enableBody = true;

        this.add = function(projectile) {
            this.entities.push(projectile);
        };

        this.remove = function(projectile) {
            var index = this.entities.indexOf(projectile);
            if(index < 0) {
                return;
            }

            this.entities.splice(index, 1);
        };

        this.getByGuid = function(guid) {
            for (var i = 0; i < this.entities.length; i++) {
                var projectile = this.entities[i];
                if(projectile.sprite.guid == guid) {
                    return projectile;
                }
            }
        };
    }

    var Projectile = function() {};
    Projectile.prototype.hit = function() {
        if(this.weapon.pierce == true) {
            return;
        }

        projectiles.remove(this);
        this.sprite.kill();
    };
    Projectile.prototype.stop = function() {};
    Projectile.prototype.updatePosition = function() {};
    Projectile.prototype.editVelocity = function(projectileCoordinatePair, targetCoordinatePair, angle) {
        var relativePosition = targetCoordinatePair.getRelativePosition(projectileCoordinatePair);
        this.sprite.body.velocity.y = (relativePosition.y / Math.abs(relativePosition.x)) * (this.weapon.velocity);
        this.sprite.body.velocity.x *= getSign(angle);
    };
    Projectile.prototype.isEnemyProjectile = function() {
        return this.ship.isEnemy;
    };
    Projectile.prototype.getPower = function() {
        return this.weapon.power;
    };
    Projectile.prototype.fireAt = function(coordinatePair) {
        var projectileCoordinatePair = new utils.CoordinatePair(this.ship.sprite.x + this.weaponSlot.location.x, this.ship.sprite.y + this.weaponSlot.location.y);
        var angle = projectileCoordinatePair.getAngle(coordinatePair);

        this.fire(createAngledSprite(this.weapon, this.weaponSlot, this.ship, angle));

        this.editVelocity(projectileCoordinatePair, coordinatePair, angle);
    };

    var Bullet = function(ship, weaponSlot, weapon) {
        this.ship = ship;
        this.weaponSlot = weaponSlot;
        this.weapon = weapon;

        this.fire = function(sprite) {
            this.sprite = sprite ? sprite : createDefaultSprite(this.weapon, this.weaponSlot, this.ship);
            this.sprite.anchor.setTo(0, 0.5);
            this.sprite.body.velocity.x = this.weapon.velocity * this.weapon.direction.xMod;
            this.sprite.body.velocity.y = this.weapon.velocity * this.weapon.direction.yMod;
            this.sprite.guid = createGuid();

            this.weapon.sound.play();
            this.weapon.counter = 0;

            projectiles.add(this);
        };
    };
    Bullet.prototype = Projectile.prototype;
    Bullet.prototype.constructor = Bullet;

    var Cannon = function(ship, weaponSlot, weapon) {
        this.ship = ship;
        this.weaponSlot = weaponSlot;
        this.weapon = weapon;

        this.fire = function(sprite) {
            this.sprite = sprite ? sprite : createDefaultSprite(this.weapon, this.weaponSlot, this.ship);
            this.sprite.anchor.setTo(0, 0.5);
            this.sprite.guid = createGuid();
            this.weapon.sound.play();
            var fireAnimation = this.sprite.animations.add('fire', [6, 5, 4, 3, 2, 1, 0], 60);
            fireAnimation.play('fire');

            var fnSprite = this.sprite;
            var weapon = this.weapon;
            fireAnimation.onComplete.add(function() {
                fnSprite.frame = 0;
                fnSprite.body.velocity.x = weapon.velocity * weapon.direction.xMod;
                fnSprite.body.velocity.y = weapon.velocity * weapon.direction.yMod;
            });

            this.weapon.counter = 0;

            projectiles.add(this);
        };
    };
    Cannon.prototype = Projectile.prototype;
    Cannon.prototype.constructor = Cannon;

    var Beam = function(ship, weaponSlot, weapon) {
        this.ship = ship;
        this.weaponSlot = weaponSlot;
        this.weapon = weapon;

        var firing = false;
        this.fire = function(sprite) {
            if(firing == false) {
                firing = true;
                this.sprite = sprite ? sprite : createDefaultSprite(this.weapon, this.weaponSlot, this.ship);
                this.sprite.anchor.setTo(0, 0.5);
                this.sprite.animations.add('fire', [0, 1], 30, true);
                this.sprite.animations.play('fire');

                if(!this.weapon.sound.isPlaying) {
                    this.weapon.sound.play();
                }

                projectiles.add(this);
            }
        };

        this.stop = function(weapon) {
            firing = false;
            this.weapon.sound.stop();
            projectiles.remove(this);
            this.sprite.kill();
        };

        this.updatePosition = function(angle) {
            if(this.sprite == undefined) {
                return;
            }

            this.sprite.body.x = this.ship.sprite.x + this.weaponSlot.location.x;
            this.sprite.body.y = this.ship.sprite.y + this.weaponSlot.location.y - 16;

            if(angle !== undefined) {
                this.sprite.angle = angle;
                this.sprite.scale.x *= getSign(angle);
            }
        };

        this.editVelocity = function(projectileCoordinatePair, targetCoordinatePair) {
        };
    };
    Beam.prototype = Projectile.prototype;
    Beam.prototype.constructor = Beam;

    function createDefaultSprite(weapon, weaponSlot, ship) {
        var projectile = projectiles.group.create(ship.sprite.x + weaponSlot.location.x, ship.sprite.y + weaponSlot.location.y, weapon.skin);
        projectile.angle = weapon.direction.xMod == 0 ? weapon.direction.yMod * 45 : weapon.direction.yMod * 45 * weapon.direction.xMod;
        projectile.scale.x *= (weapon.direction.xMod == 0) ? weapon.direction.yMod : weapon.direction.xMod;

        return projectile;
    }

    function createAngledSprite(weapon, weaponSlot, ship, angle) {
        var projectile = projectiles.group.create(ship.sprite.x + weaponSlot.location.x, ship.sprite.y + weaponSlot.location.y, weapon.skin);

        projectile.angle = angle;
        projectile.scale.x *= (Math.abs(angle) <= 90 || Math.abs(angle)) >= -90 ? -1 : 1;

        return projectile;
    }

    function getSign(angle) {
        return Math.abs(angle) <= 90 ? 1 : -1;
    }

    function getProjectiles() {
        return projectiles;
    }

    function createGuid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    return {
        preload: preload,
        create: create,
        getProjectiles: getProjectiles,
        types: {
            Bullet: Bullet,
            Beam: Beam,
            Cannon: Cannon
        }
    };
})(utils);