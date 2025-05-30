// Define Area of Interest (AOI)
// var aoi = projects/ee-mithileshpadhan/assets/Bengaluru_urban

// Load Landsat 8 Surface Reflectance Data (using median composite)
var landsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
  .filterBounds(aoi)
  .filterDate('2004-01-01', '2004-12-31')
  .map(function(image) {
    return image.multiply(0.0000275).add(-0.2) // Apply scaling
                .copyProperties(image, ["system:time_start"]);
  })
  .median()
  .clip(aoi);

// Select bands
var bands = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];

// Calculate indices using median composite
var ndvi = landsat.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
var savi = landsat.expression(
  '((NIR - RED) / (NIR + RED + L)) * (1 + L)', {
    'NIR': landsat.select('SR_B5'),
    'RED': landsat.select('SR_B4'),
    'L': 0.5
  }).rename('SAVI');
var ndwi = landsat.normalizedDifference(['SR_B3', 'SR_B5']).rename('NDWI');

// Stack median bands + indices
var stack = landsat.select(bands).addBands(ndvi).addBands(savi).addBands(ndwi);

// Visualize True Color Composite (TCC) and False Color Composite (FCC)
Map.centerObject(aoi, 10);
Map.addLayer(landsat, {bands: ['SR_B4', 'SR_B3', 'SR_B2'], min: 0, max: 0.3}, 'TCC (True Color)');
Map.addLayer(landsat, {bands: ['SR_B5', 'SR_B4', 'SR_B3'], min: 0, max: 0.3}, 'FCC (False Color)');

// Visualize indices
Map.addLayer(ndvi, {min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'NDVI (Median)');
Map.addLayer(ndwi, {min: -1, max: 1, palette: ['brown', 'white', 'blue']}, 'NDWI (Median)');
Map.addLayer(savi, {min: -1, max: 1, palette: ['brown', 'white', 'green']}, 'SAVI (Median)');

// K-Means Clustering
var training = stack.sample({
  region: aoi,
  scale: 30,
  numPixels: 5000
});

var clusterer = ee.Clusterer.wekaKMeans(10).train(training);
var result = stack.cluster(clusterer);

// Add classified result to map
Map.addLayer(result.randomVisualizer(), {}, 'LULC Classification');

// Select bands for FCC (NIR, RED, GREEN)
var fcc = landsat.select(['SR_B5', 'SR_B4', 'SR_B3']);

// Visualize FCC (NIR-RED-GREEN)
Map.centerObject(aoi, 10);
Map.addLayer(fcc, {min: 0, max: 0.3}, 'FCC');

// Export the result
Export.image.toDrive({
  image: result,
  description: 'LULC_Classification_KMeans',
  scale: 30,
  region: aoi,
  maxPixels: 1e13
});



// Export FCC to Google Drive
Export.image.toDrive({
  image: fcc,
  description: 'Landsat_FCC',
  scale: 30,
  region: aoi,
  maxPixels: 1e13
});