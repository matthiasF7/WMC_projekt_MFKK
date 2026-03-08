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


const tleLine1 = "1 25544U 98067A   24060.51097222  .00016717  00000+0  10270-3 0  9995";
const tleLine2 = "2 25544  51.6434  60.6281 0004603  69.0391  58.7952 15.50011655439670";
const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

function getISSPosition() {

  const now = new Date();

  const positionAndVelocity = satellite.propagate(satrec, now);

  const gmst = satellite.gstime(now);

  const positionEcf = satellite.eciToEcf(
    positionAndVelocity.position,
    gmst
  );

  return Cesium.Cartesian3.fromElements(
    positionEcf.x * 1000,
    positionEcf.y * 1000,
    positionEcf.z * 1000
  );
}

const iss = viewer.entities.add({
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
  }
});

fetch("https://celestrak.org/NORAD/elements/stations.txt")
.then(res => res.text())
.then(data => {

  const lines = data.split("\n");

  for (let i = 0; i < lines.length; i += 3) {

    const name = lines[i].trim();
    const line1 = lines[i+1];
    const line2 = lines[i+2];

    if(!line1 || !line2) continue;

    createSatellite(name, line1, line2);

  }

});

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

    description: createSatelliteInfo(name, line1)

  });

  satellites.push({
    entity: entity,
    satrec: satrec
  });

}

function createOrbitLine(satrec) {

  const positions = [];
  const now = new Date();

  for (let i = 0; i < 90; i++) {

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

  // ⚠️ Nur zeichnen wenn genug Punkte vorhanden sind
  if (positions.length < 2) return;

  viewer.entities.add({
    polyline: {
      positions: positions,
      width: 1,
      material: Cesium.Color.CYAN
    }
  });

}

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

  for (let i = 0; i < 90; i++) {

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

function createSatelliteInfo(name, line1) {

  const year = "19" + line1.substring(9,11);

  let purpose = "Unbekannt";

  if (name.includes("ISS")) purpose = "Raumstation";
  if (name.includes("STARLINK")) purpose = "Internet-Satellit";
  if (name.includes("GPS")) purpose = "Navigation";
  if (name.includes("WEATHER")) purpose = "Wettersatellit";

  return `
  <h3>${name}</h3>
  <table>
    <tr><td>Zweck</td><td>${purpose}</td></tr>
    <tr><td>Startjahr</td><td>${year}</td></tr>
    <tr><td>Datenquelle</td><td>CelesTrak</td></tr>
  </table>
  `;
}