const { neon } = require('@neondatabase/serverless');

// Log environment check
console.log('Environment check:', {
  hasNetlifyUrl: !!process.env.NETLIFY_DATABASE_URL,
  hasUnpooled: !!process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  nodeEnv: process.env.NODE_ENV
});

const sql = neon(process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED);

// Initialize database tables
async function initializeDatabase() {
  try {
    // Drop existing table if it exists (to fix column naming issues)
    await sql`DROP TABLE IF EXISTS matches`;

    // Create matches table with correct column names
    await sql`
      CREATE TABLE matches (
        id SERIAL PRIMARY KEY,
        gamekey VARCHAR(10) UNIQUE NOT NULL,
        club VARCHAR(255),
        address TEXT,
        time VARCHAR(10),
        jerseyparent VARCHAR(255),
        drivers JSONB,
        snackparents JSONB,
        attendance JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database initialized successfully with correct schema');
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
        SELECT * FROM matches ORDER BY gamekey
      `;

      // Transform data to match frontend format
      const matchesData = {};
      matches.forEach(match => {
        matchesData[match.gamekey] = {
          club: match.club || '',
          address: match.address || '',
          time: match.time || '',
          jerseyParent: match.jerseyparent || '',
          drivers: match.drivers || ['', '', ''],
          snackParents: match.snackparents || ['', ''],
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
          gamekey, club, address, time, jerseyparent, drivers, snackparents, attendance, updated_at
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
        ON CONFLICT (gamekey)
        DO UPDATE SET
          club = EXCLUDED.club,
          address = EXCLUDED.address,
          time = EXCLUDED.time,
          jerseyparent = EXCLUDED.jerseyparent,
          drivers = EXCLUDED.drivers,
          snackparents = EXCLUDED.snackparents,
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
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
    };
  }
};