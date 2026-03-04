const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
  geocoder: false,
  timeline: false,
  animation: false
});

viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(10, 50, 20000000)
});