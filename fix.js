const fs = require('fs'); 
let c = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8'); 

c = c.replace(/Soluciones adaptadas para Propiedad Horizontal y Fondos Familiares\./g, 'Soluciones adaptadas para Propiedad Horizontal.'); 

c = c.replace(/const plans = \[[\s\S]*?\]\n/m, `const plans = [
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
]
`); 

c = c.replace(/grid-cols-1 md:grid-cols-3/g, 'max-w-4xl mx-auto grid-cols-1 md:grid-cols-2'); 

fs.writeFileSync('src/pages/LandingPage.tsx', c);
console.log('Fixed!');
