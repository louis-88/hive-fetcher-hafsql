import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const app = express();
const port = 3000;

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pool management helper
class DatabaseManager {
    constructor(config) {
        this.config = config;
        this.pool = new Pool(config);
        this.isEnding = false;
    }

    async safeEnd() {
        if (this.pool && !this.isEnding) {
            this.isEnding = true;
            await this.pool.end();
            this.pool = null;
            this.isEnding = false;
        }
    }

    async createNewPool(config) {
        await this.safeEnd();
        this.config = config;
        this.pool = new Pool(config);
        return this.pool;
    }

    getPool() {
        if (!this.pool) {
            this.pool = new Pool(this.config);
        }
        return this.pool;
    }
}

// Initialize database manager with default credentials
let dbManager = new DatabaseManager({
    host: 'hafsql.mahdiyari.info',
    port: 5432,
    database: 'haf_block_log',
    user: 'hafsql_public',
    password: 'hafsql_public'
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.static(__dirname));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'hafsql.html'));
});

// Update HafSQL credentials
app.post('/update-credentials', async (req, res) => {
    const { host, port, database, user, password } = req.body;
    
    try {
        const newPool = await dbManager.createNewPool({
            host, 
            port: Number(port), 
            database, 
            user, 
            password,
            connectionTimeoutMillis: 5000,
            statement_timeout: 10000
        });

        // Test basic connection
        await newPool.query('SELECT 1');

        // Test schema access
        const schemaTest = await newPool.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.schemata 
                WHERE schema_name = 'public'
            ) as has_schema`);

        if (!schemaTest.rows[0].has_schema) {
            throw new Error('Cannot access required schema');
        }

        // Test table access
        const tableTest = await newPool.query(`
            SELECT 
                EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') as has_comments,
                EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'op_vote') as has_op_vote,
                EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reputations') as has_reputations
        `);
        
        const { has_comments, has_op_vote, has_reputations } = tableTest.rows[0];
        
        res.status(200).json({ 
            success: true,
            details: {
                connection: 'Successfully connected to database',
                host: host,
                database: database,
                tables: {
                    comments: has_comments,
                    op_vote: has_op_vote,
                    reputations: has_reputations
                }
            }
        });
    } catch (error) {
        console.error('Connection error:', error);
        
        // Restore default configuration if needed
        await dbManager.createNewPool({
            host: 'hafsql-sql.mahdiyari.info',
            port: 5432,
            database: 'haf_block_log',
            user: 'hafsql_public',
            password: 'hafsql_public'
        });
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: {
                errorType: error.name,
                errorCode: error.code,
                host: host,
                port: port,
                database: database,
                user: user ? '✓' : '✗',
                password: password ? '✓' : '✗'
            }
        });
    }
});

// Query HafSQL
app.post('/query', async (req, res) => {
    const { usernames, days, threshold } = req.body;
    
    try {
        const query = `
            SELECT 
                c.author,
                c.permlink,
                c.created,
                c.title,
                c.pending_payout_value,
                c.total_payout_value,
                r.reputation AS user_reputation,
                COUNT(v.voter) AS vote_count
            FROM comments c
            LEFT JOIN op_vote v
                   ON v.author = c.author
                  AND v.permlink = c.permlink
            LEFT JOIN reputations r
                   ON r.account_name = c.author
            WHERE c.parent_author = ''
              AND c.author = ANY($1)
              AND c.created > NOW() - INTERVAL '${days} days'
              AND (c.pending_payout_value::numeric) >= $2
            GROUP BY
                c.author,
                c.permlink,
                c.created,
                c.title,
                c.pending_payout_value,
                c.total_payout_value,
                r.reputation
            ORDER BY c.created DESC
        `;
        
        const result = await dbManager.getPool().query(query, [usernames, threshold]);
        
        const stats = {
            total_posts: result.rowCount,
            total_value: result.rows.reduce((sum, row) => 
                sum + parseFloat(row.pending_payout_value.split(' ')[0]), 0)
        };
        
        res.json({ 
            success: true, 
            data: result.rows,
            stats
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Cleanup on server shutdown
process.on('SIGINT', async () => {
    try {
        await dbManager.safeEnd();
    } catch (err) {
        console.error('Error during shutdown:', err);
    }
    process.exit(0);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
