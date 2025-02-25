/* Realistische Blitzanimation mit Farbverlauf, Hintergrundeffekten und Interaktivität */

// --- DOM-Elemente und Kontext-Setups ---
// Verwende querySelector für Konsistenz und bessere Lesbarkeit.  'const' wo immer möglich.
const lightningCanvas = document.querySelector('#lightning-canvas');
const lightningCtx = lightningCanvas.getContext('2d');

const cloudsCanvas = document.querySelector('#clouds-canvas');
const cloudsCtx = cloudsCanvas.getContext('2d');

// --- Globale Variablen (mit Vorsicht verwenden) ---
// Kapsle so viel wie möglich in Funktionen oder Klassen, um den globalen Scope sauber zu halten.
let width = window.innerWidth;
let height = window.innerHeight;

// --- Event Listener für Fenstergrößenänderung ---
// Entprelle (debounce) die resize-Funktion, um die Performance zu verbessern.
function handleResize() {
    width = lightningCanvas.width = cloudsCanvas.width = window.innerWidth;
    height = lightningCanvas.height = cloudsCanvas.height = window.innerHeight;
    generateClouds(); // Wolken neu generieren bei Größenänderung
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 200); // 200ms Verzögerung
});


// --- Hintergrundeffekte: Wolken ---
let cloudsImage; // Speichere das Bild für schnellere Wiederverwendung

function generateClouds() {
    cloudsCtx.clearRect(0, 0, width, height); // Canvas leeren

    // Verwende ein Objekt für Farbverlaufs-Stopps, um die Lesbarkeit zu verbessern
    const gradientStops = [
        { offset: 0, color: 'rgba(10, 10, 10, 0)' },
        { offset: 1, color: 'rgba(20, 20, 20, 0.5)' }
    ];

    // Linearen Farbverlauf erstellen
    const gradient = cloudsCtx.createLinearGradient(0, 0, 0, height);
    gradientStops.forEach(stop => {
        gradient.addColorStop(stop.offset, stop.color);
    });

    cloudsCtx.fillStyle = gradient;
    cloudsCtx.fillRect(0, 0, width, height);

    // Das Wolkenbild für die Wiederverwendung in der Blitzanimation speichern
    cloudsImage = new Image();
    cloudsImage.src = cloudsCanvas.toDataURL();  // toDataURL kann teuer sein, nur wenn nötig
}

// Initialisiere Wolken beim Laden
generateClouds();



// --- Blitzklasse (ES6 Class) ---
class LightningStrike {
    constructor(x, y, maxLength, branch = false, angle = Math.PI / 2) {
        this.x = x;
        this.y = y;
        this.maxLength = maxLength;
        this.branch = branch;
        this.angle = angle;
        this.segments = [];
        this.alpha = 1; // Start-Transparenz
        this.segmentLength = 10; // Konstante Segmentlänge
        this.angleVariation = 0.3; // Konstante Winkelvariation
        this.branchProbability = 0.07; // Wahrscheinlichkeit für Verzweigung (1 - 0.93)
        this.fadeOutRate = 0.015; // Konstante für die Ausblendgeschwindigkeit
        this.init(); // Initialisiere den Blitz
    }

    init() {
        let currentX = this.x;
        let currentY = this.y;
        let currentLength = 0;
        let currentAngle = this.angle;

        while (currentLength < this.maxLength) {
            // Winkel zufällig variieren
            currentAngle += (Math.random() - 0.5) * this.angleVariation;

            // Nächsten Punkt berechnen
            const nextX = currentX + Math.cos(currentAngle) * this.segmentLength;
            const nextY = currentY + Math.sin(currentAngle) * this.segmentLength;

            this.segments.push({ x1: currentX, y1: currentY, x2: nextX, y2: nextY });

            currentX = nextX;
            currentY = nextY;
            currentLength += this.segmentLength;

            // Verzweigungen erzeugen (außer bei Zweigen selbst)
            if (!this.branch && Math.random() < this.branchProbability && currentLength < this.maxLength) {
                const branchAngle = currentAngle + (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 4);
                const branch = new LightningStrike(currentX, currentY, this.maxLength / 2, true, branchAngle);
                lightnings.push(branch); // Füge den Zweig zur Liste hinzu
            }
        }
    }

    draw() {
      // Dynamischer Farbverlauf basierend auf der aktuellen Alpha
      const gradient = lightningCtx.createLinearGradient(this.x, this.y, this.segments[this.segments.length-1].x2, this.segments[this.segments.length -1].y2); //gradient von start bis ende
      gradient.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
      gradient.addColorStop(1, `rgba(138, 43, 226, 0)`); // Blauviolett, transparent am Ende

      lightningCtx.strokeStyle = gradient;
      lightningCtx.lineWidth = 2;
      lightningCtx.beginPath(); // Beginne einen neuen Pfad

      for (const segment of this.segments) {
          lightningCtx.moveTo(segment.x1, segment.y1);
          lightningCtx.lineTo(segment.x2, segment.y2);
      }

      lightningCtx.shadowBlur = 20; // Schatten für Glüheffekt
      lightningCtx.shadowColor = `rgba(255, 255, 255, ${this.alpha})`; // Weißer Schatten
      lightningCtx.stroke(); // Zeichne den Pfad
      lightningCtx.shadowBlur = 0; // Schatten zurücksetzen
    }


    update() {
        this.alpha -= this.fadeOutRate; // Reduziere die Transparenz
        return this.alpha > 0; // Gib true zurück, wenn der Blitz noch sichtbar ist
    }
}

// --- Blitz-Verwaltung ---
let lightnings = [];
let flashOpacity = 0; // Für den Bildschirmblitz-Effekt

// --- Interaktive Blitze (Event Listener) ---
//Debounce für Mausbewegung
let mouseMoveTimeout;
lightningCanvas.addEventListener('click', (e) => {
    createLightning(e.clientX, e.clientY);
    playThunderSound();
});

lightningCanvas.addEventListener('mousemove', (e) => {
    if (Math.random() > 0.97) {
      clearTimeout(mouseMoveTimeout);
      mouseMoveTimeout = setTimeout(() => {
        createLightning(e.clientX, e.clientY);
        playThunderSound();
      }, 50); //Kürzere debounce Zeit für Mausbewegung
    }
});

function createLightning(x, y) {
    lightnings.push(new LightningStrike(x, y, height * 0.8));
    flashOpacity = 0.1; // Bildschirm kurz aufblitzen lassen
}

// --- Animations-Loop ---
function animate() {
    lightningCtx.clearRect(0, 0, width, height); // Canvas leeren
    lightningCtx.drawImage(cloudsImage, 0, 0, width, height); // Wolken zeichnen (optimiert)

    // Blitz-Array aktualisieren und zeichnen (von hinten nach vorne, effizienter)
    for (let i = lightnings.length - 1; i >= 0; i--) {
        if (!lightnings[i].update()) {
            lightnings.splice(i, 1); // Entferne unsichtbare Blitze
        } else {
            lightnings[i].draw(); // Zeichne den Blitz
        }
    }

    // Bildschirmblitz-Effekt (wenn aktiv)
    if (flashOpacity > 0) {
        lightningCtx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
        lightningCtx.fillRect(0, 0, width, height);
        flashOpacity -= 0.01; // Blitz langsam ausblenden
        if (flashOpacity <0) flashOpacity = 0; //Verhindere negative Werte.
    }

    requestAnimationFrame(animate); // Nächsten Frame anfordern
}


// --- Zufällige Blitze ---
//Verwende setInterval statt setTimeout in einer Rekursion für eine gleichmäßigere Rate.
let randomLightningInterval;
function startRandomLightning() {
    if (randomLightningInterval) clearInterval(randomLightningInterval); //Vorheriges Interval löschen
    randomLightningInterval = setInterval(() => {
      if (Math.random() > 0.96) {
        const x = Math.random() * width;
        createLightning(x, 0);
        playThunderSound();
      }
    }, 250); // Mindestverzögerung von 250 ms zwischen zufälligen Blitzen.
}

// --- Soundeffekte ---
const thunderAudio = document.querySelector('#thunder-audio');
thunderAudio.volume = 0.2;

function playThunderSound() {
    if (!thunderAudio.muted) {
        thunderAudio.currentTime = 0; // Sound von vorne beginnen
        thunderAudio.play();
    }
}

// --- Mute-Button (verbesserte Logik) ---
const muteBtn = document.getElementById('mute-btn'); //Element außerhalb der Funktion speichern
function toggleSound() {
    thunderAudio.muted = !thunderAudio.muted;
    muteBtn.textContent = thunderAudio.muted ? '🔇 Ton an' : '🔊 Ton aus';
}
muteBtn.addEventListener('click', toggleSound);

// --- Funktionen für andere Sektionen (Platzhalter, verbessert) ---
function showSection(sectionId) {
    console.log(`Sektion ${sectionId} wurde ausgewählt.`); // Template-Literal
    alert(`Informationen zum ${sectionId} werden angezeigt.`); // Template-Literal
}


// --- Weiterleitungsanimation (verbessert) ---
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', (e) => {
        e.preventDefault(); // Standardverhalten verhindern
        const link = card.getAttribute('href');
        const overlay = document.querySelector('#transition-overlay');
        overlay.style.opacity = '1'; // Overlay einblenden

        // Verzögerte Weiterleitung
        setTimeout(() => {
            window.location.href = link;
        }, 500); // Wartezeit anpassen (hier 500ms)
    });
});

// --- Scrollama Initialisierung ---
const scroller = scrollama();

// --- Scrollytelling-Funktionalität ---
function handleStepEnter(response) {
    const step = response.element;
    //const graphicId = step.parentElement.id;  // Nicht verwendet, kann entfernt werden

    // Animationen/Veränderungen basierend auf dem Schritt-Index
    switch (response.index) {
        case 0:
            // Beispiel: Bild ändern, Animation starten
            break;
        case 1:
            // Beispiel: Diagramm aktualisieren
            break;
        case 2:
            startCanvasAnimation(); // Canvas-Animation starten
            break;
        case 3:
            // Weitere Aktionen
            break;
        default:
            break;
    }
}


function setupScroller() {
    scroller
        .setup({
            step: '.step',
            offset: 0.5, // Wann der Trigger ausgelöst wird (Mitte des Bildschirms)
            debug: false, // Debug-Modus (im Produktivmodus ausschalten)
        })
        .onStepEnter(handleStepEnter);

    // Resize-Event auch an Scrollama binden
    window.addEventListener('resize', scroller.resize);
}


// --- Beispielhafte Canvas-Animation ---
function startCanvasAnimation() {
    const canvas = document.querySelector('#animation-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; // Breite an das Element anpassen
    canvas.height = canvas.offsetHeight; // Höhe an das Element anpassen

    let angle = 0; // Rotationswinkel

    function animateRotor() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Canvas leeren

        ctx.save(); // Aktuellen Zustand speichern
        ctx.translate(canvas.width / 2, canvas.height / 2); // Ursprung in die Mitte
        ctx.rotate(angle); // Rotieren

        ctx.fillStyle = '#ffeb3b'; // Gelbe Farbe
        ctx.fillRect(-50, -10, 100, 20); // Rotor zeichnen

        ctx.restore(); // Zustand wiederherstellen

        angle += 0.05; // Winkel erhöhen
        requestAnimationFrame(animateRotor); // Nächsten Frame anfordern
    }

    animateRotor(); // Animation starten
}


// --- Initialisierung beim Laden der Seite ---

function init() {
    const overlay = document.querySelector('#transition-overlay');
    overlay.style.opacity = '0'; // Overlay ausblenden
    overlay.style.pointerEvents = 'none'; // Klicks auf das Overlay verhindern

    handleResize(); //Initial aufrufen um Größe zu setzen
    setupScroller(); // Scrollama initialisieren
    startRandomLightning(); // Starte die zufälligen Blitze
    animate(); // Starte die Hauptanimation

}
window.addEventListener('load', init);