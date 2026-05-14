import time
import json
import random
import requests
import pandas as pd
import numpy as np
import xgboost as xgb
from datetime import datetime, timedelta
from backtest_engine import optimize_allocation, prepare_features, REACTOR_POWER, HYDROGEN_PRICE_EQUIV, HEAT_PRICE, COOLING_COST_COEFF

def fetch_danube_temp():
    try:
        res = requests.get('https://api.open-meteo.com/v1/forecast?latitude=46.57&longitude=18.85&current_weather=true', timeout=5)
        return res.json()['current_weather']['temperature']
    except:
        return 20.0

def main():
    print("Initializing Live Brain with 48-hour forecasting...")
    
    # Load Models
    load_model = xgb.XGBRegressor()
    load_model.load_model('load_model.json')
    
    price_model = xgb.XGBRegressor()
    price_model.load_model('price_model.json')
    
    with open('model_features.json', 'r') as f:
        features = json.load(f)

    # Load backtest data to act as our live stream
    df = pd.read_csv('backtest_master.csv')
    df = prepare_features(df)
    
    # Filter to 2024+ and reset index so we can walk through it
    test_df = df[df['timestamp'].dt.year >= 2024].reset_index(drop=True)
    
    # Start somewhere in the middle of 2024
    current_idx = 4000 
    
    prev_allocation = {'elec': 2000, 'h2': 0, 'heat': 0, 'cooling': 0}
    print("Models loaded. Entering Live Mode...")
    
    while True:
        timestamp = datetime.now().isoformat()
        
        # Base Danube temp (jittered slightly over 48h)
        base_danube = fetch_danube_temp()
        
        # Safety check: loop back if we reach the end of the dataset
        if current_idx + 48 >= len(test_df):
            current_idx = 0
            
        # Get the 48 hour window
        window = test_df.iloc[current_idx:current_idx+48].copy()
        
        timeline_logs = []
        
        # Market jitter for this 10-second tick
        load_jitter = random.uniform(-0.015, 0.015)
        price_jitter = random.uniform(-0.015, 0.015)
        
        curr_alloc = prev_allocation.copy()
        
        for i in range(len(window)):
            row = window.iloc[i]
            ts = row['timestamp']
            
            # Apply jitter
            live_load = row['load'] * (1 + load_jitter)
            live_price = row['price'] * (1 + price_jitter)
            
            # Danube temp forecast (drifts slightly based on hour of day)
            hour_of_day = ts.hour
            temp_variation = np.sin(np.pi * (hour_of_day - 6) / 12) * 2
            danube_temp = base_danube + temp_variation
            
            # Inference
            X_inf = row[features].values.reshape(1, -1)
            pred_price = float(price_model.predict(X_inf)[0]) * (1 + price_jitter)
            pred_load = float(load_model.predict(X_inf)[0]) * (1 + load_jitter)
            
            month = ts.month
            alloc = optimize_allocation(pred_price, danube_temp, curr_alloc, month)
            
            baseline_rev = REACTOR_POWER * live_price
            opt_rev = (alloc['elec'] * live_price + 
                       alloc['h2'] * HYDROGEN_PRICE_EQUIV +
                       alloc['heat'] * HEAT_PRICE -
                       alloc['cooling'] * COOLING_COST_COEFF)
            
            revenue_gain = opt_rev - baseline_rev
            
            timeline_logs.append({
                "hour_index": i,
                "timestamp": str(ts),
                "live_load_mw": round(live_load, 2),
                "live_price_eur": round(live_price, 2),
                "danube_temp_c": round(danube_temp, 2),
                "pred_price_eur": round(pred_price, 2),
                "pred_load_mw": round(pred_load, 2),
                "allocation": {k: round(v, 2) for k, v in alloc.items()},
                "revenue_gain": round(revenue_gain, 2)
            })
            
            curr_alloc = alloc
            
        # The "current" state is the 0th hour of our 48-hour window
        current_state = timeline_logs[0]
        
        # Build explanation for the current hour
        reasons = []
        a = current_state['allocation']
        p = current_state['pred_price_eur']
        dt = current_state['danube_temp_c']
        
        if a['cooling'] > 0:
            reasons.append(f"Danube temp high ({dt:.1f}°C); diverted {a['cooling']:.1f}MW to cooling")
        if a['h2'] > 0 and p < HYDROGEN_PRICE_EQUIV:
            reasons.append(f"Price dip predicted (€{p:.2f}/MWh); shifting {a['h2']:.1f}MW to Hydrogen")
        elif a['heat'] > 0 and p < HEAT_PRICE:
            reasons.append(f"Heating demand profitable; shifting {a['heat']:.1f}MW to Heat")
        if a['elec'] > 0:
            if p >= max(HYDROGEN_PRICE_EQUIV, HEAT_PRICE):
                reasons.append(f"Grid price spike predicted (€{p:.2f}/MWh); maximizing Electricity")
            else:
                reasons.append(f"Fulfilling remaining capacity with Electricity ({a['elec']:.1f}MW)")
                
        status = {
            "timestamp": timestamp,
            "live_metrics": {
                "current_price_eur": current_state['live_price_eur'],
                "current_load_mw": current_state['live_load_mw'],
                "danube_temp_c": current_state['danube_temp_c'],
                "predicted_next_price_eur": current_state['pred_price_eur']
            },
            "recommendation": current_state['allocation'],
            "revenue_gain_eur_per_hour": current_state['revenue_gain'],
            "ai_explanation": " | ".join(reasons),
            "timeline": timeline_logs
        }
        
        with open('live_status.json', 'w') as f:
            json.dump(status, f, indent=2)
            
        print(f"[{timestamp}] Advanced dataset to {current_state['timestamp']} | Base Price: €{current_state['live_price_eur']:.2f}")
        
        # Advance 1 hour in the dataset to simulate the passage of time
        current_idx += 1
        
        # Carry over the allocation to enforce realistic ramp rates next tick
        prev_allocation = current_state['allocation']
        
        time.sleep(10)

if __name__ == "__main__":
    main()
