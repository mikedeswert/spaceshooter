(function(weapons, hulls, directions, ships, ai, upgrades, projectiles) {
    var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

    var background = {};
    var cursors;
    var enemies;
    var enemyLimit = 3;
    var isGameOver = false;
    var music;

    function preload() {
        game.load.image('background', 'media/images/background/space.png');
        //game.load.audio('soundtrack', 'media/sounds/tracks/BioBlitz - Lobsters & Such.mp3');

        projectiles.preload(game);
        weapons.preload(game);
        upgrades.preload(game);
        hulls.preload(game);
        ai.preload(game);
        ships.preload(game);
    }

    function create() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        background.one = game.add.sprite(0, 0, 'background');
        background.two = game.add.sprite(game.world.width, 0, 'background');

        projectiles.create();
        weapons.create();
        upgrades.create();
        ships.create();
        game.player = new ships.Player(game);
        enemies = ships.getEnemies();

        cursors = game.input.keyboard.createCursorKeys();
        spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.SPACEBAR);

        game.enemiesKilled = 0;

        game.texts = {};
        game.texts.score = game.add.text(16, 16, 'score: 0', { fill:'#FFF', font: '12px "Press Start 2P"'});
        game.texts.playerHealth = game.add.text(16, 32, 'health: 1000', { fill:'#FFF', font: '12px "Press Start 2P"'});
        game.texts.level = game.add.text(game.world.width / 2 - 80, 16, 'Level 1', { fill:'#FFF', font: '24px "Press Start 2P"'});

        game.score = 0;
        game.increaseScore = function(score) {
            this.score += score;
            this.texts.score.text = 'score: ' + this.score;
        };

        game.updatePlayerHealth = function(health) {
            this.texts.playerHealth.text = 'health: ' + health;
        };

        music = game.add.audio('soundtrack');
        music.loopFull(0.5);
    }

    function update() {
        scrollBackground();
        if(!isGameOver) {
            killProjectiles();
            parseInput();
            handleProjectiles();
            spawnEnemies();
            coolDown();
            enemies.move();
        }
    }

    function coolDown() {
        game.player.coolDown();
        enemies.coolDown();
    }

    function killProjectiles() {
        projectiles.getProjectiles().entities.forEach(function(projectile) {
            if(projectile.sprite.x < 0 || projectile.sprite.x > game.world.width * 2) {
                projectile.hit();
            }
        })
    }

    function handleProjectiles() {
        game.physics.arcade.overlap(enemies.group, projectiles.getProjectiles().group, hitEnemy, null, this);
        game.physics.arcade.overlap(game.player.sprite, projectiles.getProjectiles().group, damagePlayer, null, this);
        game.physics.arcade.overlap(game.player.sprite, upgrades.getUpgrades().group, applyUpgrade, null, this);
    }

    function hitEnemy(enemy, projectile) {
        projectile = projectiles.getProjectiles().getByGuid(projectile.guid);
        enemy = enemies.getByGuid(enemy.guid);

        if(projectile == undefined || enemy == undefined || projectile.isEnemyProjectile()) {
            return;
        }

        enemy.damage(projectile);
    }

    function applyUpgrade(playerSprite, upgrade) {
        upgrade = upgrades.getUpgrades().getByGuid(upgrade.guid);
        if(upgrade == undefined) {
            return;
        }

        upgrade.applyTo(game.player);
    }

    function damagePlayer(playerSprite, projectile) {
        projectile = projectiles.getProjectiles().getByGuid(projectile.guid);
        if(projectile == undefined || !projectile.isEnemyProjectile()) {
            return;
        }

        projectile.hit();
        game.player.damage(projectile);

        if(game.player.health <= 0) {
            gameOver();
        }
    }

    function gameOver() {
        game.add.text(190, 280, 'GAME OVER', { fill:'#FFF', font: '48px "Press Start 2P"'})
        music.volume = 0.2;
        isGameOver = true;
    }
var bossSpawned = false;
    function spawnEnemies() {
        if(enemies.getExisting().length < enemyLimit) {
            spawnEnemy();
        }
    }

    function spawnEnemy() {
        // if(bossSpawned == false) {
        //     new ships.enemies.Genocide();
        //     bossSpawned = true;
        // }

        new ships.enemies.Pirate();
    }

    function scrollBackground() {
        for (var property in background) {
            if(background.hasOwnProperty(property)) {
                if (background[property].x <= game.world.width * -1) {
                    background[property].x = game.world.width;
                    background[property].x -= 1;
                } else {
                    background[property].x -= 1;
                }
            }
        }
    }

    function parseInput() {
        handleCursors();
        handleSpacebar();
    }

    function handleCursors() {
        if(cursors.left.isDown) {
            game.player.sprite.body.velocity.x = -game.player.velocity;
        } else if(cursors.right.isDown) {
            game.player.sprite.body.velocity.x = game.player.velocity;
        } else {
            game.player.sprite.body.velocity.x = 0;
        }

        if(cursors.up.isDown) {
            game.player.sprite.body.velocity.y = -game.player.velocity;
        } else if(cursors.down.isDown) {
            game.player.sprite.body.velocity.y = game.player.velocity;
        } else {
            game.player.sprite.body.velocity.y = 0;
        }

        game.player.positionUpdated();
    }

    function handleSpacebar() {
        if(spacebar.isDown) {
            game.player.fire();
        } else if(spacebar.isUp) {
            game.player.stopFiring();
        }
    }

    return game;
})(weapons, hulls, directions, ships, ai, upgrades, projectiles);

