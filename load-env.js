const dotenv = require('dotenv');
const path = require('path');

// Carrega o arquivo .env
dotenv.config({ path: path.join(__dirname, '.env') });

// Inicia a aplicação
require('./dist/main.js');
