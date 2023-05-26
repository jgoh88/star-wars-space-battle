// Define global variable for HTML elements
let game_container
let game_end_container
let game_alert_container

// Define global variables
let game_grid_columns_num
let game_grid_rows_num
let game_grid
let game_grid_blocks
let max_hp_bar_width
const game_alert_message_duration = 1000  // in miliseconds
const cheat_mode = false

let x_wing
// let death_star
let galactic_empire
let game_ended
let curr_level


const levels = {
    1: [{ship_name: 'death-star', max_hp:100, start_position:1290, laser_speed:10, movement_speed:500}],

    2: [{ship_name: 'death-star', max_hp:200, start_position:1290, laser_speed:10, movement_speed:500}],

    3: [{ship_name: 'death-star', max_hp:300, start_position:1290, laser_speed:5, movement_speed:300}],

    4: [{ship_name: 'death-star', max_hp:200, start_position:1095, laser_speed:10, movement_speed:300},
        {ship_name: 'death-star', max_hp:200, start_position:1484, laser_speed:10, movement_speed:300}],

    5: [{ship_name: 'death-star', max_hp:300, start_position:1095, laser_speed:5, movement_speed:300},
        {ship_name: 'death-star', max_hp:300, start_position:1484, laser_speed:5, movement_speed:300}],

    6: [{ship_name: 'death-star', max_hp:200, start_position:1095, laser_speed:10, movement_speed:200},
        {ship_name: 'death-star', max_hp:200, start_position:1484, laser_speed:10, movement_speed:200},
        {ship_name: 'death-star', max_hp:200, start_position:1830, laser_speed:10, movement_speed:200}],

    7: [{ship_name: 'death-star', max_hp:300, start_position:1095, laser_speed:5, movement_speed:200},
        {ship_name: 'death-star', max_hp:300, start_position:1484, laser_speed:5, movement_speed:200},
        {ship_name: 'death-star', max_hp:300, start_position:1830, laser_speed:5, movement_speed:200}],    
}


// Class for spaceship
// - default properties
// - up, down, left right movement
// - crashing into enemy
// - spaceship laser move forward
// - condition when reaching edge of screen
// - condition when hitting enemy ship
class PlayerShip {
    constructor(ship_name, max_lives, position) {
        this.ship_name = ship_name
        this.max_lives = max_lives
        this.lives = max_lives
        this.laser_speed = 30  // in milisecond
        this.firepower = cheat_mode ? 10 : 1
        this.fired_laser = false
        this.laser_movement_intervals = []
        this.position = position  // center of x-wing
        this.front = this.position - game_grid_columns_num  // the front position, to check so that it does not go off screen
        this.rear = this.position + game_grid_columns_num  // the rear position, to check so that it does not go off screen
        this.left = this.position + game_grid_columns_num - 2  // the left position, to check so that it does not go off screen
        this.right = this.position + game_grid_columns_num + 2  // the right position, to check so that it does not go off screen
        this.area = [  // area occupied by x-wing to detect it being hit
            this.position - game_grid_columns_num,
            this.position, 
            this.position + game_grid_columns_num - 2, this.position + game_grid_columns_num - 1, this.position + game_grid_columns_num, this.position + game_grid_columns_num + 1, this.position + game_grid_columns_num + 2,
        ]
        this.score = 0
    }

    placeShip() {
        game_grid_blocks[this.position].html_element.classList.add(this.ship_name)

        // this.area.forEach((block) => game_grid_blocks[block].html_element.classList.add(`${this.ship_name}-area`))
        this.area.forEach((block) => game_grid_blocks[block].spaceships.push(this))
    }

    removeShip() {
        game_grid_blocks[this.position].html_element.classList.remove(this.ship_name)

        // this.area.forEach((block) => game_grid_blocks[block].html_element.classList.remove(`${this.ship_name}-area`))
        this.area.forEach((block) => game_grid_blocks[block].spaceships.splice(game_grid_blocks[block].spaceships.indexOf(this),1))
    }

    flyShip(flyDirection) {
        this.removeShip()  // Remove ship from grid

        // Get new ship position
        if (flyDirection === 'ArrowUp') {
            // Fly forward
            if (this.front >= game_grid_columns_num) { //  do nothing if front of x-wing is already at the front edge
    
                this.position -= game_grid_columns_num
                this.front -= game_grid_columns_num
                this.rear -= game_grid_columns_num
                this.left -= game_grid_columns_num
                this.right -= game_grid_columns_num
        
                this.area = this.area.map((block) => block -= game_grid_columns_num)
            }
        } else if (flyDirection === 'ArrowDown') {
            // Fly backwards
            if (this.rear <= game_grid_blocks.length - game_grid_columns_num - 1) { //  do nothing if front of x-wing is already at the rear edge
     
                this.position += game_grid_columns_num
                this.front += game_grid_columns_num
                this.rear += game_grid_columns_num
                this.left += game_grid_columns_num
                this.right += game_grid_columns_num
        
                this.area = this.area.map((block) => block += game_grid_columns_num)
            }
        } else if (flyDirection === 'ArrowLeft') {
            // Fly Left
            if (this.left%game_grid_columns_num > 0) { //  do nothing if front of x-wing is already at the left edge
    
                this.position -= 1
                this.front -= 1
                this.rear -= 1
                this.left -= 1
                this.right -= 1
        
                this.area = this.area.map((block) => block -= 1)
            }    
        } else if (flyDirection === 'ArrowRight') {
            // Fly Right
            if (this.right%game_grid_columns_num < game_grid_columns_num - 1) { //  do nothing if front of x-wing is already at the right edge
    
                this.position += 1
                this.front += 1
                this.rear += 1
                this.left += 1
                this.right += 1
        
                this.area = this.area.map((block) => block += 1)
            }
        }

        this.placeShip()  //  Place ship back to the grid

        // Check for collision with enemy ship, if yes, then take damage
        if (this.area.some((block) => game_grid_blocks[block].spaceships.find((ship) => ship.constructor.name !== this.constructor.name))) {
            this.takeDamage()
        }
    }

    fireLaser() {
        if (this.fired_laser) {return}

        if (!cheat_mode) {
            this.fired_laser = true
        }
        
        let laser_position = this.front - game_grid_columns_num

        game_grid_blocks[laser_position].html_element.classList.add(`${this.ship_name}-laser`)

        const moveLaser = () => {
            game_grid_blocks[laser_position].html_element.classList.remove(`${this.ship_name}-laser`)
            laser_position -= game_grid_columns_num
            if (laser_position < 0) {
                this.laser_movement_intervals.splice(this.laser_movement_intervals.indexOf(moving_laser),1)
                clearInterval(moving_laser)
            } else {
                const ships_in_the_block = game_grid_blocks[laser_position].spaceships
                const enemy_ship = ships_in_the_block.find((ship) => ship.constructor.name !== this.constructor.name)
                let laser_hit_enemy = false
                
                if (enemy_ship) {
                    enemy_ship.takeDamage(this.firepower)
                    laser_hit_enemy = true
                    this.setScore()
                    this.laser_movement_intervals.splice(this.laser_movement_intervals.indexOf(moving_laser),1)
                    clearInterval(moving_laser)
                }

                if (!laser_hit_enemy) {
                    game_grid_blocks[laser_position].html_element.classList.add(`${this.ship_name}-laser`)
                }
            }
        }

        const moving_laser = setInterval(moveLaser, this.laser_speed)
        this.laser_movement_intervals.push(moving_laser)

        // Add laser sound effect
        if (!this.laser_sound_effect) {
            this.laser_sound_effect = new Audio('audio/x-wing-laser.mp3')
            this.laser_sound_effect.volume = .05
        }
        this.laser_sound_effect.currentTime = 0
        this.laser_sound_effect.play()

        if (this.fired_laser) {
            setTimeout(() => this.fired_laser = false, 200)
        }
        
    }

    clearAllFiredLaser() {
        this.laser_movement_intervals.forEach((moving_laser) => clearInterval(moving_laser))
        const blocks_with_fired_laser = game_grid_blocks.filter((block) => block.html_element.classList.contains(`${this.ship_name}-laser`))
        blocks_with_fired_laser.forEach((block) => block.html_element.classList.remove(`${this.ship_name}-laser`))

        this.laser_movement_intervals.splice(0, this.laser_movement_intervals.length)
    }

    displayLives() { 
        if (!this.lives_display) {
            // Add player icon
            const player_icon = document.createElement('img')
            player_icon.classList.add('character-icon')
            player_icon.setAttribute('src', `img/${this.ship_name}-icon.png`)
            document.querySelector('.player-status-window').appendChild(player_icon)

            this.lives_display = document.createElement('div')
            this.lives_display.classList.add(`${this.ship_name}-lives-container`)
            document.querySelector('.player-status-window').appendChild(this.lives_display)

            this.lives_display_icon = []
            this.lives_lost_display_icon = []
            for (let i=1; i<=this.max_lives; i++) {
                const live = document.createElement('img')
                live.classList.add(`${this.ship_name}-lives`)
                live.setAttribute('src','img/live-icon.png')

                this.lives_display_icon.push(live)
                this.lives_display.appendChild(live)
            }
        }
        
        if (this.lives === this.lives_display_icon.length) {return}

        const lost_live = this.lives_display_icon.pop()
        lost_live.classList.add('lost-lives')
        this.lives_lost_display_icon.push(lost_live)

    }

    displayScore() {
        if (!this.score_display) {
            const score_container = document.createElement('div')
            score_container.classList.add('score-container')

            this.score_display = document.createElement('p')
            this.score_display.classList.add('current-score')
            score_container.appendChild(this.score_display)

            document.querySelector('.player-status-window').appendChild(score_container)
        }
             
        this.score_display.textContent = `Score: ${this.score}`
    }

    setScore() {
        if (game_ended) {return}
        this.score += this.firepower*10
        this.displayScore()
    }

    takeDamage(damage=1) {
        if (game_ended) {return}
        if (cheat_mode) {damage=0}

        game_grid_blocks[this.position].html_element.classList.add('damaged-player')
        const position = this.position
        setTimeout(() => game_grid_blocks[position].html_element.classList.remove('damaged-player'),100)

        this.lives -= damage
        this.displayLives()

        if (this.lives > 0) {return}
        checkGameEnd()
    }
}

// Class for enemy spaceship
// - default properties
// - enemy space moving left and right
// - laser move downward
// - condition when reaching edge of screen
// - condition when hitting space ship
class EnemyShip {
    constructor(ship_name, max_hp, position, laser_speed, movement_speed) {
        this.ship_name = ship_name
        this.max_hp = max_hp
        this.hp = max_hp
        this.laser_speed = laser_speed  // in milisecond
        this.super_laser_firing_timeouts = []
        this.movement_speed = movement_speed  // in millisecond
        this.movement_direction = this.setInitialDirection()  // randomly set the initial movement direction
        this.position = position  // center of enemy ship
        this.front = this.position - 3*game_grid_columns_num  // the front position, to check so that it does not go off screen
        this.rear = this.position + 3*game_grid_columns_num  // the rear position, to check so that it does not go off screen
        this.left = this.position - 3  // the left position, to check so that it does not go off screen
        this.right = this.position + 3  // the right position, to check so that it does not go off screen
        this.area = [  // area occupied by x-wing to detect it being hit
            this.position-3*game_grid_columns_num-1, this.position-3*game_grid_columns_num, this.position-3*game_grid_columns_num+1,
            this.position-2*game_grid_columns_num-2, this.position-2*game_grid_columns_num-1, this.position-2*game_grid_columns_num, this.position-2*game_grid_columns_num+1, this.position-2*game_grid_columns_num+2,
            this.position-game_grid_columns_num-3, this.position-game_grid_columns_num-2, this.position-game_grid_columns_num-1, this.position-game_grid_columns_num, this.position-game_grid_columns_num+1, this.position-game_grid_columns_num+2, this.position-game_grid_columns_num+3,
            this.position-3, this.position-2, this.position-1, this.position, this.position+1, this.position+2, this.position+3,
            this.position+game_grid_columns_num-3, this.position+game_grid_columns_num-2, this.position+game_grid_columns_num-1, this.position+game_grid_columns_num, this.position+game_grid_columns_num+1, this.position+game_grid_columns_num+2, this.position+game_grid_columns_num+3,
            this.position+2*game_grid_columns_num-2, this.position+2*game_grid_columns_num-1, this.position+2*game_grid_columns_num, this.position+2*game_grid_columns_num+1, this.position+2*game_grid_columns_num+2,
            this.position+3*game_grid_columns_num-1, this.position+3*game_grid_columns_num, this.position+3*game_grid_columns_num+1,
        ]
    }

    setInitialDirection() { 
        if (Math.floor(Math.random()*2) === 0) {
            return -1
        } else {
            return 1
        }   
    }

    placeShip() {
        game_grid_blocks[this.position].html_element.classList.add(this.ship_name)

        // this.area.forEach((block) => game_grid_blocks[block].html_element.classList.add(`${this.ship_name}-area`))
        this.area.forEach((block) => game_grid_blocks[block].spaceships.push(this))
    }

    removeShip() {
        game_grid_blocks[this.position].html_element.classList.remove(this.ship_name)

        // this.area.forEach((block) => game_grid_blocks[block].html_element.classList.remove(`${this.ship_name}-area`))
        this.area.forEach((block) => game_grid_blocks[block].spaceships.splice(game_grid_blocks[block].spaceships.indexOf(this),1))
    }

    flyShip() {
        const moveShip = () => {
            this.removeShip()

            // Change direction when at the edge of left and right
            if (this.left%game_grid_columns_num === 0 || this.right%game_grid_columns_num === game_grid_columns_num-1) {
                this.movement_direction *= -1
            }

            this.position += this.movement_direction
            this.front += this.movement_direction
            this.rear += this.movement_direction
            this.left += this.movement_direction
            this.right += this.movement_direction
            this.area = this.area.map((block) => block += this.movement_direction)

            this.placeShip()

            // Check if ship collide with player, if yes, player take damage
            let ship_hit_player = false
            this.area.forEach((block) => {
                if (ship_hit_player) {return}

                const ships_in_the_block = game_grid_blocks[block].spaceships
                const player_ship = ships_in_the_block.find((ship) => ship.constructor.name !== this.constructor.name)
                
                if (player_ship) {
                    player_ship.takeDamage()
                    ship_hit_player = true
                }
            })
        }
        
        this.movement_interval = setInterval(moveShip, this.movement_speed)
    }

    stopShip() {
        clearInterval(this.movement_interval)
    }

    startFiringSuperLaser() {
        this.super_laser_firing_timeouts.push(setTimeout(() => this.fireSuperLaser(), (Math.floor(Math.random()*5)+1)*1000)) // start firing super laser, initial fire has longer timeout for user to respond
    }

    fireSuperLaser() {
        this.super_laser_firing_timeouts.pop()
        this.super_laser_firing_timeouts.push(setTimeout(() => this.fireSuperLaser(), (Math.floor(Math.random()*5)+1)*500))  // fire next laser randomly

        let super_laser = {
            position: this.position - game_grid_columns_num - 1,
            area: [
                this.position-2-game_grid_columns_num, this.position-1-game_grid_columns_num, this.position-game_grid_columns_num,
                this.position-2, this.position-1, this.position,
                this.position-2+game_grid_columns_num, this.position-1+game_grid_columns_num, this.position+game_grid_columns_num,
                this.position-2+2*game_grid_columns_num, this.position-1+2*game_grid_columns_num, this.position+2*game_grid_columns_num,
                this.position-2+3*game_grid_columns_num, this.position-1+3*game_grid_columns_num, this.position+3*game_grid_columns_num,
                this.position-2+4*game_grid_columns_num, this.position-1+4*game_grid_columns_num, this.position+4*game_grid_columns_num,
                this.position-2+5*game_grid_columns_num, this.position-1+5*game_grid_columns_num, this.position+5*game_grid_columns_num,
                this.position-2+6*game_grid_columns_num, this.position-1+6*game_grid_columns_num, this.position+6*game_grid_columns_num,
                this.position-2+7*game_grid_columns_num, this.position-1+7*game_grid_columns_num, this.position+7*game_grid_columns_num,
            ],
        }

        game_grid_blocks[super_laser.position].html_element.classList.add(`${this.ship_name}-super-laser`)
        super_laser.area.forEach((block) => game_grid_blocks[block].html_element.classList.add(`${this.ship_name}-super-laser-area`))

        const moveSuperLaser = () => {
            game_grid_blocks[super_laser.position].html_element.classList.remove(`${this.ship_name}-super-laser`)
            super_laser.area.forEach((block) => {
                if (block < game_grid_blocks.length) {
                    game_grid_blocks[block].html_element.classList.remove(`${this.ship_name}-super-laser-area`)
                }
            })

            super_laser.position += game_grid_columns_num
            super_laser.area = super_laser.area.map((block) => block += game_grid_columns_num)

            if (super_laser.position >= game_grid_blocks.length) {
                clearInterval(moving_super_laser)
            } else {
                let laser_hit_player = false

                const super_laser_area_within_grid = super_laser.area.filter((block) => block < game_grid_blocks.length)
                super_laser_area_within_grid.forEach((block) => {
                    if (laser_hit_player) {return}

                    const ships_in_the_block = game_grid_blocks[block].spaceships
                    const player_ship = ships_in_the_block.find((ship) => ship.constructor.name !== this.constructor.name)
                    
                    if (player_ship) {
                        player_ship.takeDamage()
                        laser_hit_player = true
                        clearInterval(moving_super_laser)
                    }
                })

                if (!laser_hit_player) {
                    game_grid_blocks[super_laser.position].html_element.classList.add(`${this.ship_name}-super-laser`)
                    super_laser.area.forEach((block) => {
                        if (block < game_grid_blocks.length) {
                            game_grid_blocks[block].html_element.classList.add(`${this.ship_name}-super-laser-area`)
                        }
                    })
                }
            }
        }

        let moving_super_laser = setInterval(moveSuperLaser, this.laser_speed)
    }

    stopFiringSuperLaser() {
        this.super_laser_firing_timeouts.forEach((super_laser_movement) => clearTimeout(super_laser_movement))
    }

    displayHP() {
        if (!this.current_hp_bar_display) {
            this.max_hp_bar_display = document.createElement('div')
            this.max_hp_bar_display.classList.add('enemy-max-hp-bar')

            this.current_hp_bar_display = document.createElement('div')
            this.current_hp_bar_display.classList.add('enemy-current-hp-bar')
            this.max_hp_bar_display.appendChild(this.current_hp_bar_display)

            document.querySelector('.enemy-hp-container').appendChild(this.max_hp_bar_display)
        }
             
        this.current_hp_bar_display.style.width = `${(this.hp/this.max_hp)*max_hp_bar_width}vmin`
    }

    removeDisplayedHP() {
        this.current_hp_bar_display.remove()
        this.max_hp_bar_display.remove()
    }

    takeDamage(damage) {
        if (game_ended) {return}

        game_grid_blocks[this.position].html_element.classList.add('damaged-enemy')
        const position = this.position
        setTimeout(() => game_grid_blocks[position].html_element.classList.remove('damaged-enemy'),100)

        this.hp -= damage
        this.displayHP()

        // Add sound effect for when enemy being hit
        if (!this.take_damage_sound_effect) {
            this.take_damage_sound_effect = new Audio('audio/hit-enemy-ship.mp3')
            this.take_damage_sound_effect.volume = .4
        }

        if (this.hp > 0) {
            this.take_damage_sound_effect.currentTime = 0
            this.take_damage_sound_effect.play()
            return
        }

        this.destroyed_sound_effect = new Audio('audio/destroyed-enemy-ship.mp3')
        this.destroyed_sound_effect.volume = .1
        this.destroyed_sound_effect.currentTime = .6
        this.destroyed_sound_effect.play()

        game_grid_blocks[this.position].html_element.classList.add('destroyed-enemy')
        setTimeout(() => game_grid_blocks[position].html_element.classList.remove('destroyed-enemy'),1000)

        galactic_empire.checkShipDestroyed(this)
        checkGameEnd()
    }
}

class EnemyShipFactory {
    constructor() {
        this.ships = []
        this.destroyed_ships = []
    }

    createShips(ship_name, max_hp, position, laser_speed, movement_speed) {
        const death_star = new EnemyShip(ship_name, max_hp, position, laser_speed, movement_speed)
        this.ships.push(death_star)
    }

    placeShips() {
        this.ships.forEach((ship) => ship.placeShip())
    }

    displayShipsHP() {
        this.ships.forEach((ship) => ship.displayHP())
    }

    startShipsFlying() {
        this.ships.forEach((ship) => ship.flyShip())
    }

    stopShips() {
        this.ships.forEach((ship) => ship.stopShip())
    }

    startShipsFiringSuperLaser() {
        this.ships.forEach((ship) => ship.startFiringSuperLaser())   
    }

    stopShipsFiringSuperLaser() {
        this.ships.forEach((ship) => ship.stopFiringSuperLaser())
    }

    checkShipDestroyed(ship) {
        const index = this.ships.indexOf(ship)
        if (this.ships[index].hp > 0) {return}
        
        this.ships[index].stopFiringSuperLaser()
        this.ships[index].stopShip()
        this.ships[index].removeShip()

        this.destroyed_ships.push(...this.ships.splice(index,1))
    }

    removeDestroyedShips() {
        this.destroyed_ships.forEach((ship) => ship.removeDisplayedHP())
        this.destroyed_ships.splice(0, this.destroyed_ships.length)
    }
}

// Initialize game
// - define number of rows and columns
// - define space ship initial position and attributes
// - define enemy ship initial position and attributes
// - add key listener to document for keydown
// - extra: define levels and difficulty settings
const initialize = () => {
    game_grid_columns_num = 60
    game_grid_rows_num = 85
    max_hp_bar_width = 45  // in vmin
    curr_level = 1
    game_ended = false

    x_wing = new PlayerShip('x-wing', 3, 4110)
    galactic_empire = new EnemyShipFactory
}

// Setup screen
// - create game grid
// - append game grid to DOM
// - create space ship
// - create enemy space ship
const setupGameScreen = () => {
    // Create game container
    if (!game_container) {
        game_container = document.createElement('div')
        game_container.classList.add('game-container')
        document.querySelector('main').appendChild(game_container)
    }

    // Create game grid
    createGameGrid()
    // Create status windows
    createStatusWindows()

    // Place player ship, lives and score
    x_wing.placeShip()
    x_wing.displayLives()
    x_wing.displayScore()

    createAndPlaceEnemies()
}

// Start game
// - start enemy space ship movement
// - start enemy shooting
const startGame = () => {
    document.addEventListener('keydown', playerAction)

    gameAlertMessage(`Level ${curr_level}`)

    setTimeout(() => {
        galactic_empire.startShipsFlying()
        galactic_empire.startShipsFiringSuperLaser()
    }, game_alert_message_duration)
}

const createGameGrid = () => {
    game_grid = document.createElement('div')
    game_grid.classList.add('game-grid-container')

    // Create game grid
    game_grid_blocks = []
    for (let i=0; i<game_grid_columns_num*game_grid_rows_num; i++) {
        const game_grid_block = document.createElement('div')
        game_grid_blocks.push({html_element: game_grid_block, spaceships: []})

        game_grid.appendChild(game_grid_block)
    }

    // Append game grid to DOM
    game_container.appendChild(game_grid)
}

const createStatusWindows = () => {
    // Create container for player status window
    const player_status_window = document.createElement('div')
    player_status_window.classList.add('status-window')
    player_status_window.classList.add('player-status-window')
    game_container.appendChild(player_status_window)

    // Create container for enemy status window
    const enemy_status_window = document.createElement('div')
    enemy_status_window.classList.add('status-window')
    enemy_status_window.classList.add('enemy-status-window')
    game_container.appendChild(enemy_status_window)

    // Add enemy icon
    const enemy_icon = document.createElement('img')
    enemy_icon.classList.add('character-icon')
    enemy_icon.setAttribute('src', 'img/death-star-icon.png')

    enemy_status_window.appendChild(enemy_icon)

    // Add enemy hp bar container
    const enemy_hp_container = document.createElement('div')
    enemy_hp_container.classList.add('enemy-hp-container')
    enemy_status_window.appendChild(enemy_hp_container)
}

const createAndPlaceEnemies = () => {

    // Create enemies
    levels[curr_level].forEach((enemy) => galactic_empire.createShips(enemy.ship_name, enemy.max_hp, enemy.start_position, enemy.laser_speed, enemy.movement_speed))
    
    // Place enemy ships and hp
    galactic_empire.placeShips()
    galactic_empire.displayShipsHP()
}


// Check game end
const checkGameEnd = () => {
    if (x_wing.lives > 0 && galactic_empire.ships.length > 0) {return}
    if (game_ended) {return}

    galactic_empire.stopShipsFiringSuperLaser()

    if (galactic_empire.ships.length === 0) { 
        if (curr_level < Object.keys(levels).length) {
            // nextLevel()
            setTimeout(nextLevel, 1000)
            return
        } else {
            game_ended = true
            // displayGameEndMessage('won')
            setTimeout(displayGameEndMessage, 1000, 'won')
            return
        }
    } else {
        game_ended = true
        displayGameEndMessage('lost')
        return
    }

    // while (true) {
    //     let restart = prompt('Do you want to restart?', 'yes/no').toLowerCase()

    //     if (restart === 'yes') {
    //         restartGame()
    //         break
    //     } else if (restart === 'no') {
    //         alert('Thanks for playing')
    //         break
    //     } else {
    //         alert('Please enter a valid option')
    //     }
    // }
}

const displayGameEndMessage = (game_result='lost') => {
    if (!game_end_container) {
        game_end_container = document.createElement('div')
        game_end_container.classList.add('game-end-container')

        const game_end_message_container = document.createElement('div')
        game_end_message_container.classList.add('game-end-message-container')
        game_end_container.appendChild(game_end_message_container)

        const restart_button = document.createElement('button')
        restart_button.classList.add('restart-button')
        restart_button.textContent = 'Restart'
        restart_button.addEventListener('click', () => restartGame())
        game_end_container.appendChild(restart_button)

        const quit_button = document.createElement('button')
        quit_button.classList.add('quit-button')
        quit_button.textContent = 'Quit'
        quit_button.addEventListener('click', () => {
            game_end_container.remove()
            gameAlertMessage('Thanks for playing', null)
        })
        game_end_container.appendChild(quit_button)
    }

    let game_end_message = ''
    if (game_result === 'won') {
        game_end_message += '<p class="game-end-title">You\'ve won!</p>'
        game_end_message += '<p>You\'ve foiled the plans of the Galactic Empire</p>'
    } else {
        game_end_message += '<p class="game-end-title">Game Over</p>'
        game_end_message += '<p>Your ship has been destroyed. Try again?</p>'
    }

    game_end_message += `<p>Your score: ${x_wing.score}</p>`
    game_end_container.firstChild.innerHTML = game_end_message

    game_container.appendChild(game_end_container)
}

const restartGame = () => {

    galactic_empire.stopShips()
    x_wing.clearAllFiredLaser()

    // Clear old game grid
    // game_container.innerHTML = ''
    while (game_container.firstChild) {
        game_container.removeChild(game_container.firstChild)
    }

    initialize()
    setupGameScreen()
    gameAlertMessage('Game restarting.....')
    setTimeout(startGame, game_alert_message_duration)
}

const nextLevel = () => {
    // Clear status window
    galactic_empire.removeDestroyedShips()
    x_wing.clearAllFiredLaser()

    // Setup the ships and stuff for new level
    curr_level += 1

    createAndPlaceEnemies()
    startGame()
}

const gameAlertMessage = (alert_message, duration=game_alert_message_duration) => {
    if (!game_alert_container) {
        game_alert_container = document.createElement('div')
        game_alert_container.classList.add('game-alert-container')

        const game_alert = document.createElement('p')
        game_alert_container.appendChild(game_alert)
    }

    game_alert_container.firstChild.textContent = alert_message
    game_container.appendChild(game_alert_container)

    if (duration !== null) {
        setTimeout(() => game_alert_container.remove(), game_alert_message_duration)
    }
}

const showLandingPage = () => {
    const start_button = document.createElement('button')
    start_button.classList.add('start-button')
    start_button.textContent = 'Start'

    start_button.addEventListener('click', () => {

        const game_title = document.querySelector('.game-title')
        game_title.classList.remove('game-title-landing-page')
        game_title.classList.add('game-title-opening-theme')
        start_button.remove()
        setTimeout(() => {
            displayGameOpeningTheme()
        }, 1000)
    })

    document.querySelector('main').appendChild(start_button)
}

const displayGameInstructions = () => {
    // Create the instructions container
    const game_instructions_container = document.createElement('div')
    game_instructions_container.classList.add('game-instructions-container')

    // Create and add the title
    const welcome_message = document.createElement('p')
    welcome_message.textContent = 'Welcome to Star Wars Space Battle'
    welcome_message.classList.add('game-instruction-title')
    game_instructions_container.appendChild(welcome_message)

    // Create container for game objective
    const game_objective_container = document.createElement('div')
    game_instructions_container.appendChild(game_objective_container)
    game_objective_container.classList.add('game-instruction')

    // Populate game objective
    let game_objective_content = ''
    game_objective_content += '<p class="game-instruction-header">Objective:</p>'
    game_objective_content += '<p>The Rebel forces have discovered the Empire\'s plan to mass produce Death Stars in the orbit of Geonosis. The Empire plans to use the Death Star to annilate the Rebel forces. It is up to you to destroy all the Empire\'s Death Stars before the Empire strikes</p>'
    game_objective_container.innerHTML = game_objective_content

    // Create container for game navigation
    const game_navigation_container = document.createElement('div')
    game_instructions_container.appendChild(game_navigation_container)
    game_navigation_container.classList.add('game-instruction')

    // Populate information on navigating the spaceship
    let game_navigation_content = ''
    game_navigation_content += '<p class="game-instruction-header">Navigation/ Controls:</p>'
    game_navigation_content += '<p>Arrow keys: Move your spaceship<br>Space bar: Shoot laser</p>'
    game_navigation_container.innerHTML = game_navigation_content

    // Create okay button with event listener to start game
    const okay_button = document.createElement('button')
    okay_button.classList.add('okay-button')
    okay_button.textContent = 'Okay'
    okay_button.addEventListener('click', () => {
        game_instructions_container.remove()
        startGame()
        const background_song = new Audio('audio/star-wars-soundtrack.mp3')
        background_song.loop = true
        background_song.currentTime = 618
        background_song.volume = .1
        background_song.play()
    })
    game_instructions_container.appendChild(okay_button)

    // Append game instructions to the DOM so that it appears
    game_container.appendChild(game_instructions_container)
}

const displayGameOpeningTheme = () => {
    const opening_theme_container = document.createElement('div')
    opening_theme_container.classList.add('opening-theme-container')

    const opening_theme_content = document.createElement('div')
    opening_theme_content.classList.add('opening-theme-content')
    opening_theme_container.appendChild(opening_theme_content)

    // Construct the content
    let content = ''
    content += '<h2>Star Wars Space Battle</h2>'
    content += '<p>In a galaxy far, far away . . . . .</p>'
    content += '<p>It is a period of civil war. Rebel spaceships, striking from a hidden base, have won their first victory against the evil Galactic Empire.</p>'
    content += '<p>During the battle, Rebel spies managed to intercept information on the Empire\'s plan to mass produce their ultimate weapon, the Death Star, an armored space station with enough power to destroy an entire planet.</p>'
    content += '<p>The Rebel has now engaged in an all out battle with the Empire to destroy the Death Stars. As one of the fighters, it is up to you to help in destroying the Death Stars before the Empire annilates the Rebel forces.</p>'

    opening_theme_content.innerHTML = content

    document.querySelector('main').appendChild(opening_theme_container)

    // Start opening theme music
    const opening_theme_audio = new Audio('audio/star-wars-opening-theme.mp3')
    opening_theme_audio.volume = 0.2
    opening_theme_audio.play()

    // Start animation
    opening_theme_content.classList.add('opening-theme-content-animate')

    const finishOpeningTheme = () => {
        document.querySelector('.game-title').classList.remove('game-title-opening-theme')
        opening_theme_container.remove()
        initialize()
        setupGameScreen()
        displayGameInstructions()
        opening_theme_audio.pause()
        opening_theme_audio.currentTime = 0
        document.removeEventListener('keydown', finishOpeningTheme)
    }

    document.addEventListener('animationend', (e) => {
        if (e.animationName !== 'scroll-up') {return}

        finishOpeningTheme()
    })

    document.addEventListener('keydown', finishOpeningTheme)
}

// Function to capture player action
// - arrow keys to move space ship
// - spacebar key to shoot laser
const playerAction = (e) => {
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        // Fly x-wing
        x_wing.flyShip(e.code)
    } else if (e.code === 'Space') {
        // Shoot x-wing laser
        x_wing.fireLaser()
    }
}

showLandingPage()

