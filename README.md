# Script Directory

## questions for FS

- looks like the query api is not working for offset values, meaning we can't access data for location fsids
- will fema counts be available at location levels?

## /flooding-data-scripts

### census block

#### simplification

ogr2ogr -f "ESRI Shapefile" -simplify 0.00005 tl_2019_19_tabblock10_simp.shp tl_2019_19_tabblock10.shp

ogr2ogr -f GeoJSON tl_2019_19_tabblock10_simp.geojson tl_2019_19_tabblock10_simp.shp

tippecanoe -o census_blocks.mbtiles -Z9 -z11 -ab -l --include="PROVIDERS" output_2.geojson




### /present-day

This folder contains python scripts to pull present-day flooding data. Note that these might be converted to node scripts later on.

### /historic

This folder contains python scripts to pull historic event data. Note that these might be converted to node scripts later on.

### combine-fs-data.py

This script goes through the main state zip file via Google Drive and combines files.

use flag --file [geo], where geo is either "County", "Zipcode", "State", or "City"

### tiles_to_tiff.py
This script will convert tiles from the first street tile service to a merged tif file.

- Run from command line: python tiles_to_tiff.py --lonMin -82.612512 --lonMax -82.582203 --latMin 41.272755 --latMax 41.303938
- Downloads temp png files to /temp
- Merges to /output

To do:
- Automate to loop through major cities based on lat/long bounding box
- Consider correct zoom level if city is large (zoom 13 seems to be ideal)

### geography flood data scripts

To do:
- daisy chain these scripts (probably convert to a node script)

#### grab-location-fsids.py
This script hits the query API and downloads FSIDs for a geo and outputs to data.csv

run `python grab-location-fsids.py --geo [geo]` where geo is a value of:
- property
- neighborhood
- zcta
- tract
- city
- county
- cd

#### get_location_meta.py
This script grabs meta data (city names, lat long, property count) for fsids in data.csv and outputs to meta.csv

#### get_probabilties.py
This script grabs flooding data from meta.csv and outputs to probabilities.csv

#### combine.py
Merge probabilities and meta data into merged.csv

### Questions for FS:
- What is the best way to get a full list of city, county, or state FSIDs? (we're using the query api)

# Chart Builds

## setup

- Run `npm i` (we're using node 10.15.3)
- Run `npm start`
- Localhost will launch.

## chart types

### table searches
to do:
- generate programmatically county version and (maybe) neighborhood
- auto locate based on IP address
- sort columns for results
- decide on nearby vs. similar sized cities (perhaps nationally?)

- combine into zip

# property search
-

### cluster maps (based on cities)

# Docs

## Embed Figma
https://www.figma.com/file/Q4E6osoJ78utIbFrbJQzh3/Present-day-Flood-Risk?node-id=0%3A1

## Pudding Story Figma
https://www.figma.com/file/hncKI7BV2iyTOq9m0t4GXd/flood?node-id=330%3A2

## county fema maps

download map
https://hazards.fema.gov/femaportal/NFHL/searchResult

upload to qgis for just flood hazard layer
filter -> A,Vs
save
simplify geometries -> .0001
save

go to county outlines
highlight needed county and save as filtered element

find state fsid: https://api.firststreet.org/v1/location/detail/state/13?key=w6e9nl3apphi9ln2mux4aazyd9gics5a
find county fsids: https://api.firststreet.org/v1/query?$select=county&$filter=location:state.fsid%20eq%2013&$offset=0&key=w6e9nl3apphi9ln2mux4aazyd9gics5a
transpose rows, paste into data.csv, run python get_location_meta.py --geo county
find county fsid and run: https://api.firststreet.org/v1/location/detail/county/13051?key=w6e9nl3apphi9ln2mux4aazyd9gics5a
get bbox and run python tiles_to_tiff.py --lonMin -81.391698 --lonMax -80.78296 --latMin 31.705198 --latMax 32.237591

go to raster clipper, mask with selected ccounty
raster calculator -> layer > 0 * 255...reset extent (important!)
polyonize
filter for dn > 0
save

tippecanoe -o mi_counties3.mbtiles -Z7 -z14 -ab -l --include="PROVIDERS" mi_counties3.geojson


git filter-branch --index-filter \
    'git rm --cached --ignore-unmatch flooding-data-scripts/present-day/output/merged.tif' \
    --tag-name-filter cat -- --all
