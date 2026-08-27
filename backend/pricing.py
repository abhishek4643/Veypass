import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib
import os
import random
from sqlalchemy.orm import Session
import models
from datetime import datetime

MODEL_PATH = "pricing_model.joblib"

def train_model():
    """Generate synthetic data and train the pricing model."""
    data = []
    # Generate 200 rows of synthetic data
    for _ in range(200):
        hour = random.randint(0, 23)
        weekday = random.randint(0, 6)
        occupancy = random.uniform(0, 1) # 0 to 100%
        popularity = random.uniform(0.5, 2.0)
        
        # Base demand multiplier
        demand = 1.0
        
        # Peak hours (8-10 AM, 5-8 PM)
        if 8 <= hour <= 10 or 17 <= hour <= 20:
            demand += 0.3
            
        # Weekends
        if weekday >= 5:
            demand += 0.2
            
        # High occupancy
        if occupancy > 0.8:
            demand += 0.4
        elif occupancy > 0.5:
            demand += 0.1
            
        # Popularity
        demand *= popularity
        
        # Add some noise
        demand += random.uniform(-0.1, 0.1)
        
        # Min demand is 0.8, Max is 3.0
        demand = max(0.8, min(demand, 3.0))
        
        data.append([hour, weekday, occupancy, popularity, demand])
        
    df = pd.DataFrame(data, columns=['hour', 'weekday', 'occupancy', 'popularity', 'demand'])
    
    X = df[['hour', 'weekday', 'occupancy', 'popularity']]
    y = df['demand']
    
    model = LinearRegression()
    model.fit(X, y)
    
    joblib.dump(model, MODEL_PATH)
    print("AI Pricing Model trained and saved.")

_model = None

def get_demand_multiplier(hour: int, weekday: int, occupancy: float, popularity: float) -> float:
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            train_model()
        _model = joblib.load(MODEL_PATH)
    
    X_new = pd.DataFrame([[hour, weekday, occupancy, popularity]], columns=['hour', 'weekday', 'occupancy', 'popularity'])
    prediction = _model.predict(X_new)[0]
    
    # Bound the multiplier
    return max(0.8, min(prediction, 3.0))

def compute_dynamic_price(base_fare: float, popularity: float, occupancy: float) -> float:
    now = datetime.utcnow()
    hour = now.hour
    weekday = now.weekday()
    
    multiplier = get_demand_multiplier(hour, weekday, occupancy, popularity)
    final_price = base_fare * multiplier
    return float(round(final_price, 2))
