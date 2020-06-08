import math
import urllib.request
import os
import glob
import subprocess
import shutil
from tile_convert import bbox_to_xyz, tile_edges
from osgeo import gdal
from argparse import ArgumentParser
from PIL import Image


#---------- CONFIGURATION -----------#

tile_server = "https://tiles-preview.firststreet.org/historic/3/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2pjazE5eTM2NDl2aDJ3cDUyeDlsb292NiJ9.Jr__XbmAolbLyzPDj7-8kQ"

#tile_server = "https://tiles-preview.firststreet.org/probability/depth/2050/100/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2pjazE5eTM2NDl2aDJ3cDUyeDlsb292NiJ9.Jr__XbmAolbLyzPDj7-8kQ"

parser = ArgumentParser()
parser.add_argument("--latMin", nargs='?', default="check_string_for_empty")
parser.add_argument("--latMax", nargs='?', default="check_string_for_empty")
parser.add_argument("--lonMin", nargs='?', default="check_string_for_empty")
parser.add_argument("--lonMax", nargs='?', default="check_string_for_empty")

args = parser.parse_args()
#python tiles_to_tiff.py --lonMin -82.612512 --lonMax -82.582203 --latMin 41.272755 --latMax 41.303938

temp_dir = 'temp'
output_dir = 'output'
zoom = 12
lon_min = float(args.lonMin)
lon_max = float(args.lonMax)
lat_min = float(args.latMin)
lat_max = float(args.latMax)


#-----------------------------------#

shutil.rmtree(temp_dir)
os.makedirs(temp_dir)

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
        png_path = download_tile(x, y, zoom, tile_server)
        img = Image.open(png_path)
        if img.getbbox():
            georeference_raster_tile(x, y, zoom, png_path)
#
print("Download complete")
#
print("Merging tiles")
merge_tiles('temp/*.tif', output_dir + '/merged_3.tif')
print("Merge complete")

shutil.rmtree(temp_dir)
os.makedirs(temp_dir)
