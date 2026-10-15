import pandas as pd
import pathlib
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from joblib import dump

# 1. Cargar dataset de autos
data = pd.read_csv(pathlib.Path('data/cars_dataset.csv'))

# Tomar una muestra si es un dataset muy grande para acelerar el entrenamiento
if len(data) > 10000:
    data = data.sample(n=10000, random_state=0)

# 2. Definir Target
target_col = 'listing_price' if 'listing_price' in data.columns else 'current_market_price'
y = data[target_col]

# 3. Eliminar columnas con fobia/fuga de datos (Data Leakage)
leakage = [
    'vehicle_id', 'listing_id', 'seller_id', 'dealer_id', target_col,
    'original_price', 'msrp', 'purchase_price', 'current_market_price',
    'dealer_price', 'private_seller_price', 'trade_in_value', 'estimated_resale_value'
]

clean_data = data.drop(columns=[c for c in leakage if c in data.columns])
X = clean_data.select_dtypes(include=['int64', 'float64'])

# 4. Dividir y entrenar XGBoost Regressor
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)

print("Entrenando modelo XGBoost para precios de autos...")
model = XGBRegressor(n_estimators=500, learning_rate=0.05, random_state=0, n_jobs=-1)
model.fit(X_train, y_train)

# 5. Guardar modelo y las columnas seleccionadas
dump(model, pathlib.Path('model/car-price-v1.joblib'))
dump(list(X.columns), pathlib.Path('model/features.joblib'))
print("¡Modelo guardado exitosamente en model/car-price-v1.joblib!")