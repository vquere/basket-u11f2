const { neon } = require('@neondatabase/serverless');

// Log environment check
console.log('Environment check:', {
  hasNetlifyUrl: !!process.env.NETLIFY_DATABASE_URL,
  hasUnpooled: !!process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  nodeEnv: process.env.NODE_ENV
});

const sql = neon(process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED);

// Check if table exists
async function checkTableExists() {
  try {
    // Check if table exists
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'matches'
      );
    `;

    return result[0].exists;
  } catch (error) {
    console.log('Error checking if table exists:', error.message);
    return false;
  }
}

// Initialize database tables
async function initializeDatabase() {
  try {
    const tableExists = await checkTableExists();

    if (!tableExists) {
      console.log('Creating matches table...');

      // Create matches table with correct column names
      await sql`
        CREATE TABLE matches (
          id SERIAL PRIMARY KEY,
          gamekey VARCHAR(10) UNIQUE NOT NULL,
          club VARCHAR(255),
          address TEXT,
          time VARCHAR(10),
          location VARCHAR(20),
          jerseyparent VARCHAR(255),
          drivers JSONB,
          snackparents JSONB,
          attendance JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      console.log('Database table created successfully');
    } else {
      console.log('Table already exists - preserving existing data');
    }
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

      console.log(`Found ${matches.length} matches in database`);

      // Transform data to match frontend format
      const matchesData = {};
      matches.forEach(match => {
        matchesData[match.gamekey] = {
          club: match.club || '',
          address: match.address || '',
          time: match.time || '',
          location: match.location || '',
          jerseyParent: match.jerseyparent || '',
          drivers: match.drivers || ['', '', ''],
          snackParents: match.snackparents || ['', ''],
          attendance: match.attendance || {}
        };
      });

      console.log(`Returning ${Object.keys(matchesData).length} matches to frontend`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ matches: matchesData }),
      };
    }

    if (event.httpMethod === 'POST') {
      const { gameKey, matchData } = JSON.parse(event.body);

      console.log(`Saving match ${gameKey}:`, {
        club: matchData.club,
        hasAttendance: !!matchData.attendance,
        attendanceCount: matchData.attendance ? Object.keys(matchData.attendance).length : 0
      });

      if (!gameKey || !matchData) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing gameKey or matchData' }),
        };
      }

      // Upsert match data
      const result = await sql`
        INSERT INTO matches (
          gamekey, club, address, time, location, jerseyparent, drivers, snackparents, attendance, updated_at
        ) VALUES (
          ${gameKey},
          ${matchData.club},
          ${matchData.address},
          ${matchData.time},
          ${matchData.location},
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
          location = EXCLUDED.location,
          jerseyparent = EXCLUDED.jerseyparent,
          drivers = EXCLUDED.drivers,
          snackparents = EXCLUDED.snackparents,
          attendance = EXCLUDED.attendance,
          updated_at = CURRENT_TIMESTAMP
        RETURNING gamekey
      `;

      console.log(`Successfully saved match ${gameKey}:`, result);

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