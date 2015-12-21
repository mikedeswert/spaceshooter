var weapons = (function(tiers, projectiles) {
    var game;
    var sounds = {};

    function preload(newGame) {
        game = newGame;
        game.load.image('light-laser', '../media/images/sprites/light_laser.png');
        game.load.image('heavy-laser', '../media/images/sprites/heavy_laser.png');
        game.load.spritesheet('plasma-cannon', '../media/images/sprites/plasma_cannon_3.png', 64, 64);
        game.load.spritesheet('particle-beam', '../media/images/sprites/particle_beam.png', 800, 32);

        game.load.audio('light-laser', '../media/sounds/effects/light_laser.mp3');
        game.load.audio('heavy-laser', '../media/sounds/effects/heavy_laser_2.mp3');
        game.load.audio('particle-beam', '../media/sounds/effects/particle_beam.mp3');
        game.load.audio('plasma-cannon', '../media/sounds/effects/plasma_cannon.mp3');
    }

    function create() {
        sounds.lightLaserSound = game.add.audio('light-laser');
        sounds.heavyLaserSound = game.add.audio('heavy-laser');
        sounds.particleBeamSound = game.add.audio('particle-beam', 1, true);
        sounds.plasmaCannonSound = game.add.audio('plasma-cannon');
    }

    var Weapon = function() {};
    Weapon.prototype.isBetterThan = function(weapon) {
        return this.tier >= weapon.tier;
    };
    Weapon.prototype.isWorseThan = function(weapon) {
        return this.tier < weapon.tier;
    };
    Weapon.prototype.coolDown = function() {
        if(this.cooldown == undefined) {
            return;
        }

        if(this.counter < this.cooldown) {
            this.counter++;
        }
    };

    var Laser = function() {};
    Laser.prototype = Weapon.prototype;
    Laser.prototype.fire = function(ship, weaponSlot, coordinatePair) {
        if(this.counter < this.cooldown) {
            return;
        }

        this.counter = 0;

        if(coordinatePair == undefined) {
            new projectiles.types.Bullet(ship, weaponSlot, this).fire();
            return;
        }

        new projectiles.types.Bullet(ship, weaponSlot, this).fireAt(coordinatePair);
        return;
    };
    Laser.prototype.stopFiring = function() {};
    Laser.prototype.updatePosition = function() {};
    Laser.prototype.constructor = Laser;

    var LightLaser = function(direction) {
        this.direction = direction;
        this.velocity = 1000;
        this.name = 'lightLaser';
        this.skin = 'light-laser';
        this.sound = sounds.lightLaserSound;
        this.tier = tiers.BASIC;
        this.cooldown = 5;
        this.counter = 0;
        this.power = 10;
        this.pierce = false;
    };
    LightLaser.prototype = Laser.prototype;
    LightLaser.prototype.constructor = LightLaser;

    var HeavyLaser = function(direction) {
        this.direction = direction;
        this.velocity = 800;
        this.name = 'heavyLaser';
        this.skin = 'heavy-laser';
        this.sound = sounds.heavyLaserSound;
        this.tier = tiers.HEAVY;
        this.cooldown = 10;
        this.counter = 0;
        this.power = 30;
        this.pierce = false;
    };
    HeavyLaser.prototype = Laser.prototype;
    HeavyLaser.prototype.constructor = HeavyLaser;

    var ParticleBeam = function(direction) {
        this.direction = direction;
        this.name = 'particleBeam';
        this.skin = 'particle-beam';
        this.sound = sounds.particleBeamSound;
        this.tier = tiers.ADVANCED;
        this.power = 1;
        this.pierce = true;

        this.fire = function(ship, weaponSlot, coordinatePair) {
            if(this.projectile == undefined) {
                this.projectile = new projectiles.types.Beam(ship, weaponSlot, this);
            }

            if(coordinatePair == undefined) {
                this.projectile.fire();
                return;
            }

            this.projectile.fireAt(coordinatePair);
        };

        this.stopFiring = function() {
            if(this.projectile == undefined) {
                return;
            }

            this.projectile.stop(this);
        };

        this.updatePosition = function(ship, weaponSlot) {
            if(this.projectile == undefined) {
                return;
            }

            this.projectile.updatePosition(ship, weaponSlot);
        };
    };
    ParticleBeam.prototype = Weapon.prototype;
    ParticleBeam.prototype.constructor = ParticleBeam;

    var PlasmaCannon = function(direction) {
        this.direction = direction;
        this.velocity = 600;
        this.name = 'plasmaCannon';
        this.skin = 'plasma-cannon';
        this.sound = sounds.plasmaCannonSound;
        this.tier = tiers.ULTIMATE;
        this.cooldown = 200;
        this.counter = 0;
        this.power = 1;
        this.pierce = true;

        this.fire = function(ship, weaponSlot, coordinatePair) {
            if(this.counter < this.cooldown) {
                return;
            }

            if(coordinatePair == undefined) {
                new projectiles.types.Cannon(ship, weaponSlot, this).fire();
                return;
            }

            new projectiles.types.Cannon(ship, weaponSlot, this).fireAt(coordinatePair);
        };
    };
    PlasmaCannon.prototype = Laser.prototype;
    PlasmaCannon.prototype.constructor = PlasmaCannon;

    return {
        preload: preload,
        create: create,
        LightLaser: LightLaser,
        HeavyLaser: HeavyLaser,
        ParticleBeam: ParticleBeam,
        PlasmaCannon: PlasmaCannon
    };
})(tiers, projectiles);