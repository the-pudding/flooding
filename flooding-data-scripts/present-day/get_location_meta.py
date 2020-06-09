import sys
import time
import re
import unicodedata
import math
import string
import json
from pprint import pprint
import datetime
import pandas as pd
import requests
import logging
import time
import urllib2
import csv
reload(sys)
sys.setdefaultencoding("utf-8")

from argparse import ArgumentParser

parser = ArgumentParser()
parser.add_argument("--geo", nargs='?', default="check_string_for_empty")
args = parser.parse_args()


geo = args.geo


output_filename = 'tract.csv'

def main():
    with open(output_filename, 'a') as csvfile:
        writer = csv.writer(csvfile, delimiter=',',
                            quotechar='|', quoting=csv.QUOTE_MINIMAL)

        reader = csv.reader(open('data.csv'))
        first = ["fsid","name","fips","lsad","longitude","latitude","properties","atRisk"]
        writer.writerow(first)

        for row in reader:
            print(row)
            url = "https://api.firststreet.org/v1/location/detail/"+geo+"/"+row[0]+"?key=w6e9nl3apphi9ln2mux4aazyd9gics5a"
            results = requests.get(url)
            results = results.json()
            fsid = results['fsid']
            fips = results['fips']
            name = results['name']
            centroid = results['geometry']['center']['coordinates']
            if(geo == "city"):
                lsad = results['lsad']
            else:
                lsad = None

            url = "https://api.firststreet.org/v1/location/summary/"+geo+"/"+row[0]+"?key=w6e9nl3apphi9ln2mux4aazyd9gics5a"
            results = requests.get(url)
            results = results.json()

            properties = results['properties']['total']
            atRisk = results['properties']['atRisk']
            row = [fsid,name,fips,lsad,centroid[0],centroid[1],properties,atRisk]
            writer.writerow([unicode(s).encode("utf-8") for s in row])
if __name__ == '__main__':
    main()
