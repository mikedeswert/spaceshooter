var utils = (function() {

    var CoordinatePair = function(x, y) {
        this.x = x;
        this.y = y;

        this.getAngle = function(coordinatePair) {
            var relativePosition = this.getRelativePosition(coordinatePair);
            var angle = Math.atan2(relativePosition.y, relativePosition.x);

            return angle * (180 / Math.PI);
        };

        this.getAngleInRadians = function(coordinatePair) {
            var relativePosition = this.getRelativePosition(coordinatePair);
            var angle = Math.atan2(relativePosition.y, relativePosition.x);

            if(angle < 0) {
                angle = Math.abs(angle) + Math.PI;
            }

            return angle;
        };

        this.getRelativePosition = function(coordinatePair) {
            var xDelta = (coordinatePair.x - this.x) * -1;
            var yDelta = (coordinatePair.y - this.y) * -1;

            return new CoordinatePair(xDelta, yDelta)
        };
    };

    return {
        CoordinatePair: CoordinatePair
    }
})();