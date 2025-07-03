<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Snake PWA</title>
    <link rel="manifest" href="/manifest.json"> <!-- Belangrijk: link naar manifest.json -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Three.js laadt nu globaal, geen 'type="module"' -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            overflow: hidden; /* Voorkom scrollbalken */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #1a202c; /* Donkere achtergrond */
            color: #e2e8f0;
        }
        canvas {
            display: block;
            border-radius: 1rem; /* Afgeronde hoeken voor canvas */
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            background-color: #2d3748; /* Donkerdere achtergrond voor het spelbord */
        }
        #game-container {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            max-width: 800px; /* Max breedte voor desktop */
            margin: 1rem;
            padding: 1rem;
            background-color: #2d3748;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        #loading-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            font-size: 1.5rem;
            border-radius: 1rem;
        }
        .control-button {
            /* Aangepaste styling voor grotere en beter aanraakbare knoppen */
            @apply bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 active:scale-95 text-xl;
            min-width: 100px; /* Vaste breedte voor knoppen */
            margin: 0.5rem;
        }
        .game-message {
            @apply text-xl font-bold text-red-400 mt-4;
        }
        .game-score {
            @apply text-2xl font-bold text-green-400 mb-4;
        }
    </style>
</head>
<body class="bg-gray-900 text-gray-100 flex flex-col items-center justify-center min-h-screen p-4">
    <div id="game-container" class="relative bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center">
        <div id="loading-screen" class="hidden">Laden...</div>

        <h1 class="text-4xl font-extrabold mb-6 text-indigo-400">3D Snake</h1>

        <div class="flex justify-between items-center w-full mb-4 px-4">
            <div class="game-score">Score: <span id="score">0</span></div>
            <button id="restart-button" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-full shadow-md transition-transform transform hover:scale-105 active:scale-95 text-lg">Opnieuw Starten</button>
        </div>

        <canvas id="gameCanvas" class="rounded-xl bg-gray-700 border-4 border-gray-600"></canvas>

        <div id="controls" class="mt-6 w-full max-w-sm flex flex-col items-center sm:hidden">
            <!-- Vertical controls -->
            <div class="flex justify-center w-full mb-4">
                <button id="up-button" class="control-button">Omhoog</button>
            </div>
            <!-- Horizontal and Depth controls (D-pad like) -->
            <div class="grid grid-cols-3 gap-2 w-full max-w-xs">
                <div></div> <!-- Empty for spacing -->
                <button id="forward-button" class="control-button">Vooruit</button>
                <div></div> <!-- Empty for spacing -->

                <button id="left-button" class="control-button">Links</button>
                <!-- Center for visual alignment, no button here -->
                <div class="flex items-center justify-center"></div>
                <button id="right-button" class="control-button">Rechts</button>

                <div></div> <!-- Empty for spacing -->
                <button id="backward-button" class="control-button">Achteruit</button>
                <div></div> <!-- Empty for spacing -->
            </div>
            <!-- Vertical controls -->
            <div class="flex justify-center w-full mt-4">
                <button id="down-button" class="control-button">Omlaag</button>
            </div>
        </div>

        <div id="game-message" class="game-message hidden"></div>
    </div>

    <!-- Plaats het script aan het einde van de body voor optimale laadvolgorde -->
    <script>
        // THREE is nu globaal beschikbaar omdat three.min.js als een regulier script is geladen.

        // Globale variabelen voor Three.js
        let scene, camera, renderer;
        let snake, food;
        let snakeDirection; // Declareren zonder directe initialisatie
        let snakeBody = [];
        let score = 0;
        let gameOver = false;
        let gameSpeed = 200; // Milliseconden per beweging
        let lastMoveTime = 0;
        const gridSize = 15; // Grootte van het speelveld (gridSize x gridSize x gridSize)
        const cellSize = 1; // Grootte van een cel
        const initialSnakeLength = 3;

        // UI elementen
        const scoreElement = document.getElementById('score');
        const gameMessageElement = document.getElementById('game-message');
        const restartButton = document.getElementById('restart-button');
        const loadingScreen = document.getElementById('loading-screen');
        const gameCanvas = document.getElementById('gameCanvas');

        // Touch controls
        const upButton = document.getElementById('up-button');
        const downButton = document.getElementById('down-button');
        const leftButton = document.getElementById('left-button');
        const rightButton = document.getElementById('right-button');
        const forwardButton = document.getElementById('forward-button');
        const backwardButton = document.getElementById('backward-button'); // Nu statisch in HTML

        // Service Worker registratie
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => { // Gebruik window.onload voor Service Worker registratie
                navigator.serviceWorker.register('/service-worker.js') // Verwijst nu naar apart bestand
                    .then(registration => {
                        console.log('Service Worker geregistreerd met scope:', registration.scope);
                    })
                    .catch(error => {
                        console.error('Service Worker registratie mislukt:', error);
                    });
            });
        }

        // Initialiseer de game
        // Gebruik window.onload om te garanderen dat alle externe bronnen (inclusief Three.js) zijn geladen
        window.onload = function() {
            loadingScreen.classList.remove('hidden'); // Toon laadscherm
            try {
                // Controleer of THREE is gedefinieerd voordat init() wordt aangeroepen
                if (typeof THREE === 'undefined') {
                    throw new Error("THREE.js is niet geladen. Controleer de script tag.");
                }
                init();
                animate();
            } catch (error) {
                console.error("Fout bij initialiseren van het spel:", error);
                gameMessageElement.textContent = "Er is een fout opgetreden bij het laden van het spel. Controleer de console voor details.";
                gameMessageElement.classList.remove('hidden');
            } finally {
                // Verberg laadscherm altijd, ongeacht succes of fout
                loadingScreen.classList.add('hidden');
            }
        };


        function init() {
            // Scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x2d3748); // Achtergrondkleur van de scene

            // Camera
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(gridSize / 2, gridSize / 2, gridSize * 1.5); // Positie boven het speelveld
            camera.lookAt(gridSize / 2, gridSize / 2, gridSize / 2); // Kijk naar het midden van het speelveld

            // Renderer
            renderer = new THREE.WebGLRenderer({ canvas: gameCanvas, antialias: true });
            // Stel de grootte van de canvas in op basis van de container
            const container = document.getElementById('game-container');
            const canvasWidth = Math.min(container.clientWidth - 40, 600); // Max 600px of container breedte - padding
            const canvasHeight = canvasWidth; // Maak het vierkant
            renderer.setSize(canvasWidth, canvasHeight);
            renderer.setPixelRatio(window.devicePixelRatio);

            // Licht
            const ambientLight = new THREE.AmbientLight(0x404040); // Zacht omgevingslicht
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Sterk gericht licht
            directionalLight.position.set(gridSize, gridSize * 2, gridSize);
            scene.add(directionalLight);

            // Game Board (een kubus met randen)
            const boxGeometry = new THREE.BoxGeometry(gridSize * cellSize, gridSize * cellSize, gridSize * cellSize);
            const edges = new THREE.EdgesGeometry(boxGeometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x4a5568, linewidth: 2 }));
            line.position.set(gridSize / 2 - cellSize / 2, gridSize / 2 - cellSize / 2, gridSize / 2 - cellSize / 2); // Centreer de kubus
            scene.add(line);

            // Initialiseer snakeDirection hier, nadat THREE is geïmporteerd en beschikbaar is
            snakeDirection = new THREE.Vector3(1, 0, 0);

            resetGame();

            // Event Listeners
            window.addEventListener('resize', onWindowResize);
            document.addEventListener('keydown', onKeyDown);
            restartButton.addEventListener('click', resetGame);

            // Touch control event listeners
            upButton.addEventListener('click', () => setSnakeDirection(0, 1, 0));
            downButton.addEventListener('click', () => setSnakeDirection(0, -1, 0));
            leftButton.addEventListener('click', () => setSnakeDirection(-1, 0, 0));
            rightButton.addEventListener('click', () => setSnakeDirection(1, 0, 0));
            forwardButton.addEventListener('click', () => setSnakeDirection(0, 0, -1)); // Vooruit (Z-as, negatief)
            backwardButton.addEventListener('click', () => setSnakeDirection(0, 0, 1)); // Achteruit (Z-as, positief)
        }

        function onWindowResize() {
            const container = document.getElementById('game-container');
            const canvasWidth = Math.min(container.clientWidth - 40, 600);
            const canvasHeight = canvasWidth;
            renderer.setSize(canvasWidth, canvasHeight);
            camera.aspect = canvasWidth / canvasHeight;
            camera.updateProjectionMatrix();
        }

        function createCube(color) {
            const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
            const material = new THREE.MeshLambertMaterial({ color: color });
            const cube = new THREE.Mesh(geometry, material);
            cube.castShadow = true;
            cube.receiveShadow = true;
            return cube;
        }

        function createFood() {
            const geometry = new THREE.SphereGeometry(cellSize * 0.4, 16, 16);
            const material = new THREE.MeshLambertMaterial({ color: 0xff0000 }); // Rood
            const sphere = new THREE.Mesh(geometry, material);
            sphere.castShadow = true;
            sphere.receiveShadow = true;
            return sphere;
        }

        function placeFood() {
            let newFoodPosition;
            let collisionWithSnake;
            do {
                collisionWithSnake = false;
                newFoodPosition = new THREE.Vector3(
                    Math.floor(Math.random() * gridSize),
                    Math.floor(Math.random() * gridSize),
                    Math.floor(Math.random() * gridSize)
                );

                // Controleer of voedsel op de slang spawnt
                for (let i = 0; i < snakeBody.length; i++) {
                    // Vergelijk de positie van het voedsel met de gecentreerde positie van de slangsegmenten
                    if (snakeBody[i].position.clone().subScalar(cellSize / 2).equals(newFoodPosition)) {
                        collisionWithSnake = true;
                        break;
                    }
                }
            } while (collisionWithSnake);

            if (!food) {
                food = createFood();
                scene.add(food);
            }
            food.position.copy(newFoodPosition).addScalar(cellSize / 2); // Centreer in de cel
        }

        function resetGame() {
            // Verwijder oude slang en voedsel
            snakeBody.forEach(segment => scene.remove(segment));
            if (food) scene.remove(food);

            // Reset variabelen
            snakeBody = [];
            score = 0;
            gameOver = false;
            gameSpeed = 200;
            // Stel de richting in, snakeDirection is al geïnitialiseerd in init()
            if (snakeDirection) { // Zorg ervoor dat het object bestaat voordat set wordt aangeroepen
                snakeDirection.set(1, 0, 0);
            } else {
                // Dit zou niet moeten gebeuren als init() correct wordt aangeroepen, maar voor de zekerheid
                snakeDirection = new THREE.Vector3(1, 0, 0);
            }
            scoreElement.textContent = score;
            gameMessageElement.classList.add('hidden');
            restartButton.classList.remove('hidden'); // Zorg ervoor dat de knop zichtbaar is

            // Initialiseer slang
            for (let i = 0; i < initialSnakeLength; i++) {
                const segment = createCube(0x00ff00); // Groen
                segment.position.set(
                    Math.floor(gridSize / 2) - i,
                    Math.floor(gridSize / 2),
                    Math.floor(gridSize / 2)
                ).addScalar(cellSize / 2); // Centreer in de cel
                snakeBody.push(segment);
                scene.add(segment);
            }
            snake = snakeBody[0]; // Hoofd van de slang

            placeFood();
        }

        function onKeyDown(event) {
            if (gameOver) return;

            const currentDirection = snakeDirection.clone();
            let newDirection = new THREE.Vector3();

            switch (event.key) {
                case 'ArrowUp': // Vooruit (Z-as, negatief) - camera kijkt langs positieve Z
                    newDirection.set(0, 0, -1);
                    break;
                case 'ArrowDown': // Achteruit (Z-as, positief)
                    newDirection.set(0, 0, 1);
                    break;
                case 'ArrowLeft': // Links (X-as, negatief)
                    newDirection.set(-1, 0, 0);
                    break;
                case 'ArrowRight': // Rechts (X-as, positief)
                    newDirection.set(1, 0, 0);
                    break;
                case 'w': // Omhoog (Y-as, positief)
                    newDirection.set(0, 1, 0);
                    break;
                case 's': // Omlaag (Y-as, negatief)
                    newDirection.set(0, -1, 0);
                    break;
                default:
                    return; // Negeer andere toetsen
            }

            // Voorkom dat de slang direct 180 graden draait
            if (!newDirection.equals(currentDirection.negate())) {
                snakeDirection.copy(newDirection);
            }
        }

        function setSnakeDirection(x, y, z) {
            if (gameOver) return;
            const currentDirection = snakeDirection.clone();
            const newDirection = new THREE.Vector3(x, y, z);

            // Voorkom dat de slang direct 180 graden draait
            if (!newDirection.equals(currentDirection.negate())) {
                snakeDirection.copy(newDirection);
            }
        }

        function updateGame() {
            if (gameOver) return;

            const headPosition = snakeBody[0].position.clone();
            const newHeadPosition = headPosition.clone().add(snakeDirection.clone().multiplyScalar(cellSize));

            // Controleer botsing met muren
            if (newHeadPosition.x < 0 || newHeadPosition.x >= gridSize ||
                newHeadPosition.y < 0 || newHeadPosition.y >= gridSize ||
                newHeadPosition.z < 0 || newHeadPosition.z >= gridSize) {
                endGame("Botsing met de muur!");
                return;
            }

            // Controleer botsing met eigen lichaam
            for (let i = 1; i < snakeBody.length; i++) {
                if (newHeadPosition.equals(snakeBody[i].position)) {
                    endGame("Botsing met jezelf!");
                    return;
                }
            }

            // Controleer botsing met voedsel
            // Vergelijk de positie van het hoofd van de slang met de gecentreerde positie van het voedsel
            if (newHeadPosition.equals(food.position.clone().subScalar(cellSize / 2))) {
                score += 10;
                scoreElement.textContent = score;
                gameSpeed = Math.max(50, gameSpeed - 5); // Verhoog snelheid
                placeFood(); // Plaats nieuw voedsel
                // Voeg een nieuw segment toe aan het begin van de slang
                const newSegment = createCube(0x00ff00);
                newSegment.position.copy(newHeadPosition);
                snakeBody.unshift(newSegment);
                scene.add(newSegment);
            } else {
                // Verplaats de slang: elk segment volgt het vorige
                for (let i = snakeBody.length - 1; i > 0; i--) {
                    snakeBody[i].position.copy(snakeBody[i - 1].position);
                }
                snakeBody[0].position.copy(newHeadPosition);
            }
        }

        function endGame(message) {
            gameOver = true;
            gameMessageElement.textContent = "Game Over! " + message;
            gameMessageElement.classList.remove('hidden');
            restartButton.classList.remove('hidden');
        }

        function animate(currentTime) {
            requestAnimationFrame(animate);

            if (!gameOver && currentTime - lastMoveTime > gameSpeed) {
                updateGame();
                lastMoveTime = currentTime;
            }

            renderer.render(scene, camera);
        }
    </script>
</body>
</html>
