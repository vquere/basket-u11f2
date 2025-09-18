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
    const { method } = req;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    if (method === 'OPTIONS') {
        return new Response(null, { status: 200, headers });
    }
    
    try {
        if (method === 'GET') {
            const matches = await executeQuery(`
                SELECT date::text, club, address, time, jersey_parent, drivers, snack_parents 
                FROM matches 
                ORDER BY date
            `);
            
            const matchesData: { [key: string]: any } = {};
            matches.forEach((match: any) => {
                matchesData[match.date] = {
                    club: match.club || '',
                    address: match.address || '',
                    time: match.time || '',
                    jerseyParent: match.jersey_parent || '',
                    drivers: JSON.parse(match.drivers || '["","",""]'),
                    snackParents: JSON.parse(match.snack_parents || '["",""]')
                };
            });
            
            return new Response(JSON.stringify({ matches: matchesData }), {
                status: 200,
                headers
            });
            
        } else if (method === 'POST') {
            const { date, matchData } = await req.json();
            
            await executeQuery(`
                INSERT INTO matches (date, club, address, time, jersey_parent, drivers, snack_parents, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                ON CONFLICT (date) 
                DO UPDATE SET 
                    club = $2,
                    address = $3,
                    time = $4,
                    jersey_parent = $5,
                    drivers = $6,
                    snack_parents = $7,
                    updated_at = NOW()
            `, [
                date,
                matchData.club || '',
                matchData.address || '',
                matchData.time || '',
                matchData.jerseyParent || '',
                JSON.stringify(matchData.drivers || ['', '', '']),
                JSON.stringify(matchData.snackParents || ['', ''])
            ]);
            
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers
            });
        }
        
    } catch (error) {
        console.error('Erreur API matches:', error);
        return new Response(JSON.stringify({ 
            error: 'Erreur interne du serveur',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }), {
            status: 500,
            headers
        });
    }
};

export const config: Config = {
    path: "/api/matches"
};
