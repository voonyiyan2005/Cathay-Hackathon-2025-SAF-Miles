# Cell 1: Imports
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
from sklearn.metrics import accuracy_score, classification_report
import matplotlib.pyplot as plt
import joblib

# Cell 2: Formulas (Fixed Logic, Not ML)
def calculate_saf_miles(premium, saf_blend, distance_km, k=100, w1=0.5, w2=0.3):
    return int((k * premium) * (1 + w1 * saf_blend + w2 * (distance_km / 10000)))

def calculate_co2_reduction(fuel_burn, saf_blend):
    v_saf = fuel_burn * saf_blend
    return v_saf * 2.66

def calculate_net_price(premium, saf_miles, v=0.005):
    return premium - v * saf_miles

def calculate_demand(q0, p_net, p0=20, eta=0.5):
    if p_net <= 0:
        return q0 * 1.5
    return q0 * (p_net / p0) ** (-eta)

def check_equilibrium(premium, saf_miles, c_m=0.004, v=0.05):
    cathay_ok = premium > c_m * saf_miles
    customer_ok = premium < v * saf_miles
    return cathay_ok, customer_ok

# Cell 3: Generate Data
np.random.seed(42)
n_samples = 1000
data = {
    'user_id': range(1, n_samples + 1),
    'tier': np.random.choice(['Gold', 'Silver', 'None'], n_samples, p=[0.3, 0.4, 0.3]),
    'cabin': np.random.choice(['Business', 'Economy'], n_samples, p=[0.6, 0.4]),
    'route': np.random.choice(['HKG-LHR', 'HKG-SIN', 'HKG-JFK', 'HKG-SYD', 'HKG-BKK'], n_samples),
    'distance_km': np.random.choice([9600, 2560, 12970, 7390, 1690], n_samples),
    'premium': np.random.choice([15, 20, 25, 30, 35], n_samples),
    'saf_blend': np.random.uniform(0.1, 0.3, n_samples).round(2),
    'fuel_burn': np.random.uniform(5000, 50000, n_samples).round(0)
}
df = pd.DataFrame(data)
df['saf_miles'] = df.apply(lambda row: calculate_saf_miles(row['premium'], row['saf_blend'], row['distance_km']), axis=1)
df['co2_reduction'] = df.apply(lambda row: calculate_co2_reduction(row['fuel_burn'], row['saf_blend']), axis=1)
df['net_price'] = df.apply(lambda row: calculate_net_price(row['premium'], row['saf_miles']), axis=1)
df['demand'] = df.apply(lambda row: calculate_demand(100, row['net_price']), axis=1)
df['chose_saf'] = ((df['premium'] <= 25) | ((df['tier'] == 'Gold') & (df['saf_miles'] >= 3000))).astype(int)
df.to_csv('saf_demo_data.csv', index=False)
print("Dataset Generated: saf_demo_data.csv")
print(df.head())

# Cell 4: Prepare Data for ML
le_tier = LabelEncoder()
le_cabin = LabelEncoder()
le_route = LabelEncoder()
df['tier_encoded'] = le_tier.fit_transform(df['tier'])
df['cabin_encoded'] = le_cabin.fit_transform(df['cabin'])
df['route_encoded'] = le_route.fit_transform(df['route'])
features = ['tier_encoded', 'cabin_encoded', 'route_encoded', 'distance_km', 'premium', 'saf_blend', 'saf_miles']
X = df[features]
y = df['chose_saf']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Cell 5: Train ML Model
xgb_model = xgb.XGBClassifier(random_state=42, n_estimators=100, learning_rate=0.1)
xgb_model.fit(X_train, y_train)
y_pred = xgb_model.predict(X_test)
initial_accuracy = accuracy_score(y_test, y_pred)
print("\nInitial Accuracy:", initial_accuracy)
print(classification_report(y_test, y_pred))
joblib.dump(xgb_model, 'saf_model.pkl')
print("Model Saved: saf_model.pkl")

# Cell 6: Simulate Retraining
accuracies = [initial_accuracy]
for i in range(1, 4):
    new_data = df.sample(200, random_state=42+i)
    X_new = new_data[features]
    y_new = new_data['chose_saf']
    xgb_model.fit(X_new, y_new)
    y_pred_new = xgb_model.predict(X_test)
    new_accuracy = accuracy_score(y_test, y_pred_new)
    accuracies.append(new_accuracy)
    print(f"Iteration {i} Accuracy: {new_accuracy:.4f}")
plt.figure(figsize=(6, 4))
plt.plot(range(4), accuracies, marker='o')
plt.xlabel('Iteration')
plt.ylabel('Accuracy')
plt.title('Accuracy Improvement')
plt.savefig('xgboost_accuracy.png')
print("Plot Saved: xgboost_accuracy.png")

# Cell 7: Optimize Parameters
def calculate_profit(row, k, w1=0.5, w2=0.3, c_m=0.004):
    saf_miles = calculate_saf_miles(row['premium'], row['saf_blend'], row['distance_km'], k, w1, w2)
    profit = row['premium'] - c_m * saf_miles
    return profit if row['chose_saf'] == 1 else 0
k_values = [80, 100, 120]
profits = []
for k in k_values:
    df['profit'] = df.apply(lambda row: calculate_profit(row, k), axis=1)
    total_profit = df['profit'].sum()
    profits.append(total_profit)
    print(f"k={k}: Total Profit=${total_profit:.2f}")
plt.figure(figsize=(6, 4))
plt.plot(k_values, profits, marker='o')
plt.xlabel('k Value')
plt.ylabel('Total Profit')
plt.title('Profit Optimization')
plt.savefig('profit_optimization.png')
print("Plot Saved: profit_optimization.png")