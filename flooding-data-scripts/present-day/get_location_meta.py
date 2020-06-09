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

output_filename = 'meta.csv'

def main():
    with open(output_filename, 'a') as csvfile:
        writer = csv.writer(csvfile, delimiter=',',
                            quotechar='|', quoting=csv.QUOTE_MINIMAL)

        reader = csv.reader(open('data.csv'))

        for row in reader:
            url = "https://api.firststreet.org/v1/location/detail/city/"+row[0]+"?key=w6e9nl3apphi9ln2mux4aazyd9gics5a"
            results = requests.get(url)
            results = results.json()
            fsid = results['fsid']
            name = results['name']
            state_name = results['state']['name']
            state_fsid = results['state']['fsid']
            centroid = results['geometry']['center']['coordinates']
            lsad = results['lsad']
            properties = results['properties']
            row = [fsid,name,state_name,state_fsid,properties,lsad,centroid[0],centroid[1]]
            writer.writerow([unicode(s).encode("utf-8") for s in row])
if __name__ == '__main__':
    main()
