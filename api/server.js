const { db } = require('./src/config/firebase');
const createApp = require('./index');

const app = createApp(db);
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API Express (legada) rodando na porta ${PORT}`);
});
