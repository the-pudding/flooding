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

output_filename = 'data.csv'

def main():
    with open(output_filename, 'a') as csvfile:
        writer = csv.writer(csvfile, delimiter=',',
                            quotechar='|', quoting=csv.QUOTE_MINIMAL)

        fsids = []

        url = "https://preview.firststreet.org/query?$select=city&$filter=probability:count.mid%20gt%201&$offset=0"
        results = requests.get(url)
        results = results.json()


        print(results)

        max_results = results['meta']['total']
        max_pages = int(math.ceil(max_results/100))
        for x in range(0,max_pages+1):
            offset = x*100
            url = "https://preview.firststreet.org/query?$select=city&$filter=probability:count.mid%20gt%201&$offset="+str(offset)
            results = requests.get(url)
            results = results.json()
            for result in results['results']:
                fsids.append(result)
        for fsid in fsids:
            row = fsid
            writer.writerow([row])
            # writer.writerow([unicode(s).encode("utf-8") for s in row])

if __name__ == '__main__':
    main()
