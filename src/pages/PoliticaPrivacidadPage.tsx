import { Link } from 'react-router-dom'

const PoliticaPrivacidadPage = () => (
  <div className="min-h-screen bg-white">
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <Link to="/" className="text-blue-600 hover:underline text-sm mb-8 inline-block">
        ← Volver al inicio
      </Link>
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Política de Privacidad</h1>
      <p className="text-slate-500">Contenido en construcción. Pronto estará disponible.</p>
    </div>
  </div>
)

export default PoliticaPrivacidadPage
