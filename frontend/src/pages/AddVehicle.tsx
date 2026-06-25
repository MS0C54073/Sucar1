import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import AutocompleteSelect from '../components/forms/AutocompleteSelect';
import ColorPicker from '../components/forms/ColorPicker';
import { getAllMakes, getModelsForMake } from '../data/carMakesModels';
import { useToast } from '../components/ToastContainer';
import './AddVehicle.css';

const AddVehicle = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    plateNo: '',
    color: '',
  });

  // Get available models based on selected make
  const availableModels = useMemo(() => {
    if (!formData.make) return [];
    return getModelsForMake(formData.make);
  }, [formData.make]);

  const createVehicleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/vehicles', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all vehicle-related queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['client-vehicles'] });
      showToast('Vehicle added successfully!', 'success');
      navigate('/client');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add vehicle', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVehicleMutation.mutate(formData);
  };

  return (
    <div className="add-vehicle sucar-page">
      <header className="add-vehicle-header book-header">
        <button type="button" className="back-button" onClick={() => navigate('/client')}>
          ← Back
        </button>
        <div className="header-content">
          <h1>Add Vehicle</h1>
        </div>
      </header>

      <div className="add-vehicle-content book-content">
        <form onSubmit={handleSubmit} className="vehicle-form">
          <AutocompleteSelect
            label="Make"
            value={formData.make}
            options={getAllMakes()}
            onChange={(value) => {
              setFormData({ ...formData, make: value, model: '' }); // Reset model when make changes
            }}
            placeholder="Search or select car make..."
            required
            searchable
          />

          <AutocompleteSelect
            label="Model"
            value={formData.model}
            options={availableModels}
            onChange={(value) => setFormData({ ...formData, model: value })}
            placeholder={formData.make ? "Search or select model..." : "Select make first"}
            required
            searchable
            maxHeight="250px"
          />

          <div className="form-group">
            <label>Plate Number *</label>
            <input
              type="text"
              value={formData.plateNo}
              onChange={(e) => setFormData({ ...formData, plateNo: e.target.value.toUpperCase() })}
              required
              placeholder="e.g., ABC-1234"
              maxLength={20}
            />
          </div>

          <ColorPicker
            label="Color"
            value={formData.color}
            onChange={(value) => setFormData({ ...formData, color: value })}
            required
          />

          <button
            type="submit"
            className="submit-btn"
            disabled={createVehicleMutation.isPending}
          >
            {createVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
