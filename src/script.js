document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loading_screen');
    const disconnectedScreen = document.getElementById('disconnected_screen');
    const nameScreen = document.getElementById('name_screen');
    const gameScreen = document.getElementById('game_screen');
    const playerName = document.getElementById('player_name');
    const startButton = document.getElementById('start_button');
    const background = document.getElementById('background');
    const player = document.getElementById('player');
    const playerTag = document.getElementById('player_tag');
    const playerHeart = document.getElementById('player_heart');
    const socket = new WebSocket(WS_SERVER_ADDRESS);
    const states = [];

    let widthOffset = window.innerWidth / 2;
    let heightOffset = window.innerHeight / 2;
    window.addEventListener('resize', function() {
        widthOffset = window.innerWidth / 2;
        heightOffset = window.innerHeight / 2;
    });

    const playerSpeed = 100;
    const playerPosition = { x: 0, y: 0 };
    const playerVelocity = { x: 0, y: 0 };
    const keyStates = { left: false, right: false, up: false, down: false };

    window.addEventListener('keydown', function(event) {
        switch (event.code) {
            case 'ArrowLeft':
                keyStates.left = true;
                break;
            case 'ArrowRight':
                keyStates.right = true;
                break;
            case 'ArrowUp':
                keyStates.up = true;
                break;
            case 'ArrowDown':
                keyStates.down = true;
                break;
            default:
                break;
        }
    });

    window.addEventListener('keyup', function(event) {
        switch (event.code) {
            case 'ArrowLeft':
                keyStates.left = false;
                break;
            case 'ArrowRight':
                keyStates.right = false;
                break;
            case 'ArrowUp':
                keyStates.up = false;
                break;
            case 'ArrowDown':
                keyStates.down = false;
                break;
            default:
                break;
        }
    });

    let start;
    function mainLoop(timestamp) {
        if (start === undefined) {
            start = timestamp;
        }
        const deltaTime = (timestamp - start) / 1000;
        playerVelocity.x = (keyStates.left === true ? -1 : 0) + (keyStates.right === true ? 1 : 0);
        playerVelocity.y = (keyStates.up === true ? -1 : 0) + (keyStates.down === true ? 1 : 0);
        playerPosition.x += playerVelocity.x * playerSpeed * deltaTime;
        playerPosition.y += playerVelocity.y * playerSpeed * deltaTime;
        if (playerPosition.x < -165) playerPosition.x = -165;
        if (playerPosition.x > 135) playerPosition.x = 135;
        if (playerPosition.y > 115) playerPosition.y = 115;
        if (playerPosition.y < -185) playerPosition.y = -185;
        player.style.left = `${widthOffset}px`;
        player.style.top = `${heightOffset}px`;
        background.style.left = `${widthOffset - playerPosition.x - 160}px`;
        background.style.top = `${heightOffset - playerPosition.y - 160}px`;
        let touching = false;
        states.forEach(state => {
            const playerDiv = document.getElementById(state.id);
            state.position.x += state.velocity.x * playerSpeed * deltaTime;
            state.position.y += state.velocity.y * playerSpeed * deltaTime;
            const statePosition = {
                x: state.position.x,
                y: state.position.y
            };
            if (statePosition.x > playerPosition.x - 30 && statePosition.x < playerPosition.x + 30) {
                if (statePosition.y > playerPosition.y - 25 && statePosition.y < playerPosition.y + 25) {
                    touching = true;
                }
            }
            setPlayerPosition(playerDiv, state.position);
        });
        playerHeart.style.display = touching ? 'block' : 'none';
        socket.send(JSON.stringify({
            type: 'update',
            position: playerPosition,
            velocity: playerVelocity
        }));
        if (socket.readyState === WebSocket.OPEN) {
            start = timestamp;
            requestAnimationFrame(mainLoop);
        }
    }

    function setPlayerPosition(player, position) {
        player.style.left = `${widthOffset + position.x - playerPosition.x}px`;
        player.style.top = `${heightOffset + position.y - playerPosition.y}px`;
    }

    function addNewPlayer(state) {
        const existingPlayer = document.getElementById(state.id);
        if (existingPlayer) return;
        const newPlayer = document.createElement('div');
        newPlayer.id = state.id;
        const newPlayerTag = document.createElement('p');
        newPlayerTag.innerText = state.username;
        const newPlayerImg = document.createElement('img');
        newPlayerImg.src = require('./cat.png');
        newPlayer.appendChild(newPlayerTag);
        newPlayer.appendChild(newPlayerImg);
        gameScreen.appendChild(newPlayer);
        newPlayer.style.position = 'fixed';
        setPlayerPosition(newPlayer, state.position);
    }

    socket.onopen = function() {
        loadingScreen.style.display = 'none';
        disconnectedScreen.style.display = 'none';
        nameScreen.style.display = 'flex';
        gameScreen.style.display = 'none';
    };

    socket.onmessage = async function(event) {
        try {
            const parsedData = JSON.parse(event.data);
            if (parsedData.type === 'states') {
                const playerStates = parsedData.states;
                console.log(playerStates);
                playerStates.forEach(state => {
                    states.push(state);
                    addNewPlayer(state);
                });
            } else if (parsedData.type === 'update') {
                var index = states.findIndex(state => state.id === parsedData.id);
                if (index > -1) {
                    states[index].position = parsedData.position;
                    states[index].velocity = parsedData.velocity;
                }
                const playerDiv = document.getElementById(parsedData.id);
                if (playerDiv != null) {
                    setPlayerPosition(playerDiv, parsedData.position);
                }
            } else if (parsedData.type === 'join') {
                const newState = {
                    id: parsedData.id,
                    username: parsedData.username,
                    position: { x: 0, y: 0 },
                    velocity: { x: 0, y: 0 }
                };
                states.push(newState);
                addNewPlayer(newState);
            } else if (parsedData.type === 'leave') {
                var index = states.findIndex(state => state.id === parsedData.id);
                if (index > -1) {
                    states.splice(index, 1);
                }
                const playerDiv = document.getElementById(parsedData.id);
                if (playerDiv != null) {
                    gameScreen.removeChild(playerDiv);
                }
            }
        } catch (e) {
            console.error('Failed to parse incoming message:', e);
        }
    };

    socket.onclose = function() {
        disconnectedScreen.style.display = 'block';
        loadingScreen.style.display = 'none';
        nameScreen.style.display = 'none';
        gameScreen.style.display = 'none';
    };

    socket.onerror = function(event) {
        console.log(event);
    };

    function joinGame() {
        if (playerName.value.length === 0) {
            alert('Name can not be empty!');
            return;
        }
        socket.send(JSON.stringify({
            type: 'join',
            username: playerName.value
        }));
        disconnectedScreen.style.display = 'none';
        loadingScreen.style.display = 'none';
        nameScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        playerTag.innerText = playerName.value;
        requestAnimationFrame(mainLoop);
    }

    playerName.addEventListener('keypress', function(event) {
        if (event.code === 'Enter') {
            joinGame();
        }
    });

    startButton.addEventListener('click', joinGame);
});
