import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, LogOut, Plus, Sprout, Trash2 } from "lucide-react";
import api, { clearToken } from "../services/api";

function Home() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlants() {
      try {
        const response = await api.get("/plants");
        setPlants(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.detail || "Unable to load plants.");
      } finally {
        setLoading(false);
      }
    }

    loadPlants();
  }, []);

  const summary = useMemo(() => {
    const species = new Set(plants.map((plant) => plant.species).filter(Boolean));
    return {
      totalPlants: plants.length,
      totalSpecies: species.size,
    };
  }, [plants]);

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  const handleDeletePlant = async (plant) => {
    const confirmed = window.confirm(`Delete ${plant.name}? This will also remove its logs.`);

    if (!confirmed) return;

    setError("");

    try {
      await api.delete(`/plants/${plant.id}`);
      setPlants((currentPlants) => currentPlants.filter((item) => item.id !== plant.id));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to delete plant.");
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">LeafLogic</p>
          <h1>Plant dashboard</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" type="button" onClick={handleLogout} title="Log out">
            <LogOut size={18} />
            <span>Log out</span>
          </button>
          <Link className="primary-button link-button" to="/add-plant">
            <Plus size={18} />
            <span>Add plant</span>
          </Link>
        </div>
      </header>

      <section className="summary-grid">
        <article className="metric-card">
          <Sprout size={22} />
          <div>
            <p>Total plants</p>
            <strong>{summary.totalPlants}</strong>
          </div>
        </article>
        <article className="metric-card">
          <LineChart size={22} />
          <div>
            <p>Species tracked</p>
            <strong>{summary.totalSpecies}</strong>
          </div>
        </article>
      </section>

      {loading && <p className="muted">Loading your plants...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && plants.length === 0 && (
        <section className="empty-state">
          <h2>No plants yet</h2>
          <p className="muted">Add your first plant, then log growth and care data over time.</p>
          <Link className="primary-button link-button" to="/add-plant">Add plant</Link>
        </section>
      )}

      <section className="plant-grid">
        {plants.map((plant) => (
          <article className="plant-card" key={plant.id}>
            <div>
              <h2>{plant.name}</h2>
              <p>{plant.species}</p>
            </div>
            <dl>
              <div>
                <dt>Location</dt>
                <dd>{plant.location || "Not set"}</dd>
              </div>
              <div>
                <dt>Planted</dt>
                <dd>{plant.planted_date || "Not set"}</dd>
              </div>
            </dl>
            <div className="card-actions">
              <Link className="ghost-button link-button" to={`/plants/${plant.id}`}>Open</Link>
              <button className="danger-button" type="button" onClick={() => handleDeletePlant(plant)}>
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Home;
