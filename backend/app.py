from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
from sklearn.preprocessing import LabelEncoder
import numpy as np

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],  # Allow frontend and wildcard for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Prediction Input Model
class PassengerInput(BaseModel):
    tier: str
    cabin: str
    route: str
    distance_km: float
    premium: float
    saf_blend: float
    current_saf_miles: float = 0.0  # Add default for frontend compatibility
    saf_flights_taken: float = 0.0  # Add default for frontend compatibility

# Utility Functions
def calculate_saf_miles(premium, saf_blend, distance_km, k=100, w1=0.5, w2=0.3, scarcity_rate=0.002):
    return int((k * premium) * (1 + w1 * saf_blend + w2 * (distance_km / 10000))*scarcity_rate)

def calculate_co2_reduction(fuel_burn, saf_blend):
    return (fuel_burn * saf_blend) * 2.66

def calculate_net_price(premium, saf_miles, v=0.005):
    return premium - v * saf_miles

# Load Model and Encoders
model = joblib.load('saf_model.pkl')
le_tier = LabelEncoder().fit(['Gold', 'Silver', 'None'])
le_cabin = LabelEncoder().fit(['Business', 'Economy'])
le_route = LabelEncoder().fit(['HKG-LHR', 'HKG-SIN', 'HKG-JFK', 'HKG-SYD', 'HKG-BKK'])

# Prediction Endpoint
@app.post("/predict")
async def predict(input: PassengerInput):
    try:
        saf_miles = calculate_saf_miles(input.premium, input.saf_blend, input.distance_km)
        data = pd.DataFrame([{
            'tier_encoded': le_tier.transform([input.tier])[0],
            'cabin_encoded': le_cabin.transform([input.cabin])[0],
            'route_encoded': le_route.transform([input.route])[0],
            'distance_km': input.distance_km,
            'premium': input.premium,
            'saf_blend': input.saf_blend,
            'saf_miles': saf_miles
        }])
        prob = float(model.predict_proba(data)[0][1])
        co2 = float(calculate_co2_reduction(36056, input.saf_blend))  # Fixed fuel_burn value
        net_price = float(calculate_net_price(input.premium, saf_miles))
        profit = round(input.premium - 0.004 * saf_miles, 2)  # Match frontend expectation

        # Log data (optional, adjust path if needed)
        log_data = pd.DataFrame([{
            'tier': input.tier,
            'premium': input.premium,
            'saf_miles': saf_miles,
            'chose_saf': 1 if prob > 0.5 else 0
        }])
        log_data.to_csv('C:/Users/user/OneDrive/Desktop/cathay/backend/logs.csv', mode='a', header=not pd.io.common.file_exists('C:/Users/user/OneDrive/Desktop/cathay/backend/logs.csv'), index=False)

        # Prepare response with selectedInputs
        selected_inputs = {
            "tier": input.tier,
            "cabin": input.cabin,
            "route": input.route,
            "distance_km": input.distance_km,
            "premium": input.premium,
            "saf_blend": input.saf_blend,
            "current_saf_miles": input.current_saf_miles,
            "saf_flights_taken": input.saf_flights_taken
        }
        response = {
            "probability": round(prob, 3),
            "saf_miles": saf_miles,
            "co2_reduction": round(co2, 0),
            "net_price": round(net_price, 2),
            "profit": profit,
            "current_saf_miles": input.current_saf_miles + saf_miles,  # Update for frontend
            "selectedInputs": selected_inputs
        }

        return response

    except Exception as e:
        selected_inputs = {
            "tier": input.tier,
            "cabin": input.cabin,
            "route": input.route,
            "distance_km": input.distance_km,
            "premium": input.premium,
            "saf_blend": input.saf_blend,
            "current_saf_miles": input.current_saf_miles,
            "saf_flights_taken": input.saf_flights_taken
        }
        return {"error": f"Internal Error: {str(e)}", "selectedInputs": selected_inputs}

# Optional Root Route (for testing)
@app.get("/")
async def read_root():
    return {"message": "Welcome to SAF Miles Predictor"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)