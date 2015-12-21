var hulls = (function () {
    var game;

    function preload(newGame) {
        game = newGame;

        game.load.image('spaceship', '../media/images/sprites/spaceship.gif');
        game.load.spritesheet('cruiser', '../media/images/sprites/cruiser.png', 362, 400);
        game.load.spritesheet('brown-spaceship', '../media/images/sprites/brown_spaceship.gif', 64, 64);
    }

    var Hull = function () {
        this.weaponSlots = [];
    };
    Hull.prototype.fire = function (ship, coordinatePair) {
        for (var i = 0; i < this.weaponSlots.length; i++) {
            this.weaponSlots[i].fire(ship, coordinatePair);
        }
    };
    Hull.prototype.stopFiring = function () {
        for (var i = 0; i < this.weaponSlots.length; i++) {
            var weaponSlot = this.weaponSlots[i];

            for (var j = 0; j < weaponSlot.weapons.length; j++) {
                weaponSlot.weapons[j].stopFiring();
            }
        }
    };
    Hull.prototype.positionUpdated = function (ship) {
        this.weaponSlots.forEach(function (weaponSlot) {
            weaponSlot.positionUpdated(ship);
        });
    };
    Hull.prototype.addWeapon = function (weaponSlotName, weapon) {
        for (var i = 0; i < this.weaponSlots.length; i++) {
            var weaponSlot = this.weaponSlots[i];

            if (weaponSlot.name == weaponSlotName) {
                weaponSlot.addWeapon(weapon);
            }
        }
    };
    Hull.prototype.upgradeWeapon = function (weaponSlotName, newWeapon) {
        for (var i = 0; i < this.weaponSlots.length; i++) {
            var weaponSlot = this.weaponSlots[i];

            if (weaponSlot.name == weaponSlotName) {
                var lowestTierWeapon = weaponSlot.getLowestTierWeapon();

                if (lowestTierWeapon == undefined) {
                    weaponSlot.addWeapon(newWeapon);
                    return;
                }

                weaponSlot.upgradeWeapon(lowestTierWeapon, newWeapon);
            }
        }
    };
    Hull.prototype.getWeaponSlot = function(weaponSlotName) {
        for (var i = 0; i < this.weaponSlots.length; i++) {
            var weaponSlot = this.weaponSlots[i];
            if(weaponSlot.name == weaponSlotName) {
                return weaponSlot;
            }
        }
    };
    Hull.prototype.getWeaponsSlotWithLowestWeaponCount = function (weaponName) {
        var weaponSlotWithLowestWeaponCount;

        this.weaponSlots.forEach(function (weaponSlot) {
            if (weaponSlotWithLowestWeaponCount == undefined ||
                weaponSlot.getWeaponCount(weaponName) < weaponSlotWithLowestWeaponCount.getWeaponCount(weaponName)) {
                weaponSlotWithLowestWeaponCount = weaponSlot;
            }
        });

        return weaponSlotWithLowestWeaponCount;
    };
    Hull.prototype.coolDown = function () {
        this.weaponSlots.forEach(function (weaponSlot) {
            weaponSlot.coolDown();
        });
    };

    var StandardHull = function () {
        this.skin = 'spaceship';
        this.maxHealth = 1000;
        this.width = 64;
        this.height = 64;
        this.weaponSlots = [
            new WeaponSlot('left wing', 48, 18),
            new WeaponSlot('right wing', 48, 43),
            new WeaponSlot('nose', 64, 32)
        ];
    };
    StandardHull.prototype = Hull.prototype;
    StandardHull.prototype.constructor = StandardHull;

    var LightHull = function () {
        this.skin = 'brown-spaceship';
        this.maxHealth = 100;
        this.width = 64;
        this.height = 64;
        this.weaponSlots = [
            new WeaponSlot('left wing', 16, 18),
            new WeaponSlot('right wing', 16, 43)
        ];
    };
    LightHull.prototype = Hull.prototype;
    LightHull.prototype.constructor = LightHull;

    var CruiserHull = function () {
        this.skin = 'cruiser';
        this.maxHealth = 500;
        this.width = 362;
        this.height = 400;
        this.weaponSlots = [
            new WeaponSlot('left wing', 92, 32),
            new WeaponSlot('right wing', 92, 362),
            new WeaponSlot('left wing tip', 16, 82),
            new WeaponSlot('right wing tip', 16, 314),
            new WeaponSlot('left core', 111, 154),
            new WeaponSlot('right core', 111, 246),
            new WeaponSlot('left core tip', 0, 114),
            new WeaponSlot('right core tip', 0, 277)
        ];
    };
    CruiserHull.prototype = Hull.prototype;
    CruiserHull.prototype.constructor = CruiserHull;

    function WeaponSlot(name, x, y) {
        this.name = name;
        this.location = {
            x: x,
            y: y
        };
        this.weapons = [];

        this.getLowestTierWeapon = function (direction) {
            var lowestTierWeapon;

            this.weapons.forEach(function (weapon) {
                if ((lowestTierWeapon == undefined || weapon.isWorseThan(lowestTierWeapon))) {
                    lowestTierWeapon = weapon;
                }
            });

            return lowestTierWeapon;
        };

        this.getWeaponByDirection = function (direction) {
            for (var i = 0; i < this.weapons.length; i++) {
                var weapon = this.weapons[i];
                if (weapon.direction == direction) {
                    return weapon;
                }
            }
        };

        this.addWeapon = function (weapon) {
            this.weapons.push(weapon);
        };

        this.upgradeWeapon = function (oldWeapon, newWeapon) {
            newWeapon.direction = oldWeapon.direction;
            this.weapons[this.weapons.indexOf(oldWeapon)] = newWeapon;
        };

        this.positionUpdated = function (ship) {
            for (var i = 0; i < this.weapons.length; i++) {
                this.weapons[i].updatePosition();
            }
        };

        this.getWeaponCount = function (name) {
            var count = 0;

            this.weapons.forEach(function (weapon) {
                if (name == undefined || weapon.name == name) {
                    count++;
                }
            });

            return count;
        };

        this.fire = function(ship, coordinatePair) {
            for (var j = 0; j < this.weapons.length; j++) {
                this.weapons[j].fire(ship, this, coordinatePair);
            }
        };

        this.coolDown = function () {
            this.weapons.forEach(function (weapon) {
                weapon.coolDown();
            });
        };
    }

    return {
        preload: preload,
        StandardHull: StandardHull,
        LightHull: LightHull,
        CruiserHull: CruiserHull
    };
})();