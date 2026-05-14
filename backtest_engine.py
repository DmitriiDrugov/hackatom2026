import pandas as pd
import numpy as np
import xgboost as xgb
import json
import os
from datetime import datetime, timedelta

# Constants
REACTOR_POWER = 2000 # MW
RAMP_RATE_LIMIT = 0.05 * REACTOR_POWER # 100 MW/h
HYDROGEN_PRICE_EQUIV = 55.0 # EUR/MWh (Value of H2 produced)
HEAT_PRICE = 45.0 # EUR/MWh
COOLING_COST_COEFF = 5.0 # Cost per MW when temp is high

def prepare_features(df):
    df = df.copy()
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour'] = df['timestamp'].dt.hour
    df['month'] = df['timestamp'].dt.month
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    
    # Lag features
    for lag in [1, 24, 48, 168]:
        df[f'load_lag_{lag}'] = df['load'].shift(lag)
        df[f'price_lag_{lag}'] = df['price'].shift(lag)
    
    return df.dropna()

def train_models(df):
    train_df = df[df['timestamp'].dt.year <= 2023]
    
    features = ['hour', 'month', 'day_of_week', 'solar_prod', 'danube_temp',
                'load_lag_1', 'load_lag_24', 'load_lag_48', 'load_lag_168',
                'price_lag_1', 'price_lag_24', 'price_lag_48', 'price_lag_168']
    
    X_train = train_df[features]
    y_load = train_df['load']
    y_price = train_df['price']
    
    load_model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=100)
    load_model.fit(X_train, y_load)
    
    price_model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=100)
    price_model.fit(X_train, y_price)
    
    return load_model, price_model, features

def optimize_allocation(predicted_price, danube_temp, prev_allocation, month):
    best_allocation = {'elec': 0, 'h2': 0, 'heat': 0, 'cooling': 0}
    remaining_power = REACTOR_POWER
    
    # 1. Cooling is mandatory
    if danube_temp > 25:
        cooling_needed = (danube_temp - 25) * 40
        best_allocation['cooling'] = min(cooling_needed, REACTOR_POWER)
        remaining_power -= best_allocation['cooling']
    
    # 2. Decide priorities
    heat_viable = month in [11, 12, 1, 2, 3]
    elec_price = predicted_price
    h2_price = HYDROGEN_PRICE_EQUIV
    ht_price = HEAT_PRICE if heat_viable else -999
    
    options = [('elec', elec_price), ('h2', h2_price), ('heat', ht_price)]
    options.sort(key=lambda x: x[1], reverse=True)
    
    target_allocation = best_allocation.copy()
    for opt, price in options:
        if remaining_power <= 0: break
        if price > 0 or opt == 'elec':
            target_allocation[opt] = remaining_power
            remaining_power = 0
            
    # 3. Apply Ramp Rate (100 MW/h max change for ANY channel)
    # This is a simplification but makes the "Explain" output more realistic
    final_allocation = target_allocation.copy()
    for key in ['elec', 'h2', 'heat']:
        diff = target_allocation[key] - prev_allocation[key]
        if abs(diff) > RAMP_RATE_LIMIT:
            final_allocation[key] = prev_allocation[key] + np.sign(diff) * RAMP_RATE_LIMIT
            
    # Normalize final_allocation to ensure sum <= 2000
    total = sum(final_allocation.values())
    if total > REACTOR_POWER:
        # Scale down non-cooling
        scale = (REACTOR_POWER - final_allocation['cooling']) / (total - final_allocation['cooling'])
        for key in ['elec', 'h2', 'heat']:
            final_allocation[key] *= scale
            
    return final_allocation

def run_simulation(df, load_model, price_model, features):
    test_df = df[df['timestamp'].dt.year >= 2024].copy()
    logs = []
    
    prev_allocation = {'elec': 2000, 'h2': 0, 'heat': 0, 'cooling': 0}
    total_baseline_revenue = 0
    total_opt_revenue = 0
    
    for i in range(len(test_df)):
        row = test_df.iloc[i]
        ts = row['timestamp']
        actual_price = row['price']
        danube_temp = row['danube_temp']
        month = ts.month
        
        X_inf = row[features].values.reshape(1, -1)
        pred_price = price_model.predict(X_inf)[0]
        
        allocation = optimize_allocation(pred_price, danube_temp, prev_allocation, month)
        
        baseline_rev = REACTOR_POWER * actual_price
        opt_rev = (allocation['elec'] * actual_price + 
                   allocation['h2'] * HYDROGEN_PRICE_EQUIV +
                   allocation['heat'] * HEAT_PRICE -
                   allocation['cooling'] * COOLING_COST_COEFF)
        
        total_baseline_revenue += baseline_rev
        total_opt_revenue += opt_rev
        
        reason = "Market parity"
        if allocation['h2'] > 0 and pred_price < HYDROGEN_PRICE_EQUIV:
            reason = f"Diverted to Hydrogen. Reason: Predicted price {pred_price:.2f} < H2 value {HYDROGEN_PRICE_EQUIV}"
        elif allocation['heat'] > 0 and pred_price < HEAT_PRICE:
            reason = f"Diverted to Heat. Reason: Predicted price {pred_price:.2f} < Heat price {HEAT_PRICE}"
        elif allocation['cooling'] > 0:
            reason = f"Cooling active ({allocation['cooling']:.1f}MW). Reason: Danube temp {danube_temp:.1f}°C > 25°C"
            
        logs.append({
            "timestamp": str(ts),
            "allocation": allocation,
            "reason": reason,
            "actual_price": float(actual_price),
            "pred_price": float(pred_price)
        })
        
        prev_allocation = allocation
        
    uplift = (total_opt_revenue - total_baseline_revenue) / total_baseline_revenue * 100 if total_baseline_revenue != 0 else 0
    
    return {
        "baseline_revenue": total_baseline_revenue,
        "optimized_revenue": total_opt_revenue,
        "revenue_uplift_percent": uplift,
        "logs": logs[:100]
    }

def main():
    print("Loading data...")
    df = pd.read_csv('backtest_master.csv')
    
    print("Preparing features...")
    df = prepare_features(df)
    
    print("Training models...")
    load_model, price_model, features = train_models(df)
    
    print("Saving models for live mode...")
    load_model.save_model('load_model.json')
    price_model.save_model('price_model.json')
    with open('model_features.json', 'w') as f:
        json.dump(features, f)
    
    print("Running simulation (2024-2025)...")
    results = run_simulation(df, load_model, price_model, features)
    
    print(f"Baseline Revenue: {results['baseline_revenue']:,.2f} EUR")
    print(f"Optimized Revenue: {results['optimized_revenue']:,.2f} EUR")
    print(f"Revenue Uplift: {results['revenue_uplift_percent']:.2f}%")
    
    with open('simulation_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print("Saved simulation_results.json")

if __name__ == "__main__":
    main()
