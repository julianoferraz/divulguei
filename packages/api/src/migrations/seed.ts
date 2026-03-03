import { getClient } from '../config/database';
import { env } from '../config/env';

interface CategoryDef {
  name: string;
  slug: string;
  icon?: string;
  children?: { name: string; slug: string }[];
}

async function seed() {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. City: Floresta-PE
    const cityRes = await client.query(`
      INSERT INTO cities (name, slug, state, population, latitude, longitude, is_active)
      VALUES ('Floresta', 'floresta', 'PE', 32000, -8.6009, -38.5684, true)
      ON CONFLICT (slug) DO UPDATE SET is_active = true
      RETURNING id
    `);
    const cityId = cityRes.rows[0].id;
    console.log('✅ City Floresta created:', cityId);

    // Helper to insert categories
    async function insertCategories(type: string, cats: CategoryDef[]) {
      for (let i = 0; i < cats.length; i++) {
        const cat = cats[i];
        const parentRes = await client.query(`
          INSERT INTO categories (name, slug, type, icon, sort_order)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (slug, type) DO UPDATE SET name = $1
          RETURNING id
        `, [cat.name, cat.slug, type, cat.icon || null, i]);
        const parentId = parentRes.rows[0].id;

        if (cat.children) {
          for (let j = 0; j < cat.children.length; j++) {
            const child = cat.children[j];
            await client.query(`
              INSERT INTO categories (name, slug, type, parent_id, sort_order)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (slug, type) DO UPDATE SET name = $1, parent_id = $4
            `, [child.name, child.slug, type, parentId, j]);
          }
        }
      }
    }

    // 2. Business categories
    await insertCategories('business', [
      { name: 'Alimentação', slug: 'alimentacao', icon: '🍕', children: [
        { name: 'Pizzaria', slug: 'pizzaria' },
        { name: 'Lanchonete', slug: 'lanchonete' },
        { name: 'Restaurante', slug: 'restaurante' },
        { name: 'Sorveteria', slug: 'sorveteria' },
        { name: 'Padaria', slug: 'padaria' },
        { name: 'Bar', slug: 'bar' },
        { name: 'Marmitaria', slug: 'marmitaria' },
      ]},
      { name: 'Saúde', slug: 'saude', icon: '🏥', children: [
        { name: 'Farmácia', slug: 'farmacia' },
        { name: 'Clínica', slug: 'clinica' },
        { name: 'Consultório', slug: 'consultorio' },
        { name: 'Laboratório', slug: 'laboratorio' },
      ]},
      { name: 'Beleza', slug: 'beleza', icon: '💇', children: [
        { name: 'Salão', slug: 'salao' },
        { name: 'Barbearia', slug: 'barbearia' },
        { name: 'Manicure', slug: 'manicure-beleza' },
        { name: 'Estética', slug: 'estetica' },
      ]},
      { name: 'Automotivo', slug: 'automotivo', icon: '🚗', children: [
        { name: 'Oficina', slug: 'oficina' },
        { name: 'Borracharia', slug: 'borracharia' },
        { name: 'Lava Jato', slug: 'lava-jato' },
        { name: 'Auto Peças', slug: 'auto-pecas' },
      ]},
      { name: 'Comércio', slug: 'comercio', icon: '🛒', children: [
        { name: 'Supermercado', slug: 'supermercado' },
        { name: 'Mercadinho', slug: 'mercadinho' },
        { name: 'Loja de Roupas', slug: 'loja-roupas' },
        { name: 'Loja de Calçados', slug: 'loja-calcados' },
        { name: 'Material de Construção', slug: 'material-construcao' },
        { name: 'Papelaria', slug: 'papelaria' },
        { name: 'Pet Shop', slug: 'pet-shop' },
      ]},
      { name: 'Serviços', slug: 'servicos', icon: '🔧', children: [
        { name: 'Advocacia', slug: 'advocacia' },
        { name: 'Contabilidade', slug: 'contabilidade' },
        { name: 'Informática', slug: 'informatica' },
        { name: 'Assistência Técnica', slug: 'assistencia-tecnica' },
      ]},
      { name: 'Educação', slug: 'educacao', icon: '📚', children: [
        { name: 'Escola', slug: 'escola' },
        { name: 'Curso', slug: 'curso' },
        { name: 'Reforço Escolar', slug: 'reforco-escolar' },
      ]},
      { name: 'Hospedagem', slug: 'hospedagem', icon: '🏨', children: [
        { name: 'Hotel', slug: 'hotel' },
        { name: 'Pousada', slug: 'pousada' },
      ]},
      { name: 'Entretenimento', slug: 'entretenimento', icon: '🎯', children: [
        { name: 'Academia', slug: 'academia' },
        { name: 'Quadra', slug: 'quadra' },
        { name: 'Clube', slug: 'clube' },
      ]},
    ]);
    console.log('✅ Business categories created');

    // 3. Classified categories
    await insertCategories('classified', [
      { name: 'Imóveis', slug: 'imoveis', icon: '🏠', children: [
        { name: 'Casa', slug: 'casa' },
        { name: 'Apartamento', slug: 'apartamento' },
        { name: 'Terreno', slug: 'terreno' },
        { name: 'Sala Comercial', slug: 'sala-comercial' },
      ]},
      { name: 'Veículos', slug: 'veiculos', icon: '🚗', children: [
        { name: 'Carro', slug: 'carro' },
        { name: 'Moto', slug: 'moto' },
        { name: 'Bicicleta', slug: 'bicicleta' },
      ]},
      { name: 'Eletrônicos', slug: 'eletronicos', icon: '📱', children: [
        { name: 'Celular', slug: 'celular' },
        { name: 'Computador', slug: 'computador' },
        { name: 'TV', slug: 'tv' },
        { name: 'Videogame', slug: 'videogame' },
      ]},
      { name: 'Móveis', slug: 'moveis', icon: '🪑', children: [
        { name: 'Sofá', slug: 'sofa' },
        { name: 'Mesa', slug: 'mesa' },
        { name: 'Cama', slug: 'cama' },
        { name: 'Guarda-roupa', slug: 'guarda-roupa' },
      ]},
      { name: 'Eletrodomésticos', slug: 'eletrodomesticos', icon: '🏠', children: [
        { name: 'Geladeira', slug: 'geladeira' },
        { name: 'Fogão', slug: 'fogao' },
        { name: 'Máquina de Lavar', slug: 'maquina-lavar' },
      ]},
      { name: 'Roupas e Acessórios', slug: 'roupas-acessorios', icon: '👕' },
      { name: 'Animais', slug: 'animais', icon: '🐾' },
      { name: 'Outros', slug: 'outros-classificados', icon: '📦' },
    ]);
    console.log('✅ Classified categories created');

    // 4. Professional categories
    const professionalCats: CategoryDef[] = [
      { name: 'Eletricista', slug: 'eletricista', icon: '⚡' },
      { name: 'Encanador', slug: 'encanador', icon: '🔧' },
      { name: 'Pedreiro', slug: 'pedreiro', icon: '🧱' },
      { name: 'Pintor', slug: 'pintor', icon: '🎨' },
      { name: 'Freteiro', slug: 'freteiro', icon: '🚚' },
      { name: 'Mecânico', slug: 'mecanico', icon: '🔩' },
      { name: 'Técnico de Celular', slug: 'tecnico-celular', icon: '📱' },
      { name: 'Técnico de Informática', slug: 'tecnico-informatica', icon: '💻' },
      { name: 'Jardineiro', slug: 'jardineiro', icon: '🌿' },
      { name: 'Diarista', slug: 'diarista', icon: '🧹' },
      { name: 'Cuidador', slug: 'cuidador', icon: '🤝' },
      { name: 'Manicure', slug: 'manicure', icon: '💅' },
      { name: 'Cabeleireiro', slug: 'cabeleireiro', icon: '💇' },
      { name: 'Costureira', slug: 'costureira', icon: '🧵' },
      { name: 'Confeiteiro', slug: 'confeiteiro', icon: '🎂' },
      { name: 'Salgadeiro', slug: 'salgadeiro', icon: '🥟' },
    ];
    await insertCategories('professional', professionalCats);
    console.log('✅ Professional categories created');

    // 5. Event categories
    const eventCats: CategoryDef[] = [
      { name: 'Festa', slug: 'festa', icon: '🎉' },
      { name: 'Feira', slug: 'feira', icon: '🏪' },
      { name: 'Religioso', slug: 'religioso', icon: '⛪' },
      { name: 'Esportivo', slug: 'esportivo', icon: '⚽' },
      { name: 'Cultural', slug: 'cultural', icon: '🎭' },
      { name: 'Show', slug: 'show', icon: '🎵' },
      { name: 'Palestra', slug: 'palestra', icon: '🎤' },
      { name: 'Curso', slug: 'curso-evento', icon: '📖' },
    ];
    await insertCategories('event', eventCats);
    console.log('✅ Event categories created');

    // 6. Job categories
    const jobCats: CategoryDef[] = [
      { name: 'Atendente', slug: 'atendente', icon: '🧑‍💼' },
      { name: 'Vendedor', slug: 'vendedor', icon: '🛍️' },
      { name: 'Auxiliar', slug: 'auxiliar', icon: '👷' },
      { name: 'Motorista', slug: 'motorista', icon: '🚗' },
      { name: 'Garçom', slug: 'garcom', icon: '🍽️' },
      { name: 'Cozinheiro', slug: 'cozinheiro', icon: '👨‍🍳' },
      { name: 'Serviços Gerais', slug: 'servicos-gerais', icon: '🔨' },
    ];
    await insertCategories('job', jobCats);
    console.log('✅ Job categories created');

    // 7. Admin user
    const adminPhone = env.ADMIN_PHONE || '5587999999999';
    await client.query(`
      INSERT INTO users (name, phone, city_id, role, auth_provider)
      VALUES ('Admin Divulguei', $1, $2, 'admin', 'manual')
      ON CONFLICT (phone) DO UPDATE SET role = 'admin'
    `, [adminPhone, cityId]);
    console.log('✅ Admin user created');

    await client.query('COMMIT');
    console.log('\n🎉 Seed completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
