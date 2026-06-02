const fs = require('fs');

let c = fs.readFileSync('LandingPage_original.tsx', 'utf8');

// Name and Subtitles
c = c.replace(/FondoFácil/g, 'CoproAdmin');
c = c.replace(/Gestión de fondos familiares de ahorro/g, 'La plataforma definitiva para la gestión financiera y administrativa de copropiedades. Ahorra tiempo, evita errores y mantén a todos informados.');
c = c.replace(/Hecho para Colombia/g, 'Hecho para la nube');
c = c.replace(/Soluciones adaptadas para Colombia\./g, 'Soluciones adaptadas para Propiedad Horizontal.');
c = c.replace(/Plataforma para Gestión de Fondos Familiares/g, 'Plataforma para Gestión de Copropiedades');

// Words
c = c.replace(/comunidades/g, 'copropiedades');
c = c.replace(/comunidad/g, 'copropiedad');

// Features Section
c = c.replace(/'Control de aportes'/g, "'Control de pagos'");
c = c.replace(/'Registra y visualiza el ahorro mensual de cada miembro del fondo con total transparencia\.'/g, "'Registra y visualiza los pagos de administración de cada unidad con total transparencia.'");

c = c.replace(/'Préstamos'/g, "'Gestión de Zonas'");
c = c.replace(/'Otorga créditos, calcula intereses y haz seguimiento a las cuotas de amortización\.'/g, "'Permite a los residentes reservar zonas comunes online. Bloqueo automático para morosos.'");

c = c.replace(/'Reportes financieros'/g, "'Reportes y PQRs'");
c = c.replace(/'Genera reportes claros sobre el estado del fondo y sus movimientos en segundos\.'/g, "'Genera reportes claros y administra las solicitudes (PQR) de tu copropiedad en segundos.'");

// Plans
const plansReplacement = `const plans = [
  {
    name: 'PH Básico',
    desc: 'Para copropiedades pequeñas',
    monthly: 89000,
    annual: 890000,
    features: ['Hasta 50 unidades', 'Cobros automáticos', 'PQR digital', 'Portal de residentes', 'Soporte prioritario'],
    highlight: false,
  },
  {
    name: 'PH Pro',
    desc: 'Para conjuntos residenciales grandes',
    monthly: 149000,
    annual: 1490000,
    features: ['51 unidades en adelante', 'Reservas de zonas', 'Presupuesto anual', 'Múltiples administradores', 'Soporte 24/7'],
    highlight: true,
  },
]`;
c = c.replace(/const plans = \[[\s\S]*?\]/m, plansReplacement);

// Fix grid layout for plans from 3 columns to 2 columns
c = c.replace(/className="grid grid-cols-1 md:grid-cols-3 gap-8"/g, 'className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"');

fs.writeFileSync('src/pages/LandingPage.tsx', c, 'utf8');
console.log('Regenerated!');
