const satellites = [];
let orbitLine = null;

Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWI5NzY3ZC04ZDhmLTQ3YTItOWI1NC0xODk2Y2IxOGExNWUiLCJpZCI6NDAwMjM2LCJpYXQiOjE3NzI5NzIzNDh9.0dEE051GmsG0amp5ptTAe2GfbhFg-QjgUpS_Ilmw8ls";

// ---------------- Kategorien ----------------

const categories = {
  ISS: { color: Cesium.Color.RED, visible: true },
  STARLINK: { color: Cesium.Color.CYAN, visible: true },
  GPS: { color: Cesium.Color.GREEN, visible: true },
  WEATHER: { color: Cesium.Color.BLUE, visible: true },
  SCIENCE: { color: Cesium.Color.ORANGE, visible: true },
  OTHER: { color: Cesium.Color.YELLOW, visible: true }
};

function getCategory(name) {
  const n = name.toUpperCase();

  if (n.includes("ISS")) return "ISS";
  if (n.includes("STARLINK")) return "STARLINK";
  if (n.includes("GPS")) return "GPS";
  if (n.includes("WEATHER") || n.includes("METEOR")) return "WEATHER";
  if (n.includes("SCIENCE") || n.includes("HUBBLE")) return "SCIENCE";

  return "OTHER";
}

// ---------------- UI Filter ----------------

function createCategoryUI() {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.left = "10px";
  container.style.background = "rgba(0,0,0,0.7)";
  container.style.padding = "10px";
  container.style.color = "white";
  container.style.fontSize = "14px";
  container.style.zIndex = "1000";

  for (let key in categories) {

    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.marginBottom = "4px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;

    checkbox.onchange = () => {
      categories[key].visible = checkbox.checked;
      updateVisibility();
    };

    // Farbindikator (kleines Quadrat)
    const colorBox = document.createElement("span");
    colorBox.style.display = "inline-block";
    colorBox.style.width = "12px";
    colorBox.style.height = "12px";
    colorBox.style.margin = "0 6px";
    colorBox.style.background = categories[key].color.toCssColorString();

    const text = document.createElement("span");
    text.textContent = key;

    label.appendChild(checkbox);
    label.appendChild(colorBox);
    label.appendChild(text);

    container.appendChild(label);
  }

  document.body.appendChild(container);
}

function updateVisibility() {
  satellites.forEach(s => {
    const cat = s.category;
    s.entity.show = categories[cat].visible;
  });
}

// ---------------- Cesium Setup ----------------

// Cesium Setup - Einfach und zuverlässig
let viewer;
console.log("Initialisiere Cesium...");

// Warte bis DOM bereit ist
document.addEventListener('DOMContentLoaded', function() {
  try {
    const container = document.getElementById("cesiumContainer");
    console.log("cesiumContainer gefunden:", !!container);
    console.log("Container Größe:", container?.offsetWidth, "x", container?.offsetHeight);
    
    viewer = new Cesium.Viewer("cesiumContainer", {

      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      baseLayerPicker: false,
      vrButton: false,
      infoBox: false,
      geocoder: false,
      timeline: false,
      animation: false,
      sceneMode: Cesium.SceneMode.SCENE3D,
      scene3DOnly: false
    });
    
    console.log("✓ Cesium Viewer erstellt");
    
    // Kamera positionieren
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, 20000000),
      orientation: {
        heading: 0,
        pitch: -45,
        roll: 0
      }
    });
    
    console.log("✓ Cesium vollständig initialisiert");
    console.log("✓ satellite.js verfügbar:", typeof satellite !== 'undefined');
    
  } catch (e) {
    console.error("❌ Fehler bei Cesium-Initialisierung:", e);
    const container = document.getElementById("cesiumContainer");
    if (container) {
      container.innerHTML = "<div style='color: red; padding: 20px;'>Fehler: " + e.message + "</div>";
    }
  }
}, { once: true });

// Debug-Info auf der Seite anzeigen
function updateDebugInfo() {
  const debugDiv = document.getElementById("debug-info");
  if (debugDiv) {
    debugDiv.innerHTML = `
      Satelliten: ${satellites.length}<br>
      ISS: ${satellites.filter(s => s.category === "ISS").length}<br>
      Starlink: ${satellites.filter(s => s.category === "STARLINK").length}<br>
      GPS: ${satellites.filter(s => s.category === "GPS").length}
    `;
  }
}

setInterval(updateDebugInfo, 1000);

// Alles Weitere wird initialisiert, wenn Viewer bereit ist
function initializeAfterViewer() {
  if (!viewer) {
    console.error("Viewer noch nicht initialisiert");
    setTimeout(initializeAfterViewer, 500);
    return;
  }
  
  // Warte auf satellite.js
  if (typeof satellite === 'undefined') {
    console.log("Warte auf satellite.js...");
    setTimeout(initializeAfterViewer, 500);
    return;
  }
  
  console.log("Starte Viewer-abhängige Initialisierung...");
  console.log("satellite.js ist jetzt verfügbar:", typeof satellite);
  
  createCategoryUI();

  // ---------------- Standort ----------------

  const user = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(0, 0),
    point: {
      pixelSize: 10,
      color: Cesium.Color.WHITE,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
    },
    label: {
      text: "Standort",
      font: "14px sans-serif",
      fillColor: Cesium.Color.BLACK,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      pixelOffset: new Cesium.Cartesian2(0, 0),
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER
    }
  });

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      p => {
        const { latitude: lat, longitude: lon, altitude: alt = 0 } = p.coords;
        user.position = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
      },
      e => console.error("Geo-Fehler:", e),
      { enableHighAccuracy: true }
    );
  }

  // ISS mit aktuellem Datum laden
  const now = new Date();
  const tleLine1 = "1 25544U 98067A   " + formatTLEDate(now) + "  .00016717  00000+0  10270-3 0  9995";
  const tleLine2 = "2 25544  51.6434  60.6281 0004603  69.0391  58.7952 15.50011655439670";
  console.log("ISS TLE:", tleLine1);
  
  let issSatrec;
  try {
    issSatrec = satellite.twoline2satrec(tleLine1, tleLine2);
  } catch (e) {
    console.error("❌ Fehler beim Laden der ISS TLE:", e);
    return;
  }
  
  const issCategory = "ISS";
  
  const iss = viewer.entities.add({
    name: "ISS",
    position: new Cesium.CallbackProperty(() => {
      const now = new Date();
      try {
        const pv = satellite.propagate(issSatrec, now);
        if (!pv.position) return null;
        const gmst = satellite.gstime(now);
        const pos = satellite.eciToEcf(pv.position, gmst);
        return Cesium.Cartesian3.fromElements(pos.x * 1000, pos.y * 1000, pos.z * 1000);
      } catch (e) {
        console.error("Fehler bei ISS-Position:", e);
        return null;
      }
    }, false),
    point: {
      pixelSize: 8,
      color: categories[issCategory].color
    },
    label: {
      text: "ISS",
      font: "14px sans-serif",
      fillColor: Cesium.Color.WHITE
    },
    show: true
  });

  satellites.push({
    entity: iss,
    satrec: issSatrec,
    category: issCategory
  });
  
  console.log("ISS hinzugefügt");
  
  // Initialisiere Orbit-Handler
  initOrbitHandler();
  
  // Starte Laden der Satelliten
  startLoadingSatellites();
}

function formatTLEDate(date) {
  const year = date.getFullYear().toString().slice(-2);
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const dayStr = dayOfYear.toString().padStart(3, '0');
  const fraction = (date.getHours() + date.getMinutes()/60 + date.getSeconds()/3600) / 24;
  const fractionStr = Math.floor(fraction * 100000).toString().padStart(5, '0');
  return year + dayStr + '.' + fractionStr;
}

// Starte wenn DOMContentLoaded
setTimeout(initializeAfterViewer, 100);

// Laden von Satelliten aus URL
function startLoadingSatellites() {
  console.log("Starte Laden der Satelliten...");
  
  const sources = [
    "https://celestrak.org/NORAD/elements/stations.txt",
    "https://celestrak.org/NORAD/elements/gps-ops.txt",
    "https://celestrak.org/NORAD/elements/weather.txt",
    "https://celestrak.org/NORAD/elements/science.txt",
    "https://celestrak.org/NORAD/elements/starlink.txt"
  ];
  
  sources.forEach(url => loadSatellites(url));
  
  // Test: Ein Starlink-Satellit lokal hinzufügen zum Testen
  setTimeout(() => {
    console.log("\n=== TEST: Füge Test-Starlink-Satellit hinzu ===");
    try {
      if (typeof satellite === 'undefined') {
        console.error("satellite.js nicht verfügbar für Test");
        return;
      }
      const testName = "STARLINK-1130";
      const testLine1 = "1 44713U 19074BJ  24060.51234568  .00003654  00000-0  22846-3 0  9998";
      const testLine2 = "2 44713  53.0544 105.6304 0001445  97.1835 262.9391 15.48916393198274";
      createSatellite(testName, testLine1, testLine2);
      console.log("✓ Test-Satellit erstellt");
    } catch (e) {
      console.error("❌ Fehler bei Test-Satellit:", e);
    }
  }, 1000);
}
// ---------------- Satellit erstellen ----------------

function createSatellite(name, line1, line2) {
  let satrec;
  try {
    satrec = satellite.twoline2satrec(line1, line2);
  } catch (e) {
    console.error(`Ungültige TLE für ${name}:`, e);
    return;
  }

  if (satrec.error) {
    console.warn(`TLE Error für ${name}: ${satrec.error}`);
    return;
  }

  const category = getCategory(name);

  function getPosition() {
    const now = new Date();
    try {
      const pv = satellite.propagate(satrec, now);
      if (!pv.position) return null;

      const gmst = satellite.gstime(now);
      const pos = satellite.eciToEcf(pv.position, gmst);

      return new Cesium.Cartesian3(
        pos.x * 1000,
        pos.y * 1000,
        pos.z * 1000
      );
    } catch (e) {
      return null;
    }
  }

  try {
    const entity = viewer.entities.add({
      name: name,
      position: new Cesium.CallbackProperty(() => {
        return getPosition();
      }, false),
      point: {
        pixelSize: 8,
        color: categories[category].color
      },
      label: {
        text: name,
        font: "12px sans-serif",
        fillColor: Cesium.Color.WHITE,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER
      },
      show: categories[category].visible
    });

    satellites.push({
      entity: entity,
      satrec: satrec,
      category: category
    });
  } catch (e) {
    console.error(`Fehler beim Hinzufügen von ${name} zum Viewer:`, e);
  }
}

// Laden von Satelliten aus URL
function loadSatellites(url) {
  if (typeof satellite === 'undefined') {
    console.error("satellite.js nicht verfügbar");
    return;
  }
  
  console.log(`Lade: ${url}`);
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(data => {
      console.log(`✓ Geladen: ${url}, ${data.length} Zeichen`);
      const lines = data.split("\n");
      let count = 0;

      for (let i = 0; i < lines.length; i += 3) {
        const name = lines[i]?.trim();
        const line1 = lines[i + 1];
        const line2 = lines[i + 2];

        if (!name || !line1 || !line2) continue;

        try {
          createSatellite(name, line1, line2);
          count++;
        } catch (e) {
          console.error(`Fehler bei ${name}:`, e);
        }
      }

      console.log(`${count} Satelliten aus ${url} erstellt`);
      updateVisibility();
    })
    .catch(err => {
      console.error(`❌ Fehler beim Laden (${url}):`, err);
    });
}

//---------------- Orbitlinie ----------------

function initOrbitHandler() {
  if (!viewer) return;
  
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  
  handler.setInputAction(function(click) {
    const pickedObject = viewer.scene.pick(click.position);
    if (!pickedObject) return;
    
    const entity = pickedObject.id;
    const sat = satellites.find(s => s.entity === entity);
    
    if (!sat) return;
    showOrbit(sat.satrec);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
 
 
 
function showOrbit(satrec) {
 
  if (orbitLine) {
    viewer.entities.remove(orbitLine);
  }
 
  const positions = [];
  const now = new Date();
 
  for (let i = 0; i < 120; i++) {
 
    const time = new Date(now.getTime() + i * 60000);
    const pv = satellite.propagate(satrec, time);
 
    if (!pv.position) continue;
 
    const gmst = satellite.gstime(time);
    const pos = satellite.eciToEcf(pv.position, gmst);
 
    positions.push(
      new Cesium.Cartesian3(
        pos.x * 1000,
        pos.y * 1000,
        pos.z * 1000
      )
    );
  }
 
  if (positions.length < 2) return;
 
  orbitLine = viewer.entities.add({
    polyline: {
      positions: positions,
      width: 1,
      material: Cesium.Color.CYAN
    }
  });
 
}
 
 
 
// ---------------- Infos ----------------
 
function createSatelliteInfo(name, line1, line2) {
 
  const year = getLaunchYear(line1);
  const orbit = getOrbitType(line2);
 
  let purpose = "Unbekannt";
 
  const n = name.toUpperCase();
 
  if (n.includes("ISS")) purpose = "Raumstation";
  else if (n.includes("STARLINK")) purpose = "Internet-Satellit";
  else if (n.includes("GPS")) purpose = "Navigation";
  else if (n.includes("WEATHER")) purpose = "Wettersatellit";
  else if (n.includes("METEOR")) purpose = "Wettersatellit";
  else if (n.includes("HUBBLE")) purpose = "Weltraumteleskop";
  else if (n.includes("SCIENCE")) purpose = "Forschung";
 
  return `
  <h3>${name}</h3>
  <table>
    <tr><td>Zweck</td><td>${purpose}</td></tr>
    <tr><td>Startjahr</td><td>${year}</td></tr>
    <tr><td>Orbittyp</td><td>${orbit}</td></tr>
    <tr><td>Datenquelle</td><td>CelesTrak</td></tr>
  </table>
  `;
}
 
 
 
// ---------------- Orbittyp ----------------
 
function getOrbitType(line2){
 
const meanMotion=parseFloat(line2.substring(52,63));
 
if(meanMotion>11) return "Low Earth Orbit (LEO)";
if(meanMotion>2) return "Medium Earth Orbit (MEO)";
return "Geostationary Orbit (GEO)";
 
}
 
 
 
// ---------------- Startjahr ----------------
 
function getLaunchYear(line1){
 
let year=parseInt(line1.substring(9,11));
 
if(year<57) year=2000+year;
else year=1900+year;
 
return year;
 
}