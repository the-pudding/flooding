import math
import urllib.request
import os
import glob
import subprocess
import shutil
from tile_convert import bbox_to_xyz, tile_edges
from osgeo import gdal
from argparse import ArgumentParser

#---------- CONFIGURATION -----------#

#https://api.firststreet.org/v1/tile/probability/depth/2050/100/{z}/{x}/{y}.png?key=w6e9nl3apphi9ln2mux4aazyd9gics5a

tile_server = "https://api.firststreet.org/v1/tile/probability/depth/2020/100/{z}/{x}/{y}.png?key=w6e9nl3apphi9ln2mux4aazyd9gics5a"

parser = ArgumentParser()
parser.add_argument("--latMin", nargs='?', default="check_string_for_empty")
parser.add_argument("--latMax", nargs='?', default="check_string_for_empty")
parser.add_argument("--lonMin", nargs='?', default="check_string_for_empty")
parser.add_argument("--lonMax", nargs='?', default="check_string_for_empty")

args = parser.parse_args()



#python tiles_to_tiff.py --lonMin -82.442846 --lonMax -81.187238 --latMin 33.198148 --latMax 33.87723




#python tiles_to_tiff.py --lonMin -82.612512 --lonMax -82.582203 --latMin 41.272755 --latMax 41.303938

#python tiles_to_tiff.py --lonMin -81.391698 --lonMax -80.78296 --latMin 31.705198 --latMax 32.237591

#python tiles_to_tiff.py --lonMin -81.781712 --lonMax -81.138324 --latMin 31.71266 --latMax 32.24131

#python tiles_to_tiff.py --lonMin -81.690469 --lonMax -81.150817 --latMin 29.622432 --latMax 30.252941
#python tiles_to_tiff.py --lonMin -82.049502 --lonMax -81.316712 --latMin 30.103748 --latMax 30.586232

#[-82.049502,30.103748],[-81.316712,30.103748],[-81.316712,30.586232],[-82.049502,30.586232],[-82.049502,30.103748]]


# |[[-83.551907, 42.02793], [-82.749908, 42.02793], [-82.749908, 42.451337], [-83.551907, 42.451337], [-83.551907, 42.02793]]|
# [[-83.102891, 42.447055], [-82.705966, 42.447055], [-82.705966, 42.897541], [-83.102891, 42.897541], [-83.102891, 42.447055]]
# [[-83.689438, 42.431179], [-83.083393, 42.431179], [-83.083393, 42.888647], [-83.689438, 42.888647], [-83.689438, 42.431179]]|
#
# --lonMin -83.689438 --lonMax -82.705966 --latMin 42.02793 --latMax 42.897541

temp_dir = 'temp'
output_dir = 'output'
shutil.rmtree(output_dir)
os.makedirs(output_dir)
zoom = 13
lon_min = float(args.lonMin)
lon_max = float(args.lonMax)
lat_min = float(args.latMin)
lat_max = float(args.latMax)


#-----------------------------------#

def download_tile(x, y, z, tile_server):
    url = tile_server.replace(
        "{x}", str(x)).replace(
        "{y}", str(y)).replace(
        "{z}", str(z))

    path = "temp/"+str(x)+"_"+str(y)+"_"+str(z)+".png"
    print(path, url)
    # path = '{temp_dir}/{x}_{y}_{z}.png'
    #path = f'{temp_dir}/{x}_{y}_{z}.png'
    urllib.request.urlretrieve(url, path)
    return(path)


def merge_tiles(input_pattern, output_path):
    print(input_pattern,output_path)
    merge_command = ['gdal_merge.py', '-o', output_path]

    for name in glob.glob(input_pattern):
        merge_command.append(name)

    subprocess.call(merge_command)


def georeference_raster_tile(x, y, z, path):
    bounds = tile_edges(x, y, z)
    filename, extension = os.path.splitext(path)
    gdal.Translate(filename + '.tif',
                   path,
                   outputSRS='EPSG:4326',
                   outputBounds=bounds)

#
x_min, x_max, y_min, y_max = bbox_to_xyz(
    lon_min, lon_max, lat_min, lat_max, zoom)

for x in range(x_min, x_max + 1):
    for y in range(y_min, y_max + 1):
        # print("{x},{y}")
        print (x,y,zoom)
        png_path = download_tile(x, y, zoom, tile_server)
        georeference_raster_tile(x, y, zoom, png_path)
#
print("Download complete")

print("Merging tiles")
merge_tiles('temp/*.tif', output_dir + '/merged.tif')
print("Merge complete")

shutil.rmtree(temp_dir)
os.makedirs(temp_dir)
