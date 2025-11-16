import React, { useState, useEffect } from 'react';
import './App.css';
import { FaLock } from 'react-icons/fa';

function App() {
  const [formData, setFormData] = useState({
    tier: 'Gold',
    cabin: 'Business',
    route: 'HKG-JFK',
    distance_km: 12970.0,
    premium: 25.0,
    saf_blend: 0.24,
    current_saf_miles: '',
    saf_flights_taken: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCoinDrop, setShowCoinDrop] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [currentMiles, setCurrentMiles] = useState(0);

  useEffect(() => {
    if (!result) {
      setCurrentMiles(0);
      return;
    }
    const newCurrentMiles = (Number(formData.current_saf_miles) || 0) + (result.saf_miles || 0);
    setCurrentMiles(newCurrentMiles);
    const flightsTaken = Number(formData.saf_flights_taken) || 0;
    const isElite = flightsTaken >= 10;
    const hasReachedGoal = newCurrentMiles >= 20000;
    if (hasReachedGoal && isElite && !claimed) {
      setShowCoinDrop(true);
    } else {
      setShowCoinDrop(false);
    }
  }, [result, claimed, formData.current_saf_miles, formData.saf_flights_taken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['distance_km', 'premium', 'saf_blend'].includes(name)
        ? parseFloat(value) || ''
        : ['current_saf_miles', 'saf_flights_taken'].includes(name)
        ? value
        : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const requestBody = {
      tier: formData.tier,
      cabin: formData.cabin,
      route: formData.route,
      distance_km: parseFloat(formData.distance_km) || 0,
      premium: parseFloat(formData.premium) || 0,
      saf_blend: parseFloat(formData.saf_blend) || 0,
    };
    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      setResult({
        ...data,
        current_saf_miles: formData.current_saf_miles,
        saf_flights_taken: formData.saf_flights_taken,
      });
    } catch (err) {
      setError('Failed to fetch prediction: ' + err.message);
    }
    setLoading(false);
  };

  const handleClaim = () => {
    setClaimed(true);
    setShowCoinDrop(false);
    alert('SAF Coin claimed! Ready for next milestone.');
  };

  return (
    <div className="App">
      <div className="logo-container">
        <img
          src="Cathay-Pacific-Logo-2014.png"
          alt="Cathay Pacific Logo"
          className="cathay-logo"
          width="700"
          height="395"
        />
        <hr className="logo-divider" />
      </div>
      <h1>SAF Miles Predictor</h1>
      <form onSubmit={handleSubmit} className="predictor-form">
        <div className="dob-group">
          <label>Tier:</label>
          <select name="tier" value={formData.tier} onChange={handleChange} className="dob-select">
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="None">None</option>
          </select>
        </div>
        <div className="dob-group">
          <label>Cabin:</label>
          <select name="cabin" value={formData.cabin} onChange={handleChange} className="dob-select">
            <option value="Business">Business</option>
            <option value="Economy">Economy</option>
          </select>
        </div>
        <div className="dob-group">
          <label>Route:</label>
          <select name="route" value={formData.route} onChange={handleChange} className="dob-select">
            <option value="HKG-LHR">HKG-LHR</option>
            <option value="HKG-SIN">HKG-SIN</option>
            <option value="HKG-JFK">HKG-JFK</option>
            <option value="HKG-SYD">HKG-SYD</option>
            <option value="HKG-BKK">HKG-BKK</option>
          </select>
        </div>
        <div className="dob-group">
          <label>Distance (km):</label>
          <input
            type="number"
            name="distance_km"
            value={formData.distance_km}
            onChange={handleChange}
            step="0.1"
            min="1000"
            max="15000"
            required
            className="dob-input"
          />
        </div>
        <div className="dob-group">
          <label>Premium ($):</label>
          <input
            type="number"
            name="premium"
            value={formData.premium}
            onChange={handleChange}
            step="0.1"
            min="0"
            required
            className="dob-input"
          />
        </div>
        <div className="dob-group">
          <label>SAF Blend (0.1–0.3):</label>
          <input
            type="number"
            name="saf_blend"
            value={formData.saf_blend}
            onChange={handleChange}
            step="0.01"
            min="0.1"
            max="0.3"
            required
            className="dob-input"
          />
        </div>
        <div className="dob-group">
          <label>Current SAF Miles:</label>
          <input
            type="number"
            name="current_saf_miles"
            value={formData.current_saf_miles}
            onChange={handleChange}
            min="0"
            step="1"
            placeholder="Enter miles"
            className="dob-input"
          />
        </div>
        <div className="dob-group">
          <label>SAF Flights Taken:</label>
          <input
            type="number"
            name="saf_flights_taken"
            value={formData.saf_flights_taken}
            onChange={handleChange}
            min="0"
            placeholder="Enter flights"
            className="dob-input"
          />
          <small style={{ color: '#0c8989', marginTop: '6px', fontWeight: '600' }}>
            10+ SAF flights unlock the Coin
          </small>
        </div>
        <button type="submit">Get Prediction</button>
      </form>
      {loading && <FaLock className="spin" />}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <div className="result">
          <h2>Prediction Results</h2>
          <h3>Flight Details</h3>
          <p><strong>Tier:</strong> {formData.tier}</p>
          <p><strong>Cabin:</strong> {formData.cabin}</p>
          <p><strong>Route:</strong> {formData.route}</p>
          <p><strong>Distance:</strong> {formData.distance_km} km</p>
          <p><strong>Premium:</strong> ${formData.premium}</p>
          <p><strong>SAF Blend:</strong> {formData.saf_blend}</p>
          <h3>Prediction</h3>
          <p><strong className="highlight">Probability of SAF Uptake:</strong> {(result.probability * 100).toFixed(1)}%</p>
          <p><strong>SAF Miles Earned:</strong> <span className="highlight">{result.saf_miles?.toLocaleString()}</span></p>
          <p><strong className="highlight">CO₂ Reduction:</strong> {result.co2_reduction?.toLocaleString()} kg</p>
          <p><strong className="highlight">Net Price:</strong> ${result.net_price}</p>
          <p><strong className="highlight">Profit:</strong> ${result.profit}</p>
          <div className="miles-summary">
            <h3>SAF Miles Summary</h3>
            <div className="miles-row">
              <span><strong>Current SAF Miles</strong></span>
              <span>{(Number(formData.current_saf_miles) || 0).toLocaleString()}</span>
            </div>
            <div className="miles-row">
              <span><strong>+ Earned this flight</strong></span>
              <span>{result.saf_miles?.toLocaleString()}</span>
            </div>
            <div className="miles-row">
              <span><strong>SAF Miles After This Flight</strong></span>
              <span>{currentMiles.toLocaleString()}</span>
            </div>
            <div className="miles-row">
              <span><strong>SAF Flights Taken</strong></span>
              <span>{formData.saf_flights_taken || 0} flight{(formData.saf_flights_taken || 0) !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h4>SAF Coins Progress</h4>
              {(() => {
                const flightsTaken = Number(formData.saf_flights_taken) || 0;
                const goalMiles = 50000;
                const percentage = ((currentMiles / goalMiles) * 100).toFixed(1);
                const cappedPercentage = Math.min(100, parseFloat(percentage));
                const isElite = flightsTaken >= 10;
                const hasReachedGoal = currentMiles >= goalMiles;
                const canEarnCoin = hasReachedGoal && isElite;
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                      <span>Next SAF Coin</span>
                      <span style={{ color: cappedPercentage >= 100 ? '#0c8989' : '#333' }}>
                        {currentMiles.toLocaleString()} / 50,000 miles
                      </span>
                    </div>
                    <div className="progress-container" style={{ height: 36, margin: '16px 0', position: 'relative' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${cappedPercentage}%`,
                          background: canEarnCoin
                            ? 'linear-gradient(90deg, #00ff9d, #00d4ff, #ff00ff)'
                            : 'linear-gradient(90deg, #0c8989, #36696d)',
                          boxShadow: canEarnCoin ? '0 0 40px rgba(0,255,200,1)' : 'none',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: 'white',
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                            letterSpacing: '1px',
                          }}
                        >
                          {canEarnCoin ? 'MAX' : `${percentage}%`}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: 'center',
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        marginTop: '12px',
                        background: isElite ? 'linear-gradient(90deg, #0c8989, #00d4aa)' : 'transparent',
                        WebkitBackgroundClip: isElite ? 'text' : 'initial',
                        WebkitTextFillColor: isElite ? 'transparent' : '#e74c3c',
                        padding: isElite ? '8px 0' : '0',
                        borderRadius: '8px',
                        textShadow: isElite ? '0 0 20px rgba(0,212,170,0.4)' : 'none',
                      }}
                    >
                      {isElite ? (
                        <>
                          +{result.saf_miles?.toLocaleString()} miles from this flight<br />
                          <span style={{ fontSize: '1.4rem', color: '#00ff9d' }}>
                            ELITE USER – SAF COIN UNLOCKED!
                          </span>
                        </>
                      ) : (
                        `Need ${10 - flightsTaken} more SAF flight${10 - flightsTaken !== 1 ? 's' : ''} to earn your SAF Coin`
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          {currentMiles >= 2000 && (
            <div className="benefits-grid">
              <div className="benefit-card" style={{ background: 'linear-gradient(135deg, #f0fffa 0%, #e8fff8 100%)', border: '2px solid #00d4aa', boxShadow: '0 8px 32px rgba(0, 212, 170, 0.15)' }}>
                <h4 style={{ color: '#00684a', fontSize: '1.35rem', marginBottom: '16px' }}>
                  Hong Kong Green Perks Unlocked
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '1.05rem' }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,212,170,0.08)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '2rem' }}>Hotel</span>
                    <br />
                    <strong>Green Hotels & Resorts</strong>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,212,170,0.08)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '2rem' }}>Car</span>
                    <br />
                    <strong>Tesla / BYD Airport Transfer</strong>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,212,170,0.08)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '2rem' }}>Tours</span>
                    <br />
                    <strong>Eco-Tour Operators</strong>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,212,170,0.08)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '2rem' }}>Food</span>
                    <br />
                    <strong>Green Culinary Experiences</strong>
                  </div>
                </div>
                {/* Hide earned miles text once SAF Coin is unlocked */}
                {!(() => {
                  const flightsTaken = Number(formData.saf_flights_taken) || 0;
                  const isElite = flightsTaken >= 10;
                  const hasReachedGoal = currentMiles >= 20000;
                  return hasReachedGoal && isElite;
                })() && (
                  <div style={{
                    textAlign: 'center',
                    marginTop: '20px',
                    fontWeight: 'bold',
                    color: '#00684a',
                    fontSize: '1.1rem'
                  }}>
                    You’ve earned {currentMiles.toLocaleString()} SAF MILES
                  </div>
                )}
              </div>
            </div>
          )}
          {showCoinDrop && !claimed && (
            <div className="epic-coin-overlay">
              <div className="epic-coin-container">
                <img src="SAF Coin.jpg" alt="SAF Coin" className="epic-dropping-coin" />
                <h1 className="epic-title">SAF COIN!</h1>
                <p className="epic-subtitle">
                  Congratulations!
                  <br />
                  You can pay to claim your <span style={{ color: '#00ff9d' }}>SAF Coin!</span>
                </p>
                <button onClick={handleClaim} className="epic-claim-button">
                  CLAIM MY SAF COIN
                </button>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="particle" style={{ '--i': i }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
