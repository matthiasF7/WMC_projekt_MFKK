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