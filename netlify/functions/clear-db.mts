import type { Context, Config } from "@netlify/functions";

// Fonction pour exécuter des requêtes SQL avec Neon
async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
    const DATABASE_URL = Netlify.env.get("DATABASE_URL");

    if (!DATABASE_URL) {
        throw new Error("DATABASE_URL non configurée");
    }

    try {
        const { neon } = await import('@neondatabase/serverless');
        const query = neon(DATABASE_URL);

        const result = await query(sql, params);
        return result;
    } catch (error) {
        console.error('Erreur base de données:', error);
        throw error;
    }
}

export default async (req: Request, context: Context) => {
    // Headers CORS
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Seule la méthode POST est autorisée' }), {
            status: 405,
            headers
        });
    }

    const DATABASE_URL = Netlify.env.get("DATABASE_URL");

    if (!DATABASE_URL) {
        return new Response(JSON.stringify({
            error: 'DATABASE_URL non configurée',
            help: 'Veuillez configurer la variable d\'environnement DATABASE_URL dans Netlify'
        }), {
            status: 500,
            headers
        });
    }

    try {
        console.log('🧹 Clearing old match data from database...');

        // Delete all existing match data
        const deleteResult = await executeQuery(`
            DELETE FROM matches;
        `);

        console.log('✅ Old match data cleared');

        // Reset the sequence for the ID column
        await executeQuery(`
            ALTER SEQUENCE matches_id_seq RESTART WITH 1;
        `);

        console.log('✅ ID sequence reset');

        const response = {
            success: true,
            message: 'Database cleared successfully',
            details: {
                recordsDeleted: deleteResult.length,
                timestamp: new Date().toISOString()
            }
        };

        console.log('🎉 Database clearing completed:', response);

        return new Response(JSON.stringify(response), {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('❌ Error clearing database:', error);

        return new Response(JSON.stringify({
            error: 'Error clearing database',
            details: error instanceof Error ? error.message : 'Unknown error',
            help: 'Check your DATABASE_URL and database accessibility',
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers
        });
    }
};

export const config: Config = {
    path: "/api/clear-db"
};