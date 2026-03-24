const satellites = [];
let orbitLine = null;

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
    e => console.error("Geo‑Fehler:", e),
    { enableHighAccuracy: true }
  );
} else {
  console.warn("Geolocation nicht verfügbar");
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
 
const iss = viewer.entities.add({
  name: "ISS (International Space Station)",
 
  position: new Cesium.CallbackProperty(() => {
    return getISSPosition();
  }, false),
 
  point: {
    pixelSize: 8,
    color: Cesium.Color.RED
  },
 
  label: {
    text: "ISS",
    font: "14px sans-serif",
    fillColor: Cesium.Color.WHITE,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE
  },
 
  description: createSatelliteInfo("ISS", tleLine1, tleLine2)
});
 
satellites.push({
  entity: iss,
  satrec: issSatrec
});

// ---------------- Satelliten laden ----------------
 
loadSatellites("https://celestrak.org/NORAD/elements/stations.txt");
loadSatellites("https://celestrak.org/NORAD/elements/gps-ops.txt");
loadSatellites("https://celestrak.org/NORAD/elements/weather.txt");
loadSatellites("https://celestrak.org/NORAD/elements/science.txt");
loadSatellites("https://celestrak.org/NORAD/elements/starlink.txt");
 
 
function loadSatellites(url){
 
fetch(url)
.then(res => res.text())
.then(data => {
 
  const lines = data.split("\n");
 
  for (let i = 0; i < lines.length; i += 3) {
 
    const name = lines[i]?.trim();
    const line1 = lines[i+1];
    const line2 = lines[i+2];
 
    if(!name || !line1 || !line2) continue;
 
    createSatellite(name, line1, line2);
 
  }
 
});
 
}
 
 