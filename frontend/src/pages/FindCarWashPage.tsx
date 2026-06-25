import { useState, useEffect } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import PageLayout from '../components/PageLayout';

import CarWashMapExplorer, { ExplorerCarWash } from '../components/map/CarWashMapExplorer';

import { useAuth } from '../context/AuthContext';

import api from '../services/api';

import { Coordinates } from '../services/mappingService';

import { getCurrentPosition } from '../services/locationService';

import './FindCarWashPage.css';



const FindCarWashPage = () => {

  const navigate = useNavigate();

  const { user } = useAuth();

  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  const [locationError, setLocationError] = useState<string | null>(null);

  const [selectedWash, setSelectedWash] = useState<ExplorerCarWash | null>(null);



  useEffect(() => {

    getCurrentPosition()

      .then((pos) => {

        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });

        setLocationError(null);

      })

      .catch(() => {

        setLocationError('Enable location to see your position on the map.');

      });

  }, []);



  const { data: rawWashes, isLoading, error, refetch } = useQuery({

    queryKey: ['public-carwashes-map'],

    queryFn: async () => {

      const res = await api.get('/carwash/list?includeServices=true');

      return res.data.data || [];

    },

    staleTime: 60000,

  });



  const handleBook = (washId: string, serviceId?: string) => {

    if (user?.role === 'client') {

      navigate('/client/book', { state: { carWashId: washId, serviceId } });

      return;

    }

    navigate('/register', { state: { carWashId: washId, from: '/book' } });

  };



  return (

    <PageLayout>

      <div className="find-carwash-page find-carwash-page--map-first">

        <div className="find-carwash-header find-carwash-header--compact">

          <div>

            <Link to="/" className="find-back">

              ← Home

            </Link>

            <h1>Find a car wash</h1>

          </div>

          {!user && (

            <div className="find-auth-hint">

              <button type="button" className="btn btn-secondary" onClick={() => navigate('/login')}>

                Sign in

              </button>

            </div>

          )}

        </div>



        {locationError && <div className="find-banner find-banner-warn">{locationError}</div>}



        <CarWashMapExplorer

          className="car-wash-map-explorer--fullpage"

          rawCarWashes={(rawWashes as Record<string, unknown>[]) || []}

          isLoading={isLoading}

          error={error}

          onRetry={() => refetch()}

          userLocation={userLocation}

          selectedWash={selectedWash}

          onSelectWash={setSelectedWash}

          onBook={handleBook}

          height="min(calc(100vh - 140px), 780px)"

          searchPlaceholder="Search Lusaka car washes…"

        />

      </div>

    </PageLayout>

  );

};



export default FindCarWashPage;

