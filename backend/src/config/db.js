import sql from 'mssql';

// En tu PC: SQL Server local sin cifrado.
// En la nube (Azure SQL): DB_ENCRYPT=true, conexión cifrada y certificado verificado.
const cifrar = process.env.DB_ENCRYPT === 'true';

const config = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // La base gratuita de Azure se pausa cuando no se usa y tarda en despertar
  connectionTimeout: 60_000,
  requestTimeout: 30_000,
  options: {
    encrypt: cifrar,
    trustServerCertificate: !cifrar // solo en local se acepta un certificado sin verificar
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Errores de Azure SQL que significan "todavía estoy despertando, intenta otra vez"
const ERRORES_TEMPORALES = new Set([40613, 40197, 40501, 49918, 49919, 49920, 4060]);
const INTENTOS = 4;
const ESPERA_MS = 8_000;

export function esErrorTemporal(err) {
  const numero = err?.number ?? err?.originalError?.info?.number ?? err?.originalError?.number;
  // Un ETIMEOUT no se reintenta: ya esperó 60 s y suele ser el firewall, no la pausa
  return ERRORES_TEMPORALES.has(numero);
}

async function conectar() {
  for (let intento = 1; ; intento++) {
    try {
      return await new sql.ConnectionPool(config).connect();
    } catch (err) {
      if (intento >= INTENTOS || !esErrorTemporal(err)) throw err;
      console.log(`⏳ La base de datos está despertando (intento ${intento} de ${INTENTOS})…`);
      await new Promise((listo) => setTimeout(listo, ESPERA_MS));
    }
  }
}

let poolPromise = null;

export function getPool() {
  if (!poolPromise) {
    poolPromise = conectar()
      .then(pool => {
        console.log('✅ Conectado a SQL Server');
        // Si la conexión se cae (por ejemplo, Azure pausó la base), se vuelve a crear
        pool.on('error', () => { poolPromise = null; });
        return pool;
      })
      .catch(err => {
        poolPromise = null; // permite reintentar en la siguiente petición
        throw err;
      });
  }
  return poolPromise;
}

export { sql };
