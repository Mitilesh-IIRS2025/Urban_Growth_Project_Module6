///////////////////////////
// Supervised Land Cover Classification using Landsat 8
///////////////////////////

// Load the study area shapefile
var myShapefile = ee.FeatureCollection('projects/iirs25/assets/Bengaluru_urban');
Map.centerObject(myShapefile);
Map.addLayer(myShapefile.style({color: 'red', fillColor: '00000000', width: 2}), {}, 'AOI Boundary');

// Load Landsat 8 SR and apply date & cloud filters
var dataset = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
  .filterBounds(myShapefile)
  .filterDate('2024-01-01', '2024-12-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 5));

// === Apply Scaling Factors ===
// As per USGS documentation
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

dataset = dataset.map(applyScaleFactors);

// Create median composite
var image = dataset.median().clip(myShapefile);

// === Visualization Parameters ===
var visTrueColor = {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min: 0.0,
  max: 0.3
};

var visFalseColor = {
  bands: ['SR_B5', 'SR_B4', 'SR_B3'],
  min: 0.0,
  max: 0.3
};

// === Add to Map ===
Map.addLayer(image, visTrueColor, 'Median Image (True Color)');
Map.addLayer(image, visFalseColor, 'Median Image (False Color)');

// =============================
// Calculate Indices
// =============================
var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
var ndwi = image.normalizedDifference(['SR_B3', 'SR_B5']).rename('NDWI');
var ndbi = image.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI');

var savi = image.expression(
  '((NIR - RED) / (NIR + RED + L)) * (1 + L)', {
    'NIR': image.select('SR_B5'),
    'RED': image.select('SR_B4'),
    'L': 0.5
}).rename('SAVI');



// Add all bands and indices to final image
image = image.addBands([ndvi, ndwi, ndbi, savi]);

// NDVI Visualization
Map.addLayer(ndvi, {min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'NDVI');

// =============================
// Define Training Data (Replace with your actual asset paths)
// =============================
// var Builtup = ee.FeatureCollection("users/your_username/Builtup");
// var Water = ee.FeatureCollection("users/your_username/Water");
// var Forest = ee.FeatureCollection("users/your_username/Forest");
// var Agriculture = ee.FeatureCollection("users/your_username/Agriculture");
// var BarenLand = ee.FeatureCollection("users/your_username/BarenLand");

// Rename the 'LULC' property to 'class' in the training datasets
var trainingSamples = Builtup.merge(Water).merge(Forest).merge(Agriculture).merge(BarenLand)
  .map(function(feature) {
    return feature.set('class', feature.get('LULC')); // Rename LULC to class
  });

// Define input bands
var bands = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'NDVI', 'NDWI', 'NDBI', 'SAVI'];

// Sample the image at training points
var training = image.select(bands).sampleRegions({
  collection: trainingSamples,
  properties: ['class'], // Use the 'class' property for training
  scale: 30,
  geometries: true
}).randomColumn();

// Split into training and testing datasets
var split = 0.7; // 80% training, 20% testing
var train = training.filter(ee.Filter.lt('random', split));
var test = training.filter(ee.Filter.gte('random', split));

// Train classifier (Random Forest)
var classifier = ee.Classifier.smileRandomForest(100).train({
  features: train,
  classProperty: 'class', // Use the 'class' property for classification
  inputProperties: bands
});

// Classify the image
var classified = image.select(bands).classify(classifier);

// Add classified layer to map
var palette = ['red', 'blue', 'green', 'yellow']; // Builtup, Water, Forest, Agriculture
Map.addLayer(classified, {min: 0, max: 3, palette: palette}, 'Land Cover Classification');

// Accuracy Assessment
var validation = test.classify(classifier);
var testAccuracy = validation.errorMatrix('class', 'classification');

print('Confusion Matrix:', testAccuracy);
print('Overall Accuracy:', testAccuracy.accuracy());
print('Kappa Coefficient:', testAccuracy.kappa());

// =============================
// Optional Export to Drive
// =============================
Export.image.toDrive({
  image: classified,
  description: 'LULC_Classification',
  scale: 30,
  region: myShapefile,
  maxPixels: 1e13
});
