var upgrades = (function(weapons, directions) {
    var game;
    var sounds = {};
    var upgrades;

    function preload(newGame) {
        game = newGame;

        game.load.image('light-laser-upgrade', 'media/images/sprites/upgrades/light_laser_upgrade.png');
        game.load.image('heavy-laser-upgrade', 'media/images/sprites/upgrades/heavy_laser_upgrade.png');
        game.load.image('particle-beam-upgrade', 'media/images/sprites/upgrades/particle_beam_upgrade.png');
        game.load.image('plasma-cannon-upgrade', 'media/images/sprites/upgrades/plasma_cannon_upgrade.png');

        game.load.audio('weapon-upgrade', 'media/sounds/effects/weapon_upgrade.mp3');
    }

    function create() {
        sounds.weaponUpgrade = game.add.audio('weapon-upgrade');

        upgrades = new Upgrades();
    }

    function Upgrades() {
        this.entities = [];
        this.types = [
            [
                LightLaserUpgrade,
                HeavyLaserUpgrade,
                ParticleBeamUpgrade
            ]
        ];

        this.group = game.add.group();
        this.group.enableBody = true;

        this.getByGuid = function(guid) {
            for (var i = 0; i < this.entities.length; i++) {
                var upgrade = this.entities[i];
                if(upgrade.sprite.guid == guid) {
                    return upgrade;
                }
            }
        };

        this.spawn = function(upgrade) {
            upgrade.sprite = this.group.create(game.world.width, Math.floor(Math.random() * 601), upgrade.skin);
            upgrade.sprite.guid = createGuid();
            upgrade.sprite.body.velocity.x = -50;
            this.entities.push(upgrade);
        };

        this.spawnRandom = function() {
            this.spawn(this.getRandomUpgrade());
        };

        this.remove = function(upgrade) {
            upgrade.playSound();
            this.entities.splice(this.entities.indexOf(upgrade), 1);
            upgrade.sprite.kill();
        };

        this.getRandomUpgrade = function() {
            var randomIndex = getRandomIndex(this.types);
            return new this.types[randomIndex][getRandomIndex(this.types[randomIndex])]();
        };

        function getRandomIndex(array) {
            return Math.floor(Math.random() * array.length)
        }
    }

    var WeaponUpgrade = function() {};
    WeaponUpgrade.prototype.playSound = function() {
        sounds.weaponUpgrade.play();
    };

    var LightLaserUpgrade = function() {
        this.skin = 'light-laser-upgrade';
        this.weapon = new weapons.LightLaser(directions.EAST);

        this.applyTo = function(ship) {
            upgrades.remove(this);

            var weaponSlotWithLowestWeaponCount = ship.hull.getWeaponsSlotWithLowestWeaponCount();

            if(weaponSlotWithLowestWeaponCount == undefined) {
                return;
            }

            switch (weaponSlotWithLowestWeaponCount.getWeaponCount()) {
                case 0:
                    weaponSlotWithLowestWeaponCount.addWeapon(this.weapon);
                    break;
                case 1:
                    this.weapon.direction = directions.NORTH_EAST;
                    weaponSlotWithLowestWeaponCount.addWeapon(this.weapon);
                    break;
                case 2:
                    this.weapon.direction = directions.SOUTH_EAST;
                    weaponSlotWithLowestWeaponCount.addWeapon(this.weapon);
                    break;
            }
        };
    };
    LightLaserUpgrade.prototype = WeaponUpgrade.prototype;
    LightLaserUpgrade.prototype.constructor = LightLaserUpgrade;

    var HeavyLaserUpgrade = function() {
        this.skin = 'heavy-laser-upgrade';
        this.weapon = new weapons.HeavyLaser(directions.EAST);

        this.applyTo = function(ship) {
            upgrades.remove(this);

            var weaponSlotWithLowestWeaponCount = ship.hull.getWeaponsSlotWithLowestWeaponCount(this.weapon.name);

            if(weaponSlotWithLowestWeaponCount == undefined) {
                return;
            }

            var lowestTierWeapon = weaponSlotWithLowestWeaponCount.getLowestTierWeapon();
            if(lowestTierWeapon !== undefined && this.weapon.isBetterThan(lowestTierWeapon)) {
                weaponSlotWithLowestWeaponCount.upgradeWeapon(lowestTierWeapon, this.weapon);
            } else {
                switch (weaponSlotWithLowestWeaponCount.getWeaponCount()) {
                    case 0:
                        weaponSlotWithLowestWeaponCount.addWeapon(this.weapon);
                        break;
                    case 1:
                        this.weapon.direction = directions.NORTH_EAST;
                        weaponSlotWithLowestWeaponCount.addWeapon(this.weapon);
                        break;
                    case 2:
                        this.weapon.direction = directions.SOUTH_EAST;
                        weaponSlotWithLowestWeaponCount.addWeapon(this.weapon);
                        break;
                }
            }
        };
    };
    HeavyLaserUpgrade.prototype = WeaponUpgrade.prototype;
    HeavyLaserUpgrade.prototype.constructor = HeavyLaserUpgrade;

    var ParticleBeamUpgrade = function() {
        this.skin = 'particle-beam-upgrade';
        this.weapon = new weapons.ParticleBeam(directions.EAST);

        this.applyTo = function(ship) {
            upgrades.remove(this);

            var weaponSlotWithLowestWeaponCount = ship.hull.getWeaponsSlotWithLowestWeaponCount(this.weapon.name);

            if(weaponSlotWithLowestWeaponCount == undefined || weaponSlotWithLowestWeaponCount.getWeaponCount(this.weapon.name) > 0) {
                return;
            }

            var weapon = weaponSlotWithLowestWeaponCount.getWeaponByDirection(this.weapon.direction);
            if(weapon !== undefined && this.weapon.isBetterThan(weapon)) {
                weaponSlotWithLowestWeaponCount.upgradeWeapon(weapon, this.weapon);
            } else if(weaponSlotWithLowestWeaponCount.getWeaponCount() == 0) {
                weaponSlotWithLowestWeaponCount.addWeapon(this.weapon);
            }
        };
    };
    ParticleBeamUpgrade.prototype = WeaponUpgrade.prototype;
    ParticleBeamUpgrade.prototype.constructor = ParticleBeamUpgrade;

    var PlasmaCannonUpgrade = function() {
        this.skin = 'plasma_cannon-upgrade';
        this.weapon = new weapons.PlasmaCannon(directions.EAST);

        this.applyTo = function(ship) {
            upgrades.remove(this);

            var preferredWeaponSlot = ship.hull.getWeaponSlot('nose');
            if(preferredWeaponSlot == undefined || preferredWeaponSlot.getWeaponCount(this.weapon.name) > 0) {
                return;
            }

            var weapon = preferredWeaponSlot.getWeaponByDirection(this.weapon.direction);
            if(weapon !== undefined && this.weapon.isBetterThan(weapon)) {
                preferredWeaponSlot.upgradeWeapon(weapon, this.weapon);
            } else if(preferredWeaponSlot.getWeaponCount() == 0) {
                preferredWeaponSlot.addWeapon(this.weapon);
            }
        };
    };
    PlasmaCannonUpgrade.prototype = WeaponUpgrade.prototype;
    PlasmaCannonUpgrade.prototype.constructor = PlasmaCannonUpgrade;

    function getUpgrades() {
        return upgrades;
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
        getUpgrades: getUpgrades,
        weapons: {
            LightLaserUpgrade: LightLaserUpgrade
        }
    }

})(weapons, directions);