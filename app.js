// Obtención de referencias a elementos del DOM usados por el juego
const player = document.getElementById('player');
const beyonce = document.getElementById('beyonce');
const gameOverScreen = document.getElementById('game-over-screen');
const resetButton = document.getElementById('reset-button');

const playerSpeedSlider = document.getElementById("player-speed");
const beyonceSpeedSlider = document.getElementById("beyonce-speed");
const beyonceSizeSlider = document.getElementById("beyonce-size");

const playerColorPicker = document.getElementById("player-color");
const beyonceColorPicker = document.getElementById("beyonce-color");
const bgColorPicker = document.getElementById("bg-color");

const music = document.getElementById("bg-music");
const playBtn = document.getElementById("play-music");
const pauseBtn = document.getElementById("pause-music");
const volumeSlider = document.getElementById("volume");

const gameArea = document.querySelector(".game-area");

// Posiciones iniciales de los personajes (coordenadas X/Y dentro del área de juego)
let playerPosition = { x: 100, y: 100 };
let beyoncePosition = { x: 300, y: 300 };

// Velocidades iniciales leídas desde los sliders
let playerSpeed = +playerSpeedSlider.value;
let beyonceSpeed = +beyonceSpeedSlider.value;
let gameOver = false; // bandera que indica si el juego terminó

// Referencias a elementos relacionados con el temporizador y tiempos guardados
const playerSpeedValue = document.getElementById("player-speed-value");
const beyonceSpeedValue = document.getElementById("beyonce-speed-value");
const beyonceSizeValue = document.getElementById("beyonce-size-value");
const timerDisplay = document.getElementById("timer");
const bestTimeDisplay = document.getElementById("best-time-display");
const lastTimeDisplay = document.getElementById("last-time");
const bestTimeOverlay = document.getElementById("best-time");

// Variables del temporizador: tiempo transcurrido, último timestamp y estado
let elapsed = 0;
let lastTime = null;
let timerRunning = false;
// Mejor tiempo guardado en localStorage (persistente entre sesiones)
let bestTime = parseFloat(localStorage.getItem('escapa_best_time') || '0');

// Inicializar valores visuales en la interfaz (lectura inicial de sliders y mejor tiempo)
playerSpeedValue.textContent = playerSpeedSlider.value;
beyonceSpeedValue.textContent = beyonceSpeedSlider.value;
beyonceSizeValue.textContent = beyonceSizeSlider.value;
bestTimeDisplay.textContent = bestTime.toFixed(1);
bestTimeOverlay.textContent = `Mejor: ${bestTime.toFixed(1)}s`;

/* 
  Intento de reproducción automática al cargar.
  Nota: algunos navegadores bloquean autoplay hasta que el usuario interactúe.
  Se hace un intento con reintentos y reproduciendo en mute como fallback (mejor esfuerzo).
*/
window.addEventListener("load", () => {
    // leer velocidad del jugador desde el slider en carga
    playerSpeed = +playerSpeedSlider.value;

    // Función que intenta reproducir la música con algunos reintentos si falla
    function tryPlayMusic(attempt = 0){
        music.volume = +volumeSlider.value;
        music.play().then(() => {
            // si se reproduce con éxito, marcar botón como activo
            playBtn.classList.add('active');
            music.muted = false;
        }).catch(() => {
            // si falla, intentar reproducir en mute y luego desmutear (algunos navegadores permiten esto)
            if(attempt < 2){
                music.muted = true;
                music.play().then(() => {
                    playBtn.classList.add('active');
                    // intentar desmutear tras pequeña demora
                    setTimeout(() => {
                        try { music.muted = false; } catch(e){ /* ignorar errores */ }
                    }, 800);
                }).catch(() => {
                    // reintentar después de una pausa
                    setTimeout(() => tryPlayMusic(attempt + 1), 700);
                });
            }
        });
    }
    tryPlayMusic();

    // iniciar el temporizador del juego
    resetTimer();
    startTimer();
});

/* 
  Manejo del movimiento del jugador.
  Se soportan las flechas y las teclas WASD.
  Cada pulsación mueve al jugador una distancia dependiente de playerSpeed.
*/
window.addEventListener("keydown", (e) => {
    if(gameOver) return; // si el juego terminó, ignorar entradas
    const step = playerSpeed / 5; // paso de movimiento relativo a la velocidad
    const key = e.key.toLowerCase();

    switch(key){
        case "arrowup":
        case "w":
            playerPosition.y = Math.max(0, playerPosition.y - step);
            break;
        case "arrowdown":
        case "s":
            playerPosition.y = Math.min(gameArea.clientHeight - player.offsetHeight, playerPosition.y + step);
            break;
        case "arrowleft":
        case "a":
            playerPosition.x = Math.max(0, playerPosition.x - step);
            break;
        case "arrowright":
        case "d":
            playerPosition.x = Math.min(gameArea.clientWidth - player.offsetWidth, playerPosition.x + step);
            break;
    }
    updatePositions();
    checkCollision();
});

/* 
  updatePositions:
  Aplica las posiciones X/Y calculadas a los estilos inline de los elementos
  para moverlos visualmente dentro del área de juego. También ajusta el tamaño
  de Beyoncé según el slider.
*/
function updatePositions(){
    // tamaño fijo del jugador (puede hacerse configurable si se desea)
    player.style.width = "50px";
    player.style.height = "50px";
    player.style.left = playerPosition.x + "px";
    player.style.top = playerPosition.y + "px";

    // actualizar posición y tamaño de Beyoncé
    beyonce.style.left = beyoncePosition.x + "px";
    beyonce.style.top = beyoncePosition.y + "px";
    beyonce.style.width = beyonceSizeSlider.value + "px";
    beyonce.style.height = beyonceSizeSlider.value + "px";
}

/* 
  checkCollision:
  Comprueba si los rectángulos de jugador y Beyoncé se intersectan.
  Si colisionan, activa la pantalla de Game Over, aplica el efecto visual
  y guarda/actualiza el mejor tiempo si corresponde.
*/
function checkCollision(){
    const playerRect = player.getBoundingClientRect();
    const beyonceRect = beyonce.getBoundingClientRect();

    if(
        playerRect.left < beyonceRect.right &&
        playerRect.right > beyonceRect.left &&
        playerRect.top < beyonceRect.bottom &&
        playerRect.bottom > beyonceRect.top
    ){
        gameOver = true;
        gameOverScreen.style.display = "flex"; // mostrar overlay de Game Over
        document.body.classList.add('dead'); // aplicar clase que pone todo en rojo
        stopTimer(); // detener el temporizador

        // Mostrar el tiempo del intento actual
        lastTimeDisplay.textContent = `Tu tiempo: ${elapsed.toFixed(1)}s`;

        // Actualizar y guardar mejor tiempo si el actual lo supera
        if(elapsed > bestTime){
            bestTime = elapsed;
            localStorage.setItem('escapa_best_time', bestTime.toString());
        }

        // Actualizar displays del mejor tiempo
        bestTimeOverlay.textContent = `Mejor: ${bestTime.toFixed(1)}s`;
        bestTimeDisplay.textContent = bestTime.toFixed(1);
    }
}

/* 
  resetGame:
  Devuelve posiciones y estados a valores iniciales y reinicia el temporizador.
  También quita los estilos de "muerto" y oculta la pantalla de Game Over.
*/
function resetGame(){
    playerPosition = { x:100, y:100 };
    beyoncePosition = { x:300, y:300 };
    gameOver = false;
    updatePositions();
    gameOverScreen.style.display = "none";
    document.body.classList.remove('dead');

    // Reiniciar velocidades y tamaños desde los sliders
    playerSpeed = +playerSpeedSlider.value;
    beyonceSpeed = +beyonceSpeedSlider.value;
    beyonce.style.width = beyonceSizeSlider.value + "px";
    beyonce.style.height = beyonceSizeSlider.value + "px";

    // Reiniciar temporizador
    resetTimer();
    startTimer();
}
resetButton.addEventListener("click", resetGame);

/* 
  moveBeyonce:
  Bucle principal (animación) que hace que Beyoncé se mueva hacia la posición del jugador.
  Se llama recursivamente usando requestAnimationFrame.
*/
function moveBeyonce(){
    if(!gameOver){
        if(beyoncePosition.x < playerPosition.x) beyoncePosition.x += beyonceSpeed;
        else if(beyoncePosition.x > playerPosition.x) beyoncePosition.x -= beyonceSpeed;

        if(beyoncePosition.y < playerPosition.y) beyoncePosition.y += beyonceSpeed;
        else if(beyoncePosition.y > playerPosition.y) beyoncePosition.y -= beyonceSpeed;

        updatePositions();
        checkCollision();
    }
    requestAnimationFrame(moveBeyonce);
}
moveBeyonce(); // arrancar el bucle de movimiento de Beyoncé

/* 
  Eventos para los controles (sliders y pickers).
  Actualizan variables y el UI en tiempo real cuando el usuario cambia controles.
*/
playerSpeedSlider.oninput = (e) => {
    playerSpeedValue.textContent = e.target.value;
    playerSpeed = +e.target.value;
};
beyonceSpeedSlider.oninput = (e) => {
    beyonceSpeed = +e.target.value;
    beyonceSpeedValue.textContent = e.target.value;
};
beyonceSizeSlider.oninput = (e) => {
    beyonce.style.width = e.target.value + "px";
    beyonce.style.height = e.target.value + "px";
    beyonceSizeValue.textContent = e.target.value;
};

// Cambios de color en tiempo real para los bordes y el fondo
playerColorPicker.oninput = (e) => {
    player.style.borderColor = e.target.value;
    player.style.boxShadow = `0 0 15px ${e.target.value}`;
};
beyonceColorPicker.oninput = (e) => {
    beyonce.style.borderColor = e.target.value;
    beyonce.style.boxShadow = `0 0 15px ${e.target.value}`;
};
bgColorPicker.oninput = (e) => document.body.style.backgroundColor = e.target.value;

/* 
  Controles de música: reproducir/pausar y control de volumen.
  Los botones añaden/remueven una clase 'active' para feedback visual.
*/
playBtn.onclick = () => {
    music.play();
    playBtn.classList.add('active');
    pauseBtn.classList.remove('active');
};
pauseBtn.onclick = () => {
    music.pause();
    pauseBtn.classList.add('active');
    playBtn.classList.remove('active');
};
volumeSlider.oninput = (e) => music.volume = e.target.value;

/* 
  Temporizador del juego (sin límite máximo).
  Usamos requestAnimationFrame para contar el tiempo empleado en segundos
  y actualizar el display con el tiempo actual y el mejor tiempo.
*/
function timerTick(ts){
    if(!timerRunning) { lastTime = ts; return; } // primer frame guardamos ts
    if(lastTime == null) lastTime = ts;
    const delta = (ts - lastTime) / 1000; // tiempo en segundos desde la última llamada
    lastTime = ts;
    elapsed += delta;
    timerDisplay.textContent = `Tiempo: ${elapsed.toFixed(1)}s | Mejor: ${bestTime.toFixed(1)}s`;
    requestAnimationFrame(timerTick);
}

function startTimer(){
    elapsed = 0;
    lastTime = null;
    timerRunning = true;
    requestAnimationFrame(timerTick);
}
function stopTimer(){
    timerRunning = false;
    lastTime = null;
}
function resetTimer(){
    elapsed = 0;
    timerDisplay.textContent = `Tiempo: 0.0s | Mejor: ${bestTime.toFixed(1)}s`;
}

// Inicializar estado visual una vez cargado el script
playerSpeedValue.textContent = playerSpeedSlider.value;
beyonceSpeedValue.textContent = beyonceSpeedSlider.value;
beyonceSizeValue.textContent = beyonceSizeSlider.value;
bestTimeDisplay.textContent = bestTime.toFixed(1);

updatePositions(); // aplicar posiciones iniciales
