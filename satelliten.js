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


// ---------------- Satellit erstellen ----------------

function createSatellite(name, line1, line2) {

  const satrec = satellite.twoline2satrec(line1, line2);

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
      color: Cesium.Color.YELLOW
    },

    description: createSatelliteInfo(name, line1, line2)

  });

  satellites.push({
    entity: entity,
    satrec: satrec
  });

}


// ---------------- Orbitlinie ----------------

const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

handler.setInputAction(function(click) {

  const pickedObject = viewer.scene.pick(click.position);

  if (!pickedObject) return;

  const entity = pickedObject.id;

  const sat = satellites.find(s => s.entity === entity);

  if (!sat) return;

  showOrbit(sat.satrec);

}, Cesium.ScreenSpaceEventType.LEFT_CLICK);



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