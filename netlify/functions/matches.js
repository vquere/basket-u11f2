const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create matches table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        game_key VARCHAR(10) UNIQUE NOT NULL,
        club VARCHAR(255),
        address TEXT,
        time VARCHAR(10),
        jersey_parent VARCHAR(255),
        drivers JSONB,
        snack_parents JSONB,
        attendance JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Initialize database on first request
    await initializeDatabase();

    if (event.httpMethod === 'GET') {
      // Get all matches
      const matches = await sql`
        SELECT * FROM matches ORDER BY game_key
      `;

      // Transform data to match frontend format
      const matchesData = {};
      matches.forEach(match => {
        matchesData[match.game_key] = {
          club: match.club || '',
          address: match.address || '',
          time: match.time || '',
          jerseyParent: match.jersey_parent || '',
          drivers: match.drivers || ['', '', ''],
          snackParents: match.snack_parents || ['', ''],
          attendance: match.attendance || {}
        };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ matches: matchesData }),
      };
    }

    if (event.httpMethod === 'POST') {
      const { gameKey, matchData } = JSON.parse(event.body);

      if (!gameKey || !matchData) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing gameKey or matchData' }),
        };
      }

      // Upsert match data
      await sql`
        INSERT INTO matches (
          game_key, club, address, time, jersey_parent, drivers, snack_parents, attendance, updated_at
        ) VALUES (
          ${gameKey},
          ${matchData.club},
          ${matchData.address},
          ${matchData.time},
          ${matchData.jerseyParent},
          ${JSON.stringify(matchData.drivers)},
          ${JSON.stringify(matchData.snackParents)},
          ${JSON.stringify(matchData.attendance)},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (game_key)
        DO UPDATE SET
          club = EXCLUDED.club,
          address = EXCLUDED.address,
          time = EXCLUDED.time,
          jersey_parent = EXCLUDED.jersey_parent,
          drivers = EXCLUDED.drivers,
          snack_parents = EXCLUDED.snack_parents,
          attendance = EXCLUDED.attendance,
          updated_at = CURRENT_TIMESTAMP
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Match saved successfully' }),
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Clear all matches
      await sql`DELETE FROM matches`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'All matches cleared' }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};