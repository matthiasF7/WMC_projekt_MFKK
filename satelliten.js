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


