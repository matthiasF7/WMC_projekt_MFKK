const satellites = [];
let orbitLine = null;

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

Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWI5NzY3ZC04ZDhmLTQ3YTItOWI1NC0xODk2Y2IxOGExNWUiLCJpZCI6NDAwMjM2LCJpYXQiOjE3NzI5NzIzNDh9.0dEE051GmsG0amp5ptTAe2GfbhFg-QjgUpS_Ilmw8ls";

const viewer = new Cesium.Viewer("cesiumContainer", {
  baseLayer: Cesium.ImageryLayer.fromWorldImagery(),
  terrainProvider: new Cesium.EllipsoidTerrainProvider(),
  baseLayerPicker: false,
  geocoder: false,
  timeline: false,
  animation: false,
});

viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(10, 50, 20000000)
});

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

// ---------------- ISS ----------------

const tleLine1 = "1 25544U 98067A   24060.51097222  .00016717  00000+0  10270-3 0  9995";
const tleLine2 = "2 25544  51.6434  60.6281 0004603  69.0391  58.7952 15.50011655439670";
const issSatrec = satellite.twoline2satrec(tleLine1, tleLine2);

function getISSPosition() {
  const now = new Date();
  const pv = satellite.propagate(issSatrec, now);
  const gmst = satellite.gstime(now);
  const pos = satellite.eciToEcf(pv.position, gmst);

  return Cesium.Cartesian3.fromElements(
    pos.x * 1000,
    pos.y * 1000,
    pos.z * 1000
  );
}

const issCategory = "ISS";

const iss = viewer.entities.add({
  name: "ISS",

  position: new Cesium.CallbackProperty(() => {
    return getISSPosition();
  }, false),

  point: {
    pixelSize: 8,
    color: categories[issCategory].color
  },

  label: {
    text: "ISS",
    font: "14px sans-serif",
    fillColor: Cesium.Color.WHITE
  }
});

satellites.push({
  entity: iss,
  satrec: issSatrec,
  category: issCategory
});

// ---------------- Satelliten laden ----------------

loadSatellites("https://celestrak.org/NORAD/elements/stations.txt");
loadSatellites("https://celestrak.org/NORAD/elements/gps-ops.txt");
loadSatellites("https://celestrak.org/NORAD/elements/weather.txt");
loadSatellites("https://celestrak.org/NORAD/elements/science.txt");
loadSatellites("https://celestrak.org/NORAD/elements/starlink.txt");

function loadSatellites(url) {
  fetch(url)
    .then(res => res.text())
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
    });
}

// ---------------- Satellit erstellen ----------------

function createSatellite(name, line1, line2) {

  const satrec = satellite.twoline2satrec(line1, line2);
  const category = getCategory(name);

  function getPosition() {
    const now = new Date();
    const pv = satellite.propagate(satrec, now);
    if (!pv.position) return;

    const gmst = satellite.gstime(now);
    const pos = satellite.eciToEcf(pv.position, gmst);

    return new Cesium.Cartesian3(
      pos.x * 1000,
      pos.y * 1000,
      pos.z * 1000
    );
  }

  const entity = viewer.entities.add({
    name: name,

    position: new Cesium.CallbackProperty(() => {
      return getPosition();
    }, false),

    point: {
      pixelSize: 6,
      color: categories[category].color
    },

    show: categories[category].visible
  });

  satellites.push({
    entity: entity,
    satrec: satrec,
    category: category
  });
}