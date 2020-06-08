PHONY: github aws-assets aws-htmljs aws-cache pudding client

github:
	rm -rf docs
	cp -r dist/ docs
	git add -A
	git commit -m "update dev version"
	git push

archive:
	zip -r archive.zip dev
	git add -A
	git commit -m "archive"
	git push

client:
	npm run depudding



# svgs: washington-dc.svg chicago.svg new-orleans.svg

dc_cols = '\#FF0092,\#C3A5D6,\#5EADBF,\#999'
dc_cols2 = '\#FF0092,\#C3A5D6,\#098E6E,\#fff'

# cols = '\#FF3200,\#FFA027,\#FFDA66,\#999'
projection = +init=EPSG:3857

#washington dc
wash_path_zoning = 'assets/map-data/zoning_2016_washington_dc/Zoning_Regulations_of_2016.shp'
wash_path_buildings = 'assets/map-data/buildings/DistrictofColumbia.geojson'

ohio_path_buildings = 'scripts/historic/output/toledo.shp'
ohio_path_zoning = 'scripts/historic/output/merged_2.shp'
ohio_path_out = 'scripts/historic/output/output.shp'

wash_path_streets = 'assets/map-data/roads/dc_street_centerlines/Street_Centerlines.shp'
wash_path_out = 'assets/map-data/svgs/washington-dc.svg'
wash_path_water_raw = 'assets/map-data/water/dc/tl_2013_11001_areawater.shp'
wash_path_water = 'assets/map-data/water/washington-dc-water.shp'

wash_sfh = ["R-1-A","R-1-B","R-6","R-7","R-8","R-9","R-11","R-12","R-14","R-15","R-16","R-19","R-21"]
wash_attached = ["NA"]
wash_other = ["R-2","RF-1","RF-2","RF-3","R-10","R-13","R-17","R-20","R-3","RA-1","RA-10","RA-2","RA-3","RA-4","RA-5","RA-6","RA-7","RA-8","RA-9"]
wash_zoning_var = ZONING_LAB

#ogr2ogr -clipsrc -84.191605 39.758949 -84.091605 39.858949 Ohio_clipped.geojson Ohio.geojson

#gdal_polygonize.py merged.tif -f "ESRI Shapefile" merged_2.shp merged_2

clip:
	mapshaper-xl OhioFull.shp -clip samplecounty.shp -o clipped_new_2.shp

test:
	mapshaper-xl -i $(ohio_path_buildings) name=buildings \
	-proj $(projection) \
	-target buildings \
	-style stroke="rgba(0,0,0,.7)" stroke-width=.25 fill="rgb(0,0,0)" \
	-o $(ohio_path_out) target=buildings


test_2:
	mapshaper-xl -i $(ohio_path_buildings) name=data \
	-proj $(projection) \
	-target data \
	-style stroke="#ff2fa5" stroke-width=.3 fill="#ff2fa5" \
	-i $(ohio_path_zoning) name=buildings \
	-proj $(projection) \
	-style stroke="rgba(0,0,0,.7)" stroke-width=0 fill="#ffebf6" \
	-target data \
	-clip buildings \
	-i $(ohio_path_buildings) name=new \
	-proj $(projection) \
	-style stroke="rgba(0,0,0,.7)" stroke-width=0 fill="#89c4c7" \
	-o $(ohio_path_out) target=buildings,new,data



washington-dc.svg:
	mapshaper-xl -i $(wash_path_zoning) name=data \
	-proj $(projection) \
	-target data \
	-each 'zone = ($(wash_sfh).indexOf($(wash_zoning_var)) > -1 ? "single" : "other")' \
	-each 'zone = ($(wash_attached).indexOf($(wash_zoning_var)) > -1 ? "attached" : zone)' \
	-each 'zone = ($(wash_other).indexOf($(wash_zoning_var)) > -1 ? "other_res" : zone)' \
	-colorizer name=fillZone colors=$(dc_cols) other="#999" categories='single,attached,other_res,other' \
	-style fill='fillZone(zone)' \
	-i $(wash_path_buildings) name=buildings \
	-proj $(projection) \
	-style stroke="rgba(0,0,0,.7)" stroke-width=.25 fill="none" \
	-target data \
	-clip buildings \
	-i $(wash_path_zoning) name=zoning-layer \
	-proj $(projection) \
	-target zoning-layer \
	-each 'zone = ($(wash_sfh).indexOf($(wash_zoning_var)) > -1 ? "single" : "other")' \
	-each 'zone = ($(wash_attached).indexOf($(wash_zoning_var)) > -1 ? "attached" : zone)' \
	-each 'zone = ($(wash_other).indexOf($(wash_zoning_var)) > -1 ? "other_res" : zone)' \
	-colorizer name=fillZone colors=$(dc_cols2) other="#999" categories='single,attached,other_res,other' \
	-style fill='fillZone(zone)' \
	-i $(wash_path_streets) name=roads \
	-proj $(projection) \
	-style stroke="rgba(0,0,0)" stroke-width=1 fill="none" \
	-i $(wash_path_water) name=water \
	-proj $(projection) \
	-style stroke="rgba(0,0,0)" stroke-width=1 fill="none" \
	-i $(wash_path_zoning) name=boundary \
	-target boundary \
	-proj $(projection) \
	-dissolve2 \
	-style stroke="rgba(0,0,0,.7)" stroke-width=1 fill="none" \
	-frame width=800 source=data \
	-scalebar \
	-o $(wash_path_out) target=boundary,zoning-layer,data,roads,water,frame,scalebar

washington-dc-water.shp:
	mapshaper -i $(wash_path_water_raw) name=water \
	-target water \
	-proj +init=EPSG:3857 \
	-dissolve \
	-i assets/map-data/zoning_2016_washington_dc/Zoning_Regulations_of_2016.shp name=boundary \
	-target boundary \
	-proj +init=EPSG:3857 \
	-dissolve2 \
	-frame width=800 source=boundary \
	-o $(wash_path_water) target=water


# aws-assets:
# 	aws s3 sync dist s3://pudding.cool/year/month/name --delete --cache-control 'max-age=31536000' --exclude 'index.html' --exclude 'main.js'

# aws-htmljs:
# 	aws s3 cp dist/index.html s3://pudding.cool/year/month/name/index.html
# 	aws s3 cp dist/main.js s3://pudding.cool/year/month/name/main.js

# aws-cache:
# 	aws cloudfront create-invalidation --distribution-id E13X38CRR4E04D --paths '/year/month/name*'

# pudding: aws-assets aws-htmljs aws-cache archive
