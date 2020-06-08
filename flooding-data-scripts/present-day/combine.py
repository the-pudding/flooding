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

output_filename = 'merged.csv'

def main():
    df = pd.read_csv('probabilities.csv')
    df2 = pd.read_csv('meta.csv')
    df3 = pd.merge(df, df2, on='fsid', how='outer')
    df3.to_csv('merged.csv', index=False, header=True)
if __name__ == '__main__':
    main()
