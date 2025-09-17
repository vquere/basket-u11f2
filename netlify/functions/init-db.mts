import type { Context, Config } from "@netlify/functions";

// Fonction pour exécuter des requêtes SQL avec Neon
async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
    const DATABASE_URL = Netlify.env.get("DATABASE_URL");
    
    if (!DATABASE_URL) {
        throw new Error("DATABASE_URL non configurée");
    }

    try {
        // Utilisation du client Neon serverless
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
        console.log('🚀 Début de l\'initialisation de la base de données...');
        
        // 1. Créer la table des matchs si elle n'existe pas
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS matches (
                id SERIAL PRIMARY KEY,
                date DATE UNIQUE NOT NULL,
                club VARCHAR(255) NOT NULL DEFAULT '',
                address TEXT NOT NULL DEFAULT '',
                time VARCHAR(10) NOT NULL DEFAULT '',
                jersey_parent VARCHAR(255) NOT NULL DEFAULT '',
                drivers TEXT NOT NULL DEFAULT '["","",""]',
                snack_parents TEXT NOT NULL DEFAULT '["",""]',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        
        console.log('✅ Table matches créée/vérifiée');

        // 2. Créer l'index sur la date pour optimiser les performances
        await executeQuery(`
            CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
        `);
        
        console.log('✅ Index sur date créé/vérifié');

        // 3. Insérer le match du 27 septembre par défaut s'il n'existe pas
        const existingMatch = await executeQuery(`
            SELECT COUNT(*) as count FROM matches WHERE date = '2025-09-27';
        `);
        
        if (existingMatch[0]?.count === 0) {
            await executeQuery(`
                INSERT INTO matches (date, club, address, jersey_parent, drivers, snack_parents)
                VALUES ('2025-09-27', 'OC Cesson', 'ESB - 49 avenue de Dezerseul - Cesson Sévigné', '', '["","",""]', '["",""]');
            `);
            
            console.log('✅ Match du 27 septembre inséré');
        } else {
            console.log('ℹ️ Match du 27 septembre déjà présent');
        }

        // 4. Vérifier que tout fonctionne en comptant les matchs
        const totalMatches = await executeQuery(`
            SELECT COUNT(*) as total FROM matches;
        `);
        
        const response = {
            success: true, 
            message: 'Base de données initialisée avec succès',
            details: {
                tablesCreated: ['matches'],
                indexesCreated: ['idx_matches_date'],
                totalMatches: totalMatches[0]?.total || 0,
                defaultMatchCreated: existingMatch[0]?.count === 0
            },
            timestamp: new Date().toISOString()
        };

        console.log('🎉 Initialisation terminée avec succès:', response);

        return new Response(JSON.stringify(response), {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
        
        return new Response(JSON.stringify({ 
            error: 'Erreur lors de l\'initialisation de la base de données',
            details: error instanceof Error ? error.message : 'Erreur inconnue',
            help: 'Vérifiez que votre DATABASE_URL est correcte et que la base de données est accessible',
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers
        });
    }
};

export const config: Config = {
    path: "/api/init-db"
};
