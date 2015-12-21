var directions = (function() {
    return {
        NORTH: {
            xMod: 0,
            yMod: -1
        },
        NORTH_EAST: {
            xMod: 1,
            yMod: -1
        },
        EAST: {
            xMod: 1,
            yMod: 0
        },
        SOUTH_EAST: {
            xMod: 1,
            yMod: 1
        },
        SOUTH: {
            xMod: 0,
            yMod: 1
        },
        SOUTH_WEST: {
            xMod: -1,
            yMod: 1
        },
        WEST: {
            xMod: -1,
            yMod: 0
        },
        NORTH_WEST: {
            xMod: -1,
            yMod: -1
        }
    }
})();