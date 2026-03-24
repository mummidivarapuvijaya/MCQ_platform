require('dotenv').config();
const { connectDb } = require('./db');
const { app } = require('./app');

async function bootstrap() {
  await connectDb();
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

