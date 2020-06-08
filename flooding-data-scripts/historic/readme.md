get coordinates of max min for area at zoom 11

maxLat: 41.57177842789608
minLat: 41.39199200575035
maxLng: -82.90738911244644
minLng: -83.14908833119638


python tiles_to_tiff.py --lonMin -83.14908833119638 --lonMax -82.90738911244644 --latMin 41.37199200575035 --latMax 41.55177842789608

run tiles download

//remove empty tif files (need to automate this)

run tile merge

# convert tif to geojson
gdal_polygonize.py output/merged.tif -f "ESRI Shapefile" output/merged_2.shp merged_2


#get buildings in bounding box
ogr2ogr -clipsrc -83.14908833119638 41.37199200575035 -82.90738911244644 41.55177842789608 toledo.shp OhioFull.shp

#mash buildings together
