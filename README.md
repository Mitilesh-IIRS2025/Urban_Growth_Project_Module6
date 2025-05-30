# Urban_Growth_Project_Module6

Decadal Urban Growth Analysis of Bengaluru City
This repository contains the analysis of urban expansion and land surface temperature (LST) changes in Bengaluru (Bangalore) City, India, over the past two decades (2004, 2014, 2024) using Google Earth Engine (GEE), machine learning classifiers, and Power BI visualizations.
Urbanization, especially in developing countries, drives profound changes in land use/land cover (LULC) and contributes to the urban heat island effect. This project leverages satellite data and cloud-based geospatial analytics to examine Bengaluru’s transformation over the last 20 years.
Key highlights:

•	Data Sources: Landsat 7/8 imagery and thermal bands (2004–2024)

•	Analysis Tools: Google Earth Engine (GEE), Random Forest, K-Means clustering

•	Outputs: LULC maps, LST maps, Power BI dashboard


Objectives

•	Perform decadal LULC classification using:

      o	Supervised machine learning (Random Forest)

      o	Unsupervised clustering (K-Means)

•	Analyze land surface temperature (LST) variations

•	Integrate big data platforms (GEE), GitHub code repository, and Power BI visualizations

Study Area

Bengaluru (Bangalore), India, one of the fastest-growing urban centers driven by the IT industry, with substantial environmental impacts from urbanization.

Data and Methods

The project utilized multi-temporal satellite datasets to analyze urban growth and land surface temperature (LST) changes over the decades. Specifically, Landsat 7 (2004) with a resolution of 30 meters was used for Land Use Land Cover (LULC) classification, while Landsat 8 (2014 and 2024) provided both LULC and LST analysis. Additionally, Landsat 5 (2004) with the same resolution was used exclusively for LST derivation, ensuring a comprehensive spatiotemporal study of urban dynamics.

•	Vegetation Indices: NDVI, NDWI, SAVI

•	LST Calculation: Derived from Landsat thermal bands using NDVI-based emissivity correction and radiative transfer equations.

•	Classification:

     o	Random Forest with training data (~70% training, 30% validation, 100 trees)
     
     o	K-Means clustering with post-classification labeling
     
•	Visualization: Power BI dashboard

Results

•	Urban Expansion:

o	Built-up area increased from ~34,705 ha (2004) to ~56,821 ha (2024)

o	Vegetation and water bodies decreased steadily

•	LST Trends:
o	Maximum LST rose from ~56°C (2004) to ~61°C (2024)
o	“Very High” LST zones expanded in central and built-up areas
•	Accuracy: Random Forest outperformed K-Means in classification precision.
