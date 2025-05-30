var roi = ee.FeatureCollection('projects/ee-swarna221102/assets/bengaluru')





// Filter Landsat 8 Surface Reflectance Tier 1 for 2024, cloud filtered
var landsatCollection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterDate('2024-02-01', '2024-05-31')
  .filterBounds(roi)
  .filter(ee.Filter.lt('CLOUD_COVER', 20));

// Function to calculate LST from Landsat 8 Thermal Infrared Sensor (Band 10)
function calculateLST(image) {
  // Select thermal band 10 (units: Kelvin * 100)
  var thermal = image.select('ST_B10').multiply(0.00341802).add(149)

  // Calculate NDVI for emissivity
  var nir = image.select('SR_B5');
  var red = image.select('SR_B4');
  var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');

  // Estimate emissivity based on NDVI thresholds
  var pv = ndvi.subtract(0.2).divide(0.5 - 0.2).clamp(0,1); // proportion of vegetation
  var emissivity = pv.multiply(0.985).add(ee.Image(1).subtract(pv).multiply(0.97));

  // Calculate LST in Celsius using emissivity correction
  // Formula from USGS Landsat 8 guide:
  // LST = BT / (1 + (λ * BT / ρ) * ln(emissivity))
  var lambda = 10.895e-6; // wavelength of emitted radiance for band 10 (meters)
  var rho = 1.438e-2;     // h*c/sigma (constant)

  var lst = thermal.expression(
    'BT / (1 + (lambda * BT / rho) * log(emissivity))',
    {
      'BT': thermal,
      'lambda': lambda,
      'rho': rho,
      'emissivity': emissivity
    }).subtract(273.15).rename('LST_C'); // Convert K to C

  return image.addBands(lst).addBands(ndvi).set('system:time_start', image.get('system:time_start'));
}

// Apply LST calculation to collection
var lstCollection = landsatCollection.map(calculateLST);

// Calculate mean LST for 2024 and clip to ROI
var meanLST = lstCollection.select('LST_C').mean().clip(roi);

// Visualization parameters
var visParams = {
  min: 20,
  max: 45,
  palette: [ 'green', 'yellow', 'orange', 'red']
};

// Add to map
Map.centerObject(roi, 9);
Map.addLayer(meanLST, visParams, 'Mean Landsat 8 LST 2024');

// Calculate statistics of meanLST over ROI
var stats = meanLST.reduceRegion({
  reducer: ee.Reducer.mean()
            .combine(ee.Reducer.min(), '', true)
            .combine(ee.Reducer.max(), '', true)
            .combine(ee.Reducer.stdDev(), '', true),
  geometry: roi,
  scale: 30,
  maxPixels: 1e13
});

// Print the statistics
print('Landsat 8 Mean LST stats (°C):', stats);


// Export mean LST as GeoTIFF
Export.image.toDrive({
  image: meanLST,
  description: 'Landsat8_LST_2024_Mean',
  folder: 'GEE_LST',
  fileNamePrefix: 'Landsat8_LST_2024_mean',
  region: roi,
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});