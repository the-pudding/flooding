# Script Directory

## /flooding-data-scripts

### /present-day

This folder contains python scripts to pull present-day flooding data. Note that these might be converted to node scripts later on.

### /historic

This folder contains python scripts to pull historic event data. Note that these might be converted to node scripts later on.

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

#### grab-cities.py
This script hits the query API and downloads FSIDs for cities and outputs to data.csv

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
- Localhost will launch



# Docs

## Embed Figma
https://www.figma.com/file/Q4E6osoJ78utIbFrbJQzh3/Present-day-Flood-Risk?node-id=0%3A1

## Pudding Story Figma
https://www.figma.com/file/hncKI7BV2iyTOq9m0t4GXd/flood?node-id=330%3A2
