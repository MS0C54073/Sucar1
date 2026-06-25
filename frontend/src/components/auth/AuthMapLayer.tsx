import MapView from '../MapView';

/** Separate chunk so mapbox-gl does not block the auth form from rendering. */
const AuthMapLayer = () => <MapView backgroundMode zoom={11.5} height="100%" />;

export default AuthMapLayer;
