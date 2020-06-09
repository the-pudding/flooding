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

output_filename = 'probabilities.csv'

def main():
    with open(output_filename, 'a') as csvfile:
        writer = csv.writer(csvfile, delimiter=',',
                            quotechar='|', quoting=csv.QUOTE_MINIMAL)

        with open('meta.csv') as f:
            reader = csv.DictReader(f, delimiter=',')
            for row in reader:
                fsid = row['fsid']
                url = "https://api.firststreet.org/v1/probability/count/city/"+str(row['fsid'])+"?key=w6e9nl3apphi9ln2mux4aazyd9gics5a"
                results = requests.get(url)
                results = results.json()
                # fsid = results['fsid']
                returnPeriods = results['data'][0]['data']
                for period in returnPeriods:
                    if period['returnPeriod'] == 100:
                        count = period['data'][0]['data'][1]['mid']
                        row = [fsid,count]
                        print row
                        writer.writerow([unicode(s).encode("utf-8") for s in row])
if __name__ == '__main__':
    main()
