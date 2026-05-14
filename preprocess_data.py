import pandas as pd
import os
import glob
import numpy as np
from datetime import datetime, timedelta

ROOT_DIR = '/Users/choji/Desktop/hackatom2026'

def get_hu_load():
    all_load_data = []
    
    # Process older Excel files
    excel_files = [
        os.path.join(ROOT_DIR, '-2015/Monthly-hourly-load-values_2006-2015.xlsx'),
        os.path.join(ROOT_DIR, '2015-2018:19/MHLV_data-2015-2019.xlsx')
    ]
    
    for file in excel_files:
        if os.path.exists(file):
            xl = pd.ExcelFile(file)
            for sheet in xl.sheet_names:
                df = xl.parse(sheet, skiprows=2)
                # Ensure it has the right columns
                if 'Country' in df.columns:
                    hu_df = df[df['Country'] == 'HU'].copy()
                    # Reshape from wide (hours as columns) to long
                    # Columns 1 to 24 (or 25) are hours
                    hour_cols = [str(i) for i in range(1, 25)]
                    if '25' in hu_df.columns:
                        hour_cols.append('25')
                    
                    for _, row in hu_df.iterrows():
                        year = int(row['Year'])
                        month = int(row['Month'])
                        day = int(row['Day'])
                        for h_idx, h_col in enumerate(hour_cols):
                            val = row[h_col]
                            if pd.notna(val):
                                # Hours in these files are often 1-indexed
                                try:
                                    dt = datetime(year, month, day) + timedelta(hours=h_idx)
                                    all_load_data.append({'timestamp': dt, 'load': val})
                                except:
                                    pass

    # Process newer CSV files
    csv_files = glob.glob(os.path.join(ROOT_DIR, '20[12][0-9]/monthly_hourly_load_values_*.csv'))
    for file in csv_files:
        try:
            df = pd.read_csv(file, sep='\t')
            if 'CountryCode' in df.columns and 'DateUTC' in df.columns:
                hu_df = df[df['CountryCode'] == 'HU'].copy()
                hu_df['timestamp'] = pd.to_datetime(hu_df['DateUTC'], format='%d-%m-%Y %H:%M')
                hu_df = hu_df.rename(columns={'Value': 'load'})
                all_load_data.extend(hu_df[['timestamp', 'load']].to_dict('records'))
        except Exception as e:
            print(f"Error processing {file}: {e}")

    load_df = pd.DataFrame(all_load_data)
    load_df = load_df.drop_duplicates(subset=['timestamp']).sort_values('timestamp')
    return load_df

def get_hu_capacity():
    all_cap_data = []
    
    # Process older wide-format Excel
    excel1 = os.path.join(ROOT_DIR, '-2015/NGC_2010-2015.xlsx')
    if os.path.exists(excel1):
        xl = pd.ExcelFile(excel1)
        for sheet in xl.sheet_names:
            df = xl.parse(sheet)
            if 'Country' in df.columns:
                hu_df = df[df['Country'] == 'HU'].copy()
                # Normalize column names to lowercase for consistency in this part
                hu_df.columns = [c.lower() for c in hu_df.columns]
                for _, row in hu_df.iterrows():
                    all_cap_data.append({
                        'year': int(row['year']), 
                        'nuclear_cap': row.get('nuclear', 2000), 
                        'solar_cap': row.get('solar', 0)
                    })

    # Process newer long-format Excel
    excel2 = os.path.join(ROOT_DIR, '2015-2018:19/NGC_data-2015-2018.xlsx')
    if os.path.exists(excel2):
        xl = pd.ExcelFile(excel2)
        for sheet in xl.sheet_names:
            df = xl.parse(sheet)
            if 'Country' in df.columns:
                hu_df = df[df['Country'] == 'HU'].copy()
                for year in hu_df['Year'].unique():
                    y_df = hu_df[hu_df['Year'] == year]
                    nuc = y_df[y_df['Category'] == 'Nuclear']['ProvidedValue'].sum()
                    sol = y_df[y_df['Category'] == 'Solar']['ProvidedValue'].sum()
                    all_cap_data.append({'year': int(year), 'nuclear_cap': nuc, 'solar_cap': sol})

    # Process CSVs (Long format)
    csv_files = glob.glob(os.path.join(ROOT_DIR, '20[12][0-9]/net_generation_capacity_*.csv'))
    for file in csv_files:
        try:
            df = pd.read_csv(file, sep='\t')
            if 'Country' in df.columns:
                hu_df = df[df['Country'] == 'HU'].copy()
                if not hu_df.empty:
                    year = int(hu_df['Year'].iloc[0])
                    nuc = hu_df[hu_df['Category'] == 'Nuclear']['ProvidedValue'].sum()
                    sol = hu_df[hu_df['Category'] == 'Solar']['ProvidedValue'].sum()
                    all_cap_data.append({'year': year, 'nuclear_cap': nuc, 'solar_cap': sol})
        except Exception as e:
            pass

    cap_df = pd.DataFrame(all_cap_data)
    cap_df = cap_df.groupby('year').max().reset_index() # Take max if multiple entries
    cap_df['nuclear_cap'] = cap_df['nuclear_cap'].replace(0, 2000)
    return cap_df.sort_values('year')

def synthesize_price(load, solar, solar_cap):
    # Base price around 50 EUR/MWh
    # Price increases with load
    # Price decreases with solar production (highly correlated with solar capacity)
    # Solar production estimate: solar_cap * sin(time_of_day) during daylight
    
    base_price = 40.0
    load_effect = (load - 4000) / 100.0 # roughly 1 EUR per 100MW above 4000
    
    # Simple solar production model if we don't have hourly solar
    # (Usually we don't have hourly solar in NGC, it's just capacity)
    # We can use load patterns to guess hour of day
    return base_price + load_effect

def main():
    print("Extracting load data...")
    load_df = get_hu_load()
    print(f"Extracted {len(load_df)} load rows.")
    
    print("Extracting capacity data...")
    cap_df = get_hu_capacity()
    print(f"Extracted {len(cap_df)} capacity rows.")
    
    # Merge
    load_df['year'] = load_df['timestamp'].dt.year
    master_df = pd.merge(load_df, cap_df, on='year', how='left')
    
    # Forward/backward fill capacity
    master_df['nuclear_cap'] = master_df['nuclear_cap'].ffill().bfill().fillna(2000)
    master_df['solar_cap'] = master_df['solar_cap'].ffill().bfill().fillna(0)
    
    # Synthesize Price and Solar Production
    # Solar production: solar_cap * daylight_factor
    master_df['hour'] = master_df['timestamp'].dt.hour
    master_df['month'] = master_df['timestamp'].dt.month
    
    # Simple daylight factor: peak at 13:00, zero before 6 and after 19
    def get_solar_factor(hour):
        if 6 <= hour <= 19:
            return np.sin(np.pi * (hour - 6) / 13)
        return 0
    
    master_df['solar_factor'] = master_df['hour'].apply(get_solar_factor)
    master_df['solar_prod'] = master_df['solar_cap'] * master_df['solar_factor']
    
    # Price model: 
    # High load -> High price
    # High solar -> Low price
    master_df['price'] = 40 + (master_df['load'] - 5000) / 50 - (master_df['solar_prod'] / 100)
    # Add some seasonality to price
    master_df['price'] += np.sin(2 * np.pi * master_df['month'] / 12) * 10
    # Add random noise
    np.random.seed(42)
    master_df['price'] += np.random.normal(0, 5, len(master_df))
    
    # Add Danube Temperature (seasonal proxy)
    # Peak in August (month 8), Min in Feb (month 2)
    master_df['danube_temp'] = 15 + 10 * np.sin(2 * np.pi * (master_df['month'] - 5) / 12) + np.random.normal(0, 1, len(master_df))
    
    master_df.to_csv('backtest_master.csv', index=False)
    print("Saved backtest_master.csv")

if __name__ == "__main__":
    main()
