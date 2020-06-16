import math
import os
from glob import glob
import subprocess
import shutil
from argparse import ArgumentParser
import os.path as path
from pathlib import Path
import pandas as pd
import json
from pandas.io.json import json_normalize
from pathlib import Path

state_coor = {"AK":[-154.493062,63.588753],
"AL":[-86.902298,32.318231],
"AR":[-91.831833,35.20105],
"AZ":[-111.093731,34.048928],
"CA":[-119.417932,36.778261],
"CO":[-105.782067,39.550051],
"CT":[-73.087749,41.603221],
"DE":[-75.52767,38.910832],
"FL":[-81.515754,27.664827],
"GA":[-82.907123,32.157435],
"HI":[-155.665857,19.898682],
"IA":[-93.097702,41.878003],
"ID":[-114.742041,44.068202],
"IL":[-89.398528,40.633125],
"IN":[-85.602364,40.551217],
"KS":[-98.484246,39.011902],
"KY":[-84.270018,37.839333],
"LA":[-92.145024,31.244823],
"MA":[-71.382437,42.407211],
"MD":[-76.641271,39.045755],
"ME":[-69.445469,45.253783],
"MI":[-85.602364,44.314844],
"MN":[-94.6859,46.729553],
"MO":[-91.831833,37.964253],
"MS":[-89.398528,32.354668],
"MT":[-110.362566,46.879682],
"NC":[-79.0193,35.759573],
"ND":[-101.002012,47.551493],
"NE":[-99.901813,41.492537],
"NH":[-71.572395,43.193852],
"NJ":[-74.405661,40.058324],
"NM":[-105.032363,34.97273],
"NV":[-116.419389,38.80261],
"NY":[-74.217933,43.299428],
"OH":[-82.907123,40.417287],
"OK":[-97.092877,35.007752],
"OR":[-120.554201,43.804133],
"PA":[-77.194525,41.203322],
"PR":[-66.590149,18.220833],
"RI":[-71.477429,41.580095],
"SC":[-81.163725,33.836081],
"SD":[-99.901813,43.969515],
"TN":[-86.580447,35.517491],
"TX":[-99.901813,31.968599],
"UT":[-111.093731,39.32098],
"VA":[-78.656894,37.431573],
"VT":[-72.577841,44.558803],
"WA":[-120.740139,47.751074],
"WI":[-88.787868,43.78444],
"WV":[-80.454903,38.597626],
"WY":[-107.290284,43.075968],
"DC":[-77.033418,38.905985]}

state_names = {
    "AL":"Alabama",
    "AK":"Alaska",
    "AZ":"Arizona",
    "AR":"Arkansas",
    "CA":"California",
    "CO":"Colorado",
    "CT":"Connecticut",
    "DE":"Delaware",
    "FL":"Florida",
    "GA":"Georgia",
    "HI":"Hawaii",
    "ID":"Idaho",
    "IL":"Illinois",
    "IN":"Indiana",
    "IA":"Iowa",
    "KS":"Kansas",
    "KY":"Kentucky",
    "LA":"Louisiana",
    "ME":"Maine",
    "MT":"Montana",
    "NE":"Nebraska",
    "NV":"Nevada",
    "NH":"New Hampshire",
    "NJ":"New Jersey",
    "NM":"New Mexico",
    "NY":"New York",
    "NC":"North Carolina",
    "ND":"North Dakota",
    "OH":"Ohio",
    "OK":"Oklahoma",
    "OR":"Oregon",
    "MD":"Maryland",
    "MA":"Massachusetts",
    "MI":"Michigan",
    "MN":"Minnesota",
    "MS":"Mississippi",
    "MO":"Missouri",
    "PA":"Pennsylvania",
    "RI":"Rhode Island",
    "SC":"South Carolina",
    "SD":"South Dakota",
    "TN":"Tennessee",
    "TX":"Texas",
    "UT":"Utah",
    "VT":"Vermont",
    "VA":"Virginia",
    "WA":"Washington",
    "WV":"West Virginia",
    "WI":"Wisconsin",
    "WY":"Wyoming",
    "DC":"Washington DC"
};

parser = ArgumentParser()
parser.add_argument("--file", nargs='?', default="check_string_for_empty")

args = parser.parse_args()

fileSelected = args.file

d = Path().resolve().parent.parent

dirpath = str(d)+"/state_pages"

if fileSelected == "City":
    configfiles = glob(dirpath+'/**/All_Cities_by_Properties_at_Risk.csv')
else:
    configfiles = glob(dirpath+'/**/'+fileSelected+'_Summary.csv')

#combined_csv = pd.concat([pd.read_csv(f) for f in configfiles ])
df_list = []
for f in configfiles:
    if fileSelected == "City":
        code = f.replace("/All_Cities_by_Properties_at_Risk.csv","")[-2:]
    else:
        code = f.replace("/"+fileSelected+"_Summary.csv","")[-2:]
    print(code)
    df = pd.read_csv(f)
    df["state_iso2"] = code
    if(fileSelected == "State"):
        df["locationName"] = state_names[code.upper()]
        df["Longitude"] = state_coor[code.upper()][0]
        df["Latitude"] = state_coor[code.upper()][1]
    df_list.append(df)
combined_csv = pd.concat(df_list)

file = 'post4.json'
columnMerge = "Zipcode"

if(fileSelected == "County"):
    file = 'adm2.json'
    columnMerge = 'County FIPS'

if(fileSelected == "Zipcode" or fileSelected == "County"):
    with open(file) as train_file:
        dict_train = json.load(train_file)["all"]
        train = pd.DataFrame.from_dict(dict_train, orient='index')
        train.reset_index(level=0, inplace=True)
        if fileSelected == "County":
            train["unit_code"] = train["unit_code"].str.lstrip("0")
        train[columnMerge] = train["unit_code"].astype(str)
        combined_csv[columnMerge] = combined_csv[columnMerge].astype(str)
        print(train[columnMerge].dtype)
        print(combined_csv[columnMerge].dtype)

        merged = pd.merge(combined_csv, train, on=columnMerge, how='left')
        del merged['unit_code']
        del merged['name']

        merged.rename(columns={'FS Properties at Risk 2020 (total)':'FS 2020 100 Year Risk (total)','FS Properties at Risk 2035 (total)':'FS 2035 100 Year Risk (total)','FS Properties at Risk 2050 (total)':'FS 2050 100 Year Risk (total)'}, inplace=True)



        merged = merged.sort_values('Total Properties')
        merged = merged.drop_duplicates(subset=columnMerge, keep="last")
        if 'County' in merged:
            merged["locationName"] = merged['County']
            del merged['County']
        if 'FEMA Properties at Risk 2020 (pct)' in merged:
            del merged['FEMA Properties at Risk 2020 (pct)']
        if 'FS Properties at Risk 2020 (pct)' in merged:
            del merged['FS Properties at Risk 2020 (pct)']
        if 'FS Properties at Risk 2035 (pct)' in merged:
            del merged['FS Properties at Risk 2035 (pct)']
        if 'FS Properties at Risk 2050 (pct)' in merged:
            del merged['FS Properties at Risk 2050 (pct)']
        if 'FS 2020 100 Year Risk (pct)' in merged:
            del merged['FS 2020 100 Year Risk (pct)']
        if 'FS 2035 100 Year Risk (pct)' in merged:
            del merged['FS 2035 100 Year Risk (pct)']
        if 'FS 2050 100 Year Risk (pct)' in merged:
            del merged['FS 2050 100 Year Risk (pct)']
        if 'FS 100 year Risk Change, 2020-2050 (pct)' in merged:
            del merged['FS 100 year Risk Change, 2020-2050 (pct)']
        if 'FS 2020 500 Year Risk (pct)' in merged:
            del merged['FS 2020 500 Year Risk (pct)']
        if 'FS 2035 500 Year Risk (pct)' in merged:
            del merged['FS 2035 500 Year Risk (pct)']
        if 'FS 2050 500 Year Risk (pct)' in merged:
            del merged['FS 2050 500 Year Risk (pct)']
        if 'FS 500Risk Change, 2020-2050 (pct)' in merged:
            del merged['FS 500Risk Change, 2020-2050 (pct)']
        if 'FS-FEMA Difference, 2020 (pct)' in merged:
            del merged['FS-FEMA Difference, 2020 (pct)']


        merged.to_csv(str(d)+"/state_pages/"+fileSelected+"_combined.csv", index=False, encoding='utf-8-sig')
else:
    combined_csv.rename(columns={'lat':'Latitude','long':'Longitude',"total_prop":"Total Properties","risk20":"FS 2020 100 Year Risk (total)","risk35":"FS 2035 100 Year Risk (total)","risk50":"FS 2050 100 Year Risk (total)"}, inplace=True)
    if 'risk20_pct' in combined_csv:
        del combined_csv['risk20_pct']
    if 'risk35_pct' in combined_csv:
        del combined_csv['risk35_pct']
    if 'risk50_pct' in combined_csv:
        del combined_csv['risk50_pct']
    if 'city' in combined_csv:
        combined_csv["locationName"] = combined_csv['city']
        del combined_csv['city']
    if 'FS 2020 100 Year Risk (pct)' in combined_csv:
        del combined_csv['FS 2020 100 Year Risk (pct)']
    if 'FS 2035 100 Year Risk (pct)' in combined_csv:
        del combined_csv['FS 2035 100 Year Risk (pct)']
    if 'FS 2050 100 Year Risk (pct)' in combined_csv:
        del combined_csv['FS 2050 100 Year Risk (pct)']
    if 'FS 100 year Risk Change, 2020-2050 (pct)' in combined_csv:
        del combined_csv['FS 100 year Risk Change, 2020-2050 (pct)']
    if 'FS 2020 500 Year Risk (pct)' in combined_csv:
        del combined_csv['FS 2020 500 Year Risk (pct)']
    if 'FS 2035 500 Year Risk (pct)' in combined_csv:
        del combined_csv['FS 2035 500 Year Risk (pct)']
    if 'FS 2050 500 Year Risk (pct)' in combined_csv:
        del combined_csv['FS 2050 500 Year Risk (pct)']
    if 'FS 500Risk Change, 2020-2050 (pct)' in combined_csv:
        del combined_csv['FS 500Risk Change, 2020-2050 (pct)']
    if 'FS-FEMA Difference, 2020 (pct)' in combined_csv:
        del combined_csv['FS-FEMA Difference, 2020 (pct)']
    combined_csv.to_csv(str(d)+"/state_pages/"+fileSelected+"_combined.csv", index=False, encoding='utf-8-sig')
