import time
import json
import random
import requests
import pandas as pd
import numpy as np
import xgboost as xgb
from datetime import datetime
from backtest_engine import optimize_allocation, prepare_features, REACTOR_POWER, HYDROGEN_PRICE_EQUIV, HEAT_PRICE, COOLING_COST_COEFF

def fetch_live_telemetry():
    # 1. Fetch Danube Temp
    try:
        res = requests.get('https://api.open-meteo.com/v1/forecast?latitude=46.57&longitude=18.85&current_weather=true', timeout=5)
        data = res.json()
        danube_temp = data['current_weather']['temperature']
    except Exception as e:
        print(f"Weather API failed: {e}. Using fallback 20.0°C")
        danube_temp = 20.0
        
    # 2. Market Base (Last row of backtest data)
    df = pd.read_csv('backtest_master.csv')
    df = prepare_features(df)
    last_row = df.iloc[-1].copy()
    
    # Base load and price
    base_load = last_row['load']
    base_price = last_row['price']
    
    # 3. Volatility Engine: +/- 1.5% jitter
    load_jitter = random.uniform(-0.015, 0.015)
    price_jitter = random.uniform(-0.015, 0.015)
    
    live_load = base_load * (1 + load_jitter)
    live_price = base_price * (1 + price_jitter)
    
    # Update row with jittered current state (and new Danube temp)
    last_row['load'] = live_load
    last_row['price'] = live_price
    last_row['danube_temp'] = danube_temp
    
    return last_row, live_load, live_price, danube_temp

def explain_decision(allocation, pred_price, danube_temp):
    reasons = []
    if allocation['cooling'] > 0:
        reasons.append(f"Danube temp high ({danube_temp:.1f}°C); diverted {allocation['cooling']:.1f}MW to cooling.")
    
    if allocation['h2'] > 0 and pred_price < HYDROGEN_PRICE_EQUIV:
        reasons.append(f"Price dip predicted (€{pred_price:.2f}/MWh); shifting {allocation['h2']:.1f}MW to Hydrogen.")
    elif allocation['heat'] > 0 and pred_price < HEAT_PRICE:
        reasons.append(f"Heating demand profitable; shifting {allocation['heat']:.1f}MW to Heat.")
    
    if allocation['elec'] > 0:
        if pred_price >= max(HYDROGEN_PRICE_EQUIV, HEAT_PRICE):
            reasons.append(f"Grid price spike predicted (€{pred_price:.2f}/MWh); maximizing Electricity output.")
        else:
            reasons.append(f"Fulfilling remaining capacity with Electricity ({allocation['elec']:.1f}MW).")
            
    return " | ".join(reasons)

def main():
    print("Initializing Live Brain...")
    
    # Load Models
    load_model = xgb.XGBRegressor()
    load_model.load_model('load_model.json')
    
    price_model = xgb.XGBRegressor()
    price_model.load_model('price_model.json')
    
    with open('model_features.json', 'r') as f:
        features = json.load(f)
        
    prev_allocation = {'elec': 2000, 'h2': 0, 'heat': 0, 'cooling': 0}
    print("Models loaded. Entering Live Mode...")
    
    while True:
        timestamp = datetime.now().isoformat()
        
        # Telemetry & Jitter
        live_row, live_load, live_price, danube_temp = fetch_live_telemetry()
        
        # Inference
        X_inf = live_row[features].values.reshape(1, -1)
        # We predict the upcoming price (technically the model predicts the current hour, but in this live context it serves as our forecast proxy)
        pred_price = float(price_model.predict(X_inf)[0])
        pred_load = float(load_model.predict(X_inf)[0])
        
        # Optimize
        month = live_row['month']
        allocation = optimize_allocation(pred_price, danube_temp, prev_allocation, month)
        
        # Financials
        baseline_revenue = REACTOR_POWER * live_price
        opt_revenue = (allocation['elec'] * live_price + 
                       allocation['h2'] * HYDROGEN_PRICE_EQUIV +
                       allocation['heat'] * HEAT_PRICE -
                       allocation['cooling'] * COOLING_COST_COEFF)
        
        revenue_gain = opt_revenue - baseline_revenue
        
        explanation = explain_decision(allocation, pred_price, danube_temp)
        
        status = {
            "timestamp": timestamp,
            "live_metrics": {
                "current_price_eur": round(live_price, 2),
                "current_load_mw": round(live_load, 2),
                "danube_temp_c": round(danube_temp, 2),
                "predicted_next_price_eur": round(pred_price, 2)
            },
            "recommendation": {k: round(v, 2) for k, v in allocation.items()},
            "revenue_gain_eur_per_hour": round(revenue_gain, 2),
            "ai_explanation": explanation
        }
        
        with open('live_status.json', 'w') as f:
            json.dump(status, f, indent=2)
            
        print(f"[{timestamp}] Updated live_status.json | Price: €{live_price:.2f} | Gain: +€{revenue_gain:.2f}")
        
        prev_allocation = allocation
        time.sleep(10)

if __name__ == "__main__":
    main()
