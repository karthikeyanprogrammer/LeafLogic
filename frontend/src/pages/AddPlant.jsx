import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const plantTypes = ["Vegetable", "Fruit", "Flower", "Herb", "Succulent", "Indoor Plant", "Tree", "Shrub", "Other"];
const locations = ["Indoor", "Balcony", "Outdoor", "Greenhouse", "Terrace"];
const soilTypes = ["Garden Soil", "Potting Mix", "Sandy Soil", "Clay Soil", "Coco Peat", "Compost Rich", "Mixed Soil"];

function AddPlant() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    pot_size_cm: "",
    plant_type: "",
    location: "",
    soil_type: "",
    planted_date: "",
    notes: "",
  });
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSpeciesOptions() {
      try {
        const response = await api.get("/species");
        setSpeciesOptions(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.detail || "Unable to load species options.");
      }
    }

    loadSpeciesOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "species") {
      const selectedSpecies = speciesOptions.find((species) => species.key === value);

      setFormData({
        ...formData,
        species: value,
        plant_type: selectedSpecies?.category || formData.plant_type,
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        ...formData,
        pot_size_cm: formData.pot_size_cm === "" ? null : Number(formData.pot_size_cm),
        planted_date: formData.planted_date || null,
      };

      const response = await api.post("/plants", payload);
      navigate(`/plants/${response.data.id}`);
    } catch (error) {
      setError(error.response?.data?.detail || "Error adding plant.");
    }
  };

  return (
    <main className="app-shell narrow-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">New plant</p>
          <h1>Add plant</h1>
        </div>
        <Link className="ghost-button link-button" to="/">
          <ArrowLeft size={18} />
          <span>Dashboard</span>
        </Link>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Plant name
          <input
            type="text"
            name="name"
            placeholder="Monstera by the window"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Species
          <select
            name="species"
            value={formData.species}
            onChange={handleChange}
            required
          >
            <option value="">Select species</option>
            {speciesOptions.map((species) => (
              <option key={species.key} value={species.key}>{species.common_name}</option>
            ))}
          </select>
        </label>

        <div className="field-grid">
          <label>
            Pot size cm
            <input
              type="number"
              step="0.1"
              name="pot_size_cm"
              value={formData.pot_size_cm}
              onChange={handleChange}
            />
          </label>

          <label>
            Plant type
            <select name="plant_type" value={formData.plant_type} onChange={handleChange}>
              <option value="">Select type</option>
              {plantTypes.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label>
            Location
            <select name="location" value={formData.location} onChange={handleChange}>
              <option value="">Select location</option>
              {locations.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label>
            Soil type
            <select name="soil_type" value={formData.soil_type} onChange={handleChange}>
              <option value="">Select soil</option>
              {soilTypes.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <label>
          Planted date
          <input
            type="date"
            name="planted_date"
            value={formData.planted_date}
            onChange={handleChange}
          />
        </label>

        <label>
          General plant notes
          <textarea
            name="notes"
            placeholder="Any context that does not fit the structured fields"
            value={formData.notes}
            onChange={handleChange}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="primary-button" type="submit">
          <Save size={18} />
          <span>Save plant</span>
        </button>
      </form>
    </main>
  );
}

export default AddPlant;
