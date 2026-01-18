#!/usr/bin/env python3
"""
Script per scaricare dati marini Copernicus - Ca' Pisani e Delta Futuro
Esegui sul tuo PC locale, poi carica il file JSON risultante
"""

import json
from datetime import datetime, timedelta, timezone
import copernicusmarine as cm
import numpy as np

LOCATIONS = {
    "Ca' Pisani": {"lat": 45.02194, "lon": 12.38010},
    "Delta Futuro": {"lat": 44.81887, "lon": 12.30900}
}

def fetch_data():
    results = []
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=5)
    
    for name, coords in LOCATIONS.items():
        LAT, LON = coords['lat'], coords['lon']
        BUFFER = 0.3
        
        result = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "locationName": name,
            "lat": LAT,
            "lon": LON,
            "sst": None,
            "chlorophyll": None,
            "salinity": None,
            "errors": []
        }
        
        print(f"\n=== {name} ({LAT}, {LON}) ===")
        
        # SST - Temperatura superficie
        try:
            ds = cm.open_dataset(
                dataset_id='cmems_mod_med_phy-tem_anfc_4.2km_P1D-m',
                variables=['thetao'],
                minimum_longitude=LON - BUFFER,
                maximum_longitude=LON + BUFFER,
                minimum_latitude=LAT - BUFFER,
                maximum_latitude=LAT + BUFFER,
                minimum_depth=0,
                maximum_depth=5,
                start_datetime=start.isoformat(),
                end_datetime=end.isoformat(),
            )
            vals = ds['thetao'].values.flatten()
            vals = vals[~np.isnan(vals)]
            if len(vals) > 0:
                result['sst'] = round(float(np.mean(vals)), 2)
                print(f"SST: {result['sst']}C")
        except Exception as e:
            result['errors'].append(f"SST: {str(e)}")
            print(f"SST error: {e}")
        
        # Clorofilla-a
        try:
            ds = cm.open_dataset(
                dataset_id='cmems_obs-oc_med_bgc-plankton_nrt_l3-multi-1km_P1D',
                variables=['CHL'],
                minimum_longitude=LON - 0.5,
                maximum_longitude=LON + 0.5,
                minimum_latitude=LAT - 0.5,
                maximum_latitude=LAT + 0.5,
                start_datetime=(end - timedelta(days=10)).isoformat(),
                end_datetime=end.isoformat(),
            )
            vals = ds['CHL'].values.flatten()
            vals = vals[~np.isnan(vals)]
            if len(vals) > 0:
                result['chlorophyll'] = round(float(np.mean(vals)), 3)
                print(f"Chlorophyll: {result['chlorophyll']} ug/L")
        except Exception as e:
            result['errors'].append(f"CHL: {str(e)}")
            print(f"CHL error: {e}")
        
        # Salinita
        try:
            ds = cm.open_dataset(
                dataset_id='cmems_mod_med_phy-sal_anfc_4.2km_P1D-m',
                variables=['so'],
                minimum_longitude=LON - BUFFER,
                maximum_longitude=LON + BUFFER,
                minimum_latitude=LAT - BUFFER,
                maximum_latitude=LAT + BUFFER,
                minimum_depth=0,
                maximum_depth=5,
                start_datetime=start.isoformat(),
                end_datetime=end.isoformat(),
            )
            vals = ds['so'].values.flatten()
            vals = vals[~np.isnan(vals)]
            if len(vals) > 0:
                result['salinity'] = round(float(np.mean(vals)), 2)
                print(f"Salinity: {result['salinity']} PSU")
        except Exception as e:
            result['errors'].append(f"Salinity: {str(e)}")
            print(f"Salinity error: {e}")
        
        results.append(result)
    
    # Salva risultato
    filename = f"marine_data_dual_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'='*50}")
    print(f"Dati salvati in: {filename}")
    print(json.dumps(results, indent=2))
    return results

if __name__ == "__main__":
    fetch_data()
