from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
from joblib import load
import pathlib
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title='Car Price Prediction API (XGBoost)')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar el modelo y las características esperadas
model = load(pathlib.Path('model/car-price-v1.joblib'))
feature_names = load(pathlib.Path('model/features.joblib'))

# Mapeo flexible de entradas comunes a las columnas exactas del dataset
class CarInputData(BaseModel):
    year: int = 2018
    odometer: float = 45000.0
    horsepower: float = 180.0
    engine_size: float = 2.0
    doors: int = 4
    cylinders: int = 4

class CarOutputData(BaseModel):
    predicted_price: float

@app.post('/score', response_model=CarOutputData)
def score(data: CarInputData):
    # Mapear los valores ingresados a las claves del dataset mas probables
    input_dict = {
        'model_year': data.year,
        'vehicle_year': data.year,
        'registration_year': data.year,
        'vehicle_age': max(0, 2026 - data.year),
        'registration_age_years': max(0, 2026 - data.year),
        'odometer_km': data.odometer,
        'annual_mileage_km': data.odometer / max(1, (2026 - data.year)),
        'engine_power_hp': data.horsepower,
        'combined_system_power_hp': data.horsepower,
        'engine_displacement_cc': data.engine_size * 1000.0,
        'engine_cylinders': data.cylinders,
        'door_count': data.doors
    }

    # Construir el vector de 200+ caracteristicas
    input_vector = []
    for col in feature_names:
        val = input_dict.get(col, 0.0)
        input_vector.append(val)

    model_input = np.array(input_vector).reshape(1, -1)
    prediction = model.predict(model_input)

    return {'predicted_price': float(prediction[0])}