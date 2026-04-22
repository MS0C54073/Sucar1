/**
 * Mapbox Token Edge Function
 * Securely serves the Mapbox public token to the frontend
 * Deployed to: /functions/v1/get-mapbox-token
 */

const MAPBOX_PUBLIC_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN');

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: corsHeaders,
      }
    );
  }

  // Validate token is set
  if (!MAPBOX_PUBLIC_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Mapbox token not configured' }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }

  // Return token
  const response = {
    token: MAPBOX_PUBLIC_TOKEN,
    expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: corsHeaders,
  });
});
