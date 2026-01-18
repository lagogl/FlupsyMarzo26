#!/usr/bin/env python3
"""
Fetch marine data from Copernicus Marine Data Store.
Returns JSON with SST, Chlorophyll-a for Delta Po area.
Uses verified dataset IDs for Mediterranean.
"""

import os
import sys
import json
from datetime import datetime, timedelta

os.environ['COPERNICUSMARINE_SERVICE_USERNAME'] = os.getenv('COPERNICUS_USERNAME', '')
os.environ['COPERNICUSMARINE_SERVICE_PASSWORD'] = os.getenv('COPERNICUS_PASSWORD', '')

import warnings
warnings.filterwarnings('ignore')

LAT = 44.93
LON = 12.27
BUFFER = 0.15

DATASETS = {
    'sst': 'SST_MED_SST_L4_NRT_OBSERVATIONS_010_004',
    'chl': 'OCEANCOLOUR_MED_BGC_L3_NRT_009_141',
    'phy': 'MEDSEA_ANALYSISFORECAST_PHY_006_013',
}

def fetch_sst():
    """Fetch Sea Surface Temperature from Mediterranean NRT product."""
    try:
        import copernicusmarine
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=3)
        
        ds = copernicusmarine.open_dataset(
            dataset_id='cmems_mod_med_phy-tem_anfc_4.2km_P1D-m',
            variables=['thetao'],
            minimum_longitude=LON - BUFFER,
            maximum_longitude=LON + BUFFER,
            minimum_latitude=LAT - BUFFER,
            maximum_latitude=LAT + BUFFER,
            minimum_depth=0,
            maximum_depth=5,
            start_datetime=start_date.strftime('%Y-%m-%dT00:00:00'),
            end_datetime=end_date.strftime('%Y-%m-%dT23:59:59'),
        )
        
        import numpy as np
        vals = ds['thetao'].values.flatten()
        vals = vals[~np.isnan(vals)]
        
        if len(vals) > 0:
            sst = float(np.mean(vals))
            if sst > 100:
                sst = sst - 273.15
            return round(sst, 2)
    except Exception as e:
        sys.stderr.write(f'SST error: {e}\n')
    return None

def fetch_chlorophyll():
    """Fetch Chlorophyll-a from Mediterranean NRT ocean color product."""
    try:
        import copernicusmarine
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=10)
        
        ds = copernicusmarine.open_dataset(
            dataset_id='cmems_obs-oc_med_bgc-plankton_nrt_l3-multi-1km_P1D',
            variables=['CHL'],
            minimum_longitude=LON - 0.5,
            maximum_longitude=LON + 0.5,
            minimum_latitude=LAT - 0.5,
            maximum_latitude=LAT + 0.5,
            start_datetime=start_date.strftime('%Y-%m-%dT00:00:00'),
            end_datetime=end_date.strftime('%Y-%m-%dT23:59:59'),
        )
        
        import numpy as np
        vals = ds['CHL'].values.flatten()
        vals = vals[~np.isnan(vals)]
        vals = vals[(vals > 0) & (vals < 100)]
        
        if len(vals) > 0:
            return round(float(np.mean(vals)), 3)
    except Exception as e:
        sys.stderr.write(f'Chlorophyll error: {e}\n')
    return None

def fetch_salinity():
    """Fetch Salinity from Mediterranean analysis/forecast."""
    try:
        import copernicusmarine
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=3)
        
        ds = copernicusmarine.open_dataset(
            dataset_id='cmems_mod_med_phy-sal_anfc_4.2km_P1D-m',
            variables=['so'],
            minimum_longitude=LON - BUFFER,
            maximum_longitude=LON + BUFFER,
            minimum_latitude=LAT - BUFFER,
            maximum_latitude=LAT + BUFFER,
            minimum_depth=0,
            maximum_depth=5,
            start_datetime=start_date.strftime('%Y-%m-%dT00:00:00'),
            end_datetime=end_date.strftime('%Y-%m-%dT23:59:59'),
        )
        
        import numpy as np
        vals = ds['so'].values.flatten()
        vals = vals[~np.isnan(vals)]
        vals = vals[(vals > 20) & (vals < 45)]
        
        if len(vals) > 0:
            return round(float(np.mean(vals)), 2)
    except Exception as e:
        sys.stderr.write(f'Salinity error: {e}\n')
    return None

def main():
    result = {
        'success': False,
        'source': 'copernicus-marine',
        'sourceUrl': 'https://marine.copernicus.eu',
        'timestamp': datetime.now().isoformat(),
        'location': {'lat': LAT, 'lon': LON, 'name': 'Delta Po / Adriatico Nord'},
        'data': {'sst': None, 'chlorophyllA': None, 'salinity': None},
        'errors': []
    }
    
    if not os.getenv('COPERNICUS_USERNAME') or not os.getenv('COPERNICUS_PASSWORD'):
        result['errors'].append('Missing Copernicus credentials')
        print(json.dumps(result))
        return
    
    result['data']['sst'] = fetch_sst()
    if result['data']['sst'] is None:
        result['errors'].append('SST fetch failed')
    
    result['data']['chlorophyllA'] = fetch_chlorophyll()
    if result['data']['chlorophyllA'] is None:
        result['errors'].append('Chlorophyll fetch failed')
    
    result['data']['salinity'] = fetch_salinity()
    if result['data']['salinity'] is None:
        result['errors'].append('Salinity fetch failed')
    
    if any(v is not None for v in result['data'].values()):
        result['success'] = True
    
    print(json.dumps(result))

if __name__ == '__main__':
    main()
