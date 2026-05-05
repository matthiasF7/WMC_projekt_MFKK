const satellites = [];
let orbitLine = null;
let visibleCountElement = null;
let satelliteDetails = null;
let detailsCloseButton = null;

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
  container.style.background = "rgba(0,0,0,0.75)";
  container.style.padding = "12px";
  container.style.color = "white";
  container.style.fontSize = "14px";
  container.style.zIndex = "1000";
  container.style.borderRadius = "12px";
  container.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
  container.style.maxWidth = "220px";
  container.style.fontFamily = "sans-serif";

  const title = document.createElement("div");
  title.textContent = "Satelliten-Filter";
  title.style.fontWeight = "700";
  title.style.marginBottom = "8px";
  title.style.fontSize = "14px";
  container.appendChild(title);

  for (let key in categories) {
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.marginBottom = "6px";
    label.style.gap = "8px";
    label.style.fontSize = "13px";
    label.style.cursor = "pointer";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.category = key;
    checkbox.style.margin = "0";
    checkbox.style.cursor = "pointer";

    checkbox.onchange = () => {
      categories[key].visible = checkbox.checked;
      updateVisibility();
    };

    const colorBox = document.createElement("span");
    colorBox.style.display = "inline-block";
    colorBox.style.width = "12px";
    colorBox.style.height = "12px";
    colorBox.style.borderRadius = "3px";
    colorBox.style.background = categories[key].color.toCssColorString();
    colorBox.style.flexShrink = "0";

    const text = document.createElement("span");
    text.textContent = key;
    text.style.whiteSpace = "nowrap";

    label.appendChild(checkbox);
    label.appendChild(colorBox);
    label.appendChild(text);
    container.appendChild(label);
  }

  visibleCountElement = document.createElement("div");
  visibleCountElement.style.marginTop = "0px";
  visibleCountElement.style.paddingTop = "12px";
  visibleCountElement.style.borderTop = "1px solid rgba(255,255,255,0.2)";
  visibleCountElement.style.fontWeight = "600";
  visibleCountElement.style.fontSize = "13px";
  visibleCountElement.textContent = "Satelliten sichtbar: 0";
  container.appendChild(visibleCountElement);

  document.body.appendChild(container);
}

function updateVisibleCount() {
  if (!visibleCountElement) return;
  const count = satellites.filter(s => s.entity.show).length;
  visibleCountElement.textContent = `Satelliten sichtbar: ${count}`;
}

function updateVisibility() {
  satellites.forEach(s => {
    s.entity.show = categories[s.category].visible;
  });
  updateVisibleCount();
}

// ---------------- Detail-Panel ----------------

function createDetailsPanel() {
  const panel = document.createElement("div");
  panel.id = "satellite-details";
  panel.className = "d-none";
  panel.style.position = "absolute";
  panel.style.top = "10px";
  panel.style.right = "10px";
  panel.style.zIndex = "1001";
  panel.style.width = "300px";
  panel.style.maxWidth = "calc(100vw - 20px)";
  panel.style.background = "rgba(0,0,0,0.88)";
  panel.style.color = "white";
  panel.style.padding = "14px";
  panel.style.borderRadius = "14px";
  panel.style.boxShadow = "0 12px 35px rgba(0,0,0,0.35)";
  panel.style.fontFamily = "sans-serif";
  panel.style.overflow = "auto";
  panel.style.maxHeight = "calc(100vh - 20px)";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "10px";

  const title = document.createElement("div");
  title.textContent = "Satellitendetails";
  title.style.fontSize = "1rem";
  title.style.fontWeight = "700";
  header.appendChild(title);

  detailsCloseButton = document.createElement("button");
  detailsCloseButton.type = "button";
  detailsCloseButton.textContent = "x";
  detailsCloseButton.style.background = "rgba(255,255,255,0.1)";
  detailsCloseButton.style.border = "none";
  detailsCloseButton.style.color = "white";
  detailsCloseButton.style.fontSize = "1.1rem";
  detailsCloseButton.style.width = "30px";
  detailsCloseButton.style.height = "30px";
  detailsCloseButton.style.borderRadius = "8px";
  detailsCloseButton.style.cursor = "pointer";
  detailsCloseButton.style.flexShrink = "0";

  header.appendChild(detailsCloseButton);
  panel.appendChild(header);

  satelliteDetails = document.createElement("div");
  satelliteDetails.id = "details-content";
  satelliteDetails.style.fontSize = "0.95rem";
  satelliteDetails.style.lineHeight = "1.5";
  panel.appendChild(satelliteDetails);

  detailsCloseButton.addEventListener("click", hideDetails);
  document.body.appendChild(panel);
}

function showDetails(sat) {
  if (!satelliteDetails) return;
  satelliteDetails.innerHTML = createSatelliteInfo(sat.entity.name, sat.line1, sat.line2, sat.category);
  document.getElementById("satellite-details")?.classList.remove("d-none");
}

function hideDetails() {
  document.getElementById("satellite-details")?.classList.add("d-none");
}

// ---------------- Cesium Setup ----------------

let viewer;
console.log("Initialisiere Cesium...");

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

  if (typeof satellite === 'undefined') {
    console.log("Warte auf satellite.js...");
    setTimeout(initializeAfterViewer, 500);
    return;
  }

  console.log("Starte Viewer-abhängige Initialisierung...");
  console.log("satellite.js ist jetzt verfügbar:", typeof satellite);

  createCategoryUI();
  createDetailsPanel();
  updateVisibleCount();

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

  const now = new Date();
  const tleLine1 = "1 25544U 98067A   " + formatTLEDate(now) + "  .00016717  00000+0  10270-3 0  9995";
  const tleLine2 = "2 25544  51.6434  60.6281 0004603  69.0391  58.7952 15.50011655439670";
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
    show: categories[issCategory].visible
  });

  satellites.push({
    entity: iss,
    satrec: issSatrec,
    category: issCategory,
    line1: tleLine1,
    line2: tleLine2
  });

  initOrbitHandler();
  updateVisibility();
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

setTimeout(initializeAfterViewer, 100);

// Laden von Satelliten aus URL
function startLoadingSatellites() {
  const sources = [
    "https://celestrak.org/NORAD/elements/stations.txt",
    "https://celestrak.org/NORAD/elements/gps-ops.txt",
    "https://celestrak.org/NORAD/elements/weather.txt",
    "https://celestrak.org/NORAD/elements/science.txt",
    "https://celestrak.org/NORAD/elements/starlink.txt"
  ];

  sources.forEach(url => loadSatellites(url));
}

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

  const entity = viewer.entities.add({
    name: name,
    position: new Cesium.CallbackProperty(() => {
      const now = new Date();
      const pv = satellite.propagate(satrec, now);
      if (!pv.position) return null;
      const gmst = satellite.gstime(now);
      const pos = satellite.eciToEcf(pv.position, gmst);
      return new Cesium.Cartesian3(pos.x * 1000, pos.y * 1000, pos.z * 1000);
    }, false),
    point: {
      pixelSize: 8,
      color: categories[category].color
    },
    show: categories[category].visible
  });

  satellites.push({
    entity: entity,
    satrec: satrec,
    category: category,
    line1: line1,
    line2: line2
  });

  updateVisibleCount();
}

function loadSatellites(url) {
  if (typeof satellite === 'undefined') {
    console.error("satellite.js nicht verfügbar");
    return;
  }

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(data => {
      const lines = data.split("\n");
      for (let i = 0; i < lines.length; i += 3) {
        const name = lines[i]?.trim();
        const line1 = lines[i + 1];
        const line2 = lines[i + 2];
        if (!name || !line1 || !line2) continue;
        createSatellite(name, line1, line2);
      }
      updateVisibility();
    })
    .catch(err => {
      console.error(`Fehler beim Laden von ${url}:`, err);
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
    showDetails(sat);
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
    positions.push(new Cesium.Cartesian3(pos.x * 1000, pos.y * 1000, pos.z * 1000));
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

function createSatelliteInfo(name, line1, line2, category) {
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
    <div style="margin-bottom: 10px;">
      <h3 style="margin: 0 0 8px 0; font-size: 1rem;">${name}</h3>
      <div style="font-size: 0.95rem; line-height: 1.5;">
        <div><strong>Kategorie:</strong> ${category}</div>
        <div><strong>Zweck:</strong> ${purpose}</div>
        <div><strong>Startjahr:</strong> ${year}</div>
        <div><strong>Orbittyp:</strong> ${orbit}</div>
        <div><strong>Datenquelle:</strong> CelesTrak</div>
      </div>
    </div>
  `;
}

// ---------------- Orbittyp ----------------

function getOrbitType(line2) {
  const meanMotion = parseFloat(line2.substring(52, 63));
  if (meanMotion > 11) return "Low Earth Orbit (LEO)";
  if (meanMotion > 2) return "Medium Earth Orbit (MEO)";
  return "Geostationary Orbit (GEO)";
}

// ---------------- Startjahr ----------------

function getLaunchYear(line1) {
  let year = parseInt(line1.substring(9, 11), 10);
  if (year < 57) year = 2000 + year;
  else year = 1900 + year;
  return year;
}