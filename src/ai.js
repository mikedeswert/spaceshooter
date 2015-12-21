var ai = (function (utils) {
    var game;

    function preload(newGame) {
        game = newGame;
    }

    var Ai = function () {};
    Ai.prototype.isComplete = false;
    Ai.prototype.cooldown = 0;
    Ai.prototype.loopCounter = 0;
    Ai.prototype.delay = 0;
    Ai.prototype.delayCounter = 0;
    Ai.prototype.reset = function() {};
    Ai.prototype.play = function() {
        if(this.delayCounter < this.delay) {
            this.delayCounter++;
            return;
        }

        this.isComplete = true;
        this.playImpl.apply(this, arguments);
    };
    Ai.prototype.loop = function() {
        if(this.loopCounter < this.cooldown) {
            this.loopCounter++;
            return;
        }

        this.play.apply(this, arguments);
        if(this.isComplete == true) {
            this.loopCounter = 0;
            this.reset();
        }
    };
    Ai.prototype.setCooldown = function(cooldown) {
        this.cooldown = cooldown;
    };
    Ai.prototype.setDelay = function(delay) {
        this.delay = delay
    };

    var Move = function () {
        this.playImpl = function (ship, coordinatePair) {
            var buffer = 5;
            var xComplete = false;
            var yComplete = false;

            if (coordinatePair.x > ship.sprite.x + buffer && ship.sprite.body.velocity.x <= 0) {
                ship.sprite.body.velocity.x = ship.velocity;
            } else if (coordinatePair.x < ship.sprite.x - buffer && ship.sprite.body.velocity.x >= 0) {
                ship.sprite.body.velocity.x = ship.velocity * -1;
            } else {
                ship.sprite.body.velocity.x = 0;
                xComplete = true;
            }

            if (coordinatePair.y > ship.sprite.y + buffer && ship.sprite.body.velocity.y <= 0) {
                ship.sprite.body.velocity.y = ship.velocity;
            } else if (coordinatePair.y < ship.sprite.y - buffer && ship.sprite.body.velocity.y >= 0) {
                ship.sprite.body.velocity.y = ship.velocity * -1;
            } else {
                ship.sprite.body.velocity.y = 0;
                yComplete = true
            }

            this.isComplete = xComplete && yComplete;
        };

        this.isComplete = false;
    };
    Move.prototype = Ai.prototype;
    Move.prototype.constructor = Move;

    var Follow = function() {
        this.playImpl = function(ship) {
            follow(ship);
        };
    };
    Follow.prototype = Ai.prototype;
    Follow.prototype.constructor = Follow;

    var Fire = function () {
        this.playImpl = function (ship, weaponSlotNames) {
            fire(ship, weaponSlotNames);
        };
    };
    Fire.prototype = Ai.prototype;
    Fire.prototype.constructor = Fire;

    var FollowAndFire = function () {
        this.playImpl = function (ship) {
            if (game.player.sprite.y <= ship.sprite.y + getBuffer() && game.player.sprite.y >= ship.sprite.y - getBuffer()) {
                ship.fire();
                ship.sprite.body.velocity.y = 0;
                return;
            }

            follow(ship);
        };
    };
    FollowAndFire.prototype = Ai.prototype;
    FollowAndFire.prototype.constructor = FollowAndFire;

    var Burst = function(_duration) {
        this.duration = _duration;
        this.durationCounter = 0;

        this.playImpl = function (ship, weaponSlotNames) {
            weaponSlotNames.forEach(function (weaponSlotName) {
                ship.hull.getWeaponSlot(weaponSlotName).fire(ship);
            });
        };

        this.loop = function(ship, weaponSlotNames) {
            if(this.loopCounter < this.cooldown) {
                this.loopCounter++;
                return;
            }

            this.play(ship, weaponSlotNames);
            if(this.durationCounter < this.duration) {
                this.durationCounter++;
                return;
            }

            this.loopCounter = 0;
            this.durationCounter = 0;
            this.reset();
            ship.stopFiring();
        }
    };
    Burst.prototype = Ai.prototype;
    Burst.prototype.constructor = Burst;

    var SeekAndDestroy = function () {
        this.playImpl = function (ship, targetShip, weaponSlotNames) {
            var targetCoordinatePair = new utils.CoordinatePair(targetShip.sprite.x, targetShip.sprite.y);

            weaponSlotNames.forEach(function (weaponSlotName) {
                ship.hull.getWeaponSlot(weaponSlotName).fire(ship, targetCoordinatePair);
            });
        }
    };
    SeekAndDestroy.prototype = Ai.prototype;
    SeekAndDestroy.prototype.constructor = SeekAndDestroy;

    var Bombardment = function (_startDirection, _endDirection, _clockwise) {
        var bombardment = this;
        var startDirection = _startDirection;
        var endDirection = _endDirection;
        var clockwise = _clockwise;
        var targetAngles = {};
        var FULL_CIRCLE = 2 * Math.PI;

        this.playImpl = function (ship, weaponSlotNames) {
            weaponSlotNames.forEach(function (weaponSlotName) {
                bombardment.isComplete = fireWeapons(ship, weaponSlotName);
            });
        };

        this.reset = function() {
            this.isComplete = false;
            targetAngles = {};
        };

        function fireWeapons(ship, weaponSlotName) {
            var weaponSlotCoordinatePair = getWeaponSlotCoordinatePair(ship, weaponSlotName);

            initializeTargetAngle(weaponSlotCoordinatePair, weaponSlotName);

            if(isComplete(targetAngles[weaponSlotName], weaponSlotCoordinatePair)) {
                return true;
            }

            adjustTargetAngle(weaponSlotName);
            ship.hull.getWeaponSlot(weaponSlotName).fire(ship, getTargetCoordinates(weaponSlotCoordinatePair, targetAngles[weaponSlotName]));

            return false;
        }

        function initializeTargetAngle(weaponSlotCoordinatePair, weaponSlotName) {
            if (targetAngles[weaponSlotName] == undefined) {
                targetAngles[weaponSlotName] = getAngle(weaponSlotCoordinatePair, startDirection);
            }
        }

        function isComplete(targetAngle, weaponSlotCoordinatePair) {
            var startDirectionAngle = getAngle(weaponSlotCoordinatePair, startDirection);
            var endDirectionAngle = getAngle(weaponSlotCoordinatePair, endDirection);

            if(clockwise == true) {
                if(startDirectionAngle < endDirectionAngle) {
                    return targetAngle < endDirectionAngle - FULL_CIRCLE;
                }

                return targetAngle < endDirectionAngle;
            }

            if(startDirectionAngle < endDirectionAngle) {
                return targetAngle > endDirectionAngle;
            }

            return targetAngle > endDirectionAngle + FULL_CIRCLE;
        }

        function adjustTargetAngle(weaponSlotName) {
            if(clockwise == true) {
                targetAngles[weaponSlotName] -= getIncrement();
                return;
            }

            targetAngles[weaponSlotName] += getIncrement();
        }

        function getWeaponSlotCoordinatePair(ship, weaponSlotName) {
            var weaponSlot = ship.hull.getWeaponSlot(weaponSlotName);
            return new utils.CoordinatePair(ship.sprite.x + weaponSlot.location.x, ship.sprite.y + weaponSlot.location.y)
        }

        function getIncrement() {
            return FULL_CIRCLE / 150
        }

        function getAngle(originCoordinatePair, direction) {
            var coordinates = new utils.CoordinatePair(originCoordinatePair.x + direction.xMod, originCoordinatePair.y + direction.yMod);
            return coordinates.getAngleInRadians(originCoordinatePair);
        }

        function getTargetCoordinates(originCoordinatePair, angle) {
            var targetX = originCoordinatePair.x - Math.cos(angle);
            var targetY = originCoordinatePair.y + Math.sin(angle);
            return new utils.CoordinatePair(targetX, targetY);
        }
    };
    Bombardment.prototype = Ai.prototype;
    Bombardment.prototype.constructor = Bombardment;

    function follow(ship) {
        ship.sprite.body.velocity.x = ship.velocity;

        if (game.player.sprite.y > (ship.sprite.y + ship.sprite.height / 2) + getBuffer()) {
            ship.sprite.body.velocity.y = 50;
        } else if (game.player.sprite.y < (ship.sprite.y + ship.sprite.height / 2) - getBuffer()) {
            ship.sprite.body.velocity.y = -50;
        } else {
            ship.sprite.body.velocity.y = 0;
        }

        ship.positionUpdated();
    }

    function fire(ship, weaponSlotNames) {
        weaponSlotNames.forEach(function (weaponSlotName) {
            ship.hull.getWeaponSlot(weaponSlotName).fire(ship);
        });
    }

    function getBuffer() {
        return game.player.sprite.height / 2;
    }

    return {
        preload: preload,
        Move: Move,
        Follow: Follow,
        Fire: Fire,
        FollowAndFire: FollowAndFire,
        Burst: Burst,
        SeekAndDestroy: SeekAndDestroy,
        Bombardment: Bombardment
    }
})(utils);