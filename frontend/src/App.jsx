import { useState } from 'react';
import axios from 'axios';

function App() {
  const GITHUB_USER = "xochitlsalgado";
  const GITHUB_REPO = "heart-model-salgado";

  // URLs de los 3 datasets alojados en tu GitHub Release
  const DATASETS = {
    "100%": "https://github.com/xochitlsalgado/heart-model-salgado/releases/download/v1.0.0/cars_dataset_100.csv",
    "50%": "https://github.com/xochitlsalgado/heart-model-salgado/releases/download/v1.0.0/cars_dataset_50.csv",
    "25%": "https://github.com/xochitlsalgado/heart-model-salgado/releases/download/v1.0.0/cars_dataset_25.csv"
  };

  // Mapeo opcional de URLs si despliegas cada modelo por separado o consultas el activo
  const API_ENDPOINTS = {
    "100%": "https://fastapi-ml-xochitl.onrender.com/score",
    "50%": "https://fastapi-ml-xochitl.onrender.com/score",
    "25%": "https://fastapi-ml-xochitl.onrender.com/score"
  };

  // Estados principales
  const [selectedVersion, setSelectedVersion] = useState("100%");
  const [githubToken, setGithubToken] = useState("");
  const [customSha, setCustomSha] = useState("sha-cars-100");
  
  const [formData, setFormData] = useState({
    year: 2021,
    odometer: 45000,
    horsepower: 180,
    engine_size: 2.0,
    doors: 4,
    cylinders: 4
  });

  const [predictedPrice, setPredictedPrice] = useState(null);
  const [trainStatus, setTrainStatus] = useState(null);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [loadingTrain, setLoadingTrain] = useState(false);

  // Manejador de cambios en los inputs numéricos
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value) || 0
    });
  };

  // 1. Acción de Predicción
  const handlePredict = async (e) => {
    e.preventDefault();
    setLoadingPredict(true);
    setPredictedPrice(null);

    const targetUrl = API_ENDPOINTS[selectedVersion];

    try {
      const response = await axios.post(targetUrl, formData);
      // Extrae la respuesta de tu modelo CarOutputData
      const price = response.data.predicted_price || response.data.price || response.data;
      setPredictedPrice(price);
    } catch (err) {
      console.error(err);
      alert("Error al calcular la predicción. Verifica que la API en Render esté activa.");
    } finally {
      setLoadingPredict(false);
    }
  };

  // 2. Acción de Re-entrenamiento (Botón solicitado por el profesor)
  const handleTriggerWorkflow = async () => {
    if (!githubToken) {
      alert("Por favor ingresa tu GitHub Personal Access Token para autenticar la acción.");
      return;
    }

    setLoadingTrain(true);
    setTrainStatus(null);

    const dispatchUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/dispatches`;
    const payload = {
      event_type: "ml_ci_cd",
      client_payload: {
        dataseturl: DATASETS[selectedVersion],
        sha: customSha || `sha-cars-${selectedVersion.replace('%', '')}`
      }
    };

    try {
      await axios.post(dispatchUrl, payload, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      });
      setTrainStatus({
        type: 'success',
        message: `¡Workflow activado! Re-entrenando modelo con el ${selectedVersion} del dataset y SHA: ${payload.client_payload.sha}.`
      });
    } catch (err) {
      console.error(err);
      setTrainStatus({
        type: 'error',
        message: 'Error al solicitar el re-entrenamiento. Verifica tu GitHub Token.'
      });
    } finally {
      setLoadingTrain(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ width: '100%', maxWidth: '600px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '30px', boxSizing: 'border-box' }}>
        
        {/* ENCABEZADO */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1e293b' }}>
            🚗 Predicción de Precios de Vehículos
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Selecciona el modelo entrenado y calcula el precio estimado.
          </p>
        </div>

        <form onSubmit={handlePredict}>
          
          {/* DESPLEGABLE DE DATASETS / MODELOS */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
              Dataset / Modelo a consultar:
            </label>
            <select 
              value={selectedVersion} 
              onChange={(e) => {
                setSelectedVersion(e.target.value);
                setCustomSha(`sha-cars-${e.target.value.replace('%', '')}`);
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#f8fafc', color: '#1e293b' }}
            >
              <option value="100%">Modelo Entrenado al 100% Dataset</option>
              <option value="50%">Modelo Entrenado al 50% Dataset</option>
              <option value="25%">Modelo Entrenado al 25% Dataset</option>
            </select>
          </div>

          {/* GRID DE ATRIBUTOS DEL AUTO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>AÑO (YEAR):</label>
              <input type="number" name="year" value={formData.year} onChange={handleInputChange} style={inputStyle} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>ODÓMETRO (KM):</label>
              <input type="number" name="odometer" value={formData.odometer} onChange={handleInputChange} style={inputStyle} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>POTENCIA (HP):</label>
              <input type="number" name="horsepower" value={formData.horsepower} onChange={handleInputChange} style={inputStyle} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>TAMAÑO MOTOR (L):</label>
              <input type="number" step="0.1" name="engine_size" value={formData.engine_size} onChange={handleInputChange} style={inputStyle} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>PUERTAS (DOORS):</label>
              <input type="number" name="doors" value={formData.doors} onChange={handleInputChange} style={inputStyle} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>CILINDROS:</label>
              <input type="number" name="cylinders" value={formData.cylinders} onChange={handleInputChange} style={inputStyle} required />
            </div>
          </div>

          {/* BOTÓN PRINCIPAL DE PREDICCIÓN */}
          <button 
            type="submit" 
            disabled={loadingPredict}
            style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '15px' }}
          >
            {loadingPredict ? 'Calculando...' : 'Calcular Predicción'}
          </button>
        </form>

        {/* CAJA DE RESULTADO DE PRECIO ESTIMADO */}
        {predictedPrice !== null && (
          <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '15px', textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ display: 'block', fontSize: '13px', color: '#166534', fontWeight: '600', marginBottom: '4px' }}>
              Precio Estimado (Modelo {selectedVersion}):
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#15803d' }}>
              ${typeof predictedPrice === 'number' ? predictedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : predictedPrice}
            </span>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

        {/* SECCIÓN Y BOTÓN DE RE-ENTRENAMIENTO (SOLICITADO POR EL PROFESOR) */}
        <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
            ⚙️ MLOps - Acciones de Re-entrenamiento
          </span>
          
          <input 
            type="password" 
            value={githubToken} 
            onChange={(e) => setGithubToken(e.target.value)} 
            placeholder="Ingresa tu GitHub Personal Access Token (PAT)"
            style={{ ...inputStyle, marginBottom: '10px' }}
          />

          <button 
            type="button" 
            onClick={handleTriggerWorkflow}
            disabled={loadingTrain}
            style={{ width: '100%', padding: '10px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            {loadingTrain ? 'Enviando Re-entrenamiento...' : `Re-entrenar Modelo (${selectedVersion}) en GitHub`}
          </button>

          {trainStatus && (
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', backgroundColor: trainStatus.type === 'success' ? '#d1fae5' : '#fee2e2', color: trainStatus.type === 'success' ? '#065f46' : '#991b1b' }}>
              {trainStatus.message}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '13px',
  boxSizing: 'border-box'
};

export default App;