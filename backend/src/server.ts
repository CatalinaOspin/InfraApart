import app from './app';

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`============================================`);
  console.log(`  🚧 InfraApart API Server`);
  console.log(`  📍 Puerto: ${PORT}`);
  console.log(`  🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔗 http://localhost:${PORT}/api/health`);
  console.log(`============================================`);
});
