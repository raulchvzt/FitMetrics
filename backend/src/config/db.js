import sql from 'mssql';

// En tu PC: SQL Server local sin cifrado.
// En la nube: DB_ENCRYPT=true para cifrar la conexión. Si el hosting usa un certificado
// que no está firmado por una autoridad reconocida, DB_TRUST_SERVER_CERT=true lo acepta.
const cifrar = process.env.DB_ENCRYPT === 'true';
const confiarCertificado = !cifrar || process.env.DB_TRUST_SERVER_CERT === 'true';

const config = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Una base en la nube puede tardar en responder la primera vez (si estaba en pausa)
  connectionTimeout: 60_000,
  requestTimeout: 30_000,
  options: {
    encrypt: cifrar,
    trustServerCertificate: confiarCertificado
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Errores de bases en la nube (Azure SQL y similares) que significan
// "todavía estoy despertando, intenta otra vez"
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
        // Si la conexión se cae (por ejemplo, la base se pausó), se vuelve a crear
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
