// ── Colores por tipo ──────────────────────────────────────────────────────
const colorTipo = {
  fire:     "bg-orange-100 text-orange-700",
  grass:    "bg-lime-100 text-lime-700",
  water:    "bg-sky-100 text-sky-700",
  electric: "bg-yellow-100 text-yellow-700",
  poison:   "bg-purple-100 text-purple-700",
  ghost:    "bg-slate-200 text-slate-600",
  normal:   "bg-stone-100 text-stone-500",
  fairy:    "bg-pink-100 text-pink-600",
};

// ── Referencias al DOM ────────────────────────────────────────────────────
const contenedor = document.getElementById("resultado");
const buscador   = document.getElementById("buscador");
const boton      = document.getElementById("btn-buscar");

// ── Estado global ─────────────────────────────────────────────────────────
let pokedex = [];  // Pokémon capturados
let offset  = 0;   // para paginación de "cargar más"

// ── Funciones de API ──────────────────────────────────────────────────────

// Acepta nombre ("pikachu") o número (25) gracias a que la API soporta ambos
async function obtenerPokemon(idONombre) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${idONombre}`);
  return response.json();
}

// ── Funciones de transformación ───────────────────────────────────────────

// Convierte la respuesta cruda de la API a la forma que usamos
function adaptarPokemon(data) {
  return {
    nombre: data.name,
    imagen: data.sprites?.front_default ?? "https://via.placeholder.com/96?text=?",
    tipos:  data.types.map(t => t.type.name),
    stats:  data.stats.map(s => ({ nombre: s.stat.name, valor: s.base_stat }))
  };
}

// ── Funciones de UI ───────────────────────────────────────────────────────

// Crea y devuelve una tarjeta <article> para un Pokémon
// Si showQuitar=true, agrega el botón "Quitar de Pokédex"
function crearTarjeta(pokemon, showQuitar = false) {
  const { nombre, imagen, tipos } = pokemon;

  const img = imagen ?? "https://via.placeholder.com/96?text=?";

  const badges = tipos
    .map(function (tipo) {
      const clases = colorTipo[tipo] ?? "bg-slate-100 text-slate-600";
      return `<span class="text-xs px-2 py-1 rounded-full ${clases}">${tipo}</span>`;
    })
    .join("");

  const articulo = document.createElement("article");
  articulo.className = "bg-white rounded-xl shadow p-4 text-center";
  articulo.innerHTML = `
    <img src="${img}" alt="${nombre}" class="w-24 h-24 mx-auto">
    <h2 class="capitalize font-bold text-slate-800 mt-2">${nombre}</h2>
    <div class="flex gap-1 justify-center mt-2 flex-wrap">${badges}</div>
  `;

  // Logro 2 — botón quitar (solo en tarjetas de la Pokédex)
  if (showQuitar) {
    const btnQuitar = document.createElement("button");
    btnQuitar.textContent = "✕ Quitar";
    btnQuitar.className = "mt-3 w-full text-xs bg-red-100 text-red-600 font-semibold rounded-lg py-1 hover:bg-red-200";
    btnQuitar.addEventListener("click", () => quitarPokemon(pokemon.nombre));
    articulo.appendChild(btnQuitar);
  }

  return articulo;
}

// Limpia el contenedor y pinta la lista recibida
function render(lista) {
  contenedor.innerHTML = "";
  lista.forEach(function (pokemon) {
    const tarjeta = crearTarjeta(pokemon, true);  // showQuitar=true en la Pokédex
    contenedor.appendChild(tarjeta);
  });
}

// Muestra la tarjeta del resultado de búsqueda con stats y botón capturar
function mostrarResultado(pokemon) {
  const tarjeta = crearTarjeta(pokemon);  // sin botón quitar

  // Estadísticas
  const stats = document.createElement("div");
  stats.className = "mt-2 text-left text-xs space-y-1";
  stats.innerHTML = pokemon.stats.map(s => `
    <div class="flex justify-between">
      <span class="capitalize text-slate-500">${s.nombre}</span>
      <span class="font-semibold">${s.valor}</span>
    </div>
  `).join("");
  tarjeta.appendChild(stats);

  // Botón capturar
  const btnCapturar = document.createElement("button");
  btnCapturar.textContent = "⚡ Capturar";
  btnCapturar.className = "mt-2 w-full bg-yellow-400 font-semibold rounded-lg py-1 hover:bg-yellow-500";
  btnCapturar.addEventListener("click", () => capturar(pokemon));
  tarjeta.appendChild(btnCapturar);

  contenedor.innerHTML = "";
  contenedor.appendChild(tarjeta);
}

// ── Acciones ──────────────────────────────────────────────────────────────

// Agrega un Pokémon a la Pokédex sin duplicar y vuelve a renderizar
function capturar(pokemon) {
  if (!pokedex.some(p => p.nombre === pokemon.nombre)) {
    pokedex.push(pokemon);
  }
  render(pokedex);
  buscador.value = "";
}

// Logro 2 — quita un Pokémon de la Pokédex por nombre y re-renderiza
function quitarPokemon(nombre) {
  pokedex = pokedex.filter(p => p.nombre !== nombre);
  render(pokedex);
}

// Logro 1 — busca por nombre o número (la API acepta ambos en la misma ruta)
async function mostrarBusqueda(query) {
  try {
    const data    = await obtenerPokemon(query.toLowerCase().trim());
    const pokemon = adaptarPokemon(data);
    mostrarResultado(pokemon);
  } catch {
    contenedor.innerHTML = `<p class="col-span-full text-center text-red-600">No se encontró "${query}".</p>`;
  }
}

// Carga más Pokémon desde la API con paginación
async function cargarMas() {
  const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=12&offset=${offset}`);
  const lista     = await respuesta.json();

  const datos = await Promise.all(
    lista.results.map(item => fetch(item.url).then(r => r.json()))
  );

  datos.map(adaptarPokemon).forEach(function (pokemon) {
    if (!pokedex.some(p => p.nombre === pokemon.nombre)) {
      pokedex.push(pokemon);
    }
  });

  offset += 12;
  render(pokedex);
}

// ── Carga inicial ─────────────────────────────────────────────────────────

// Spinner mientras llegan los datos
contenedor.innerHTML = `
  <div class="col-span-full flex justify-center py-10">
    <div class="w-10 h-10 border-4 border-slate-300 border-t-red-500 rounded-full animate-spin"></div>
  </div>
`;

async function cargarPokedex() {
  const nombres = ["bulbasaur", "charmander", "squirtle", "pikachu", "jigglypuff", "gengar"];
  const datos   = await Promise.all(nombres.map(obtenerPokemon));
  pokedex       = datos.map(adaptarPokemon);
  render(pokedex);
}

cargarPokedex();

// ── Eventos ───────────────────────────────────────────────────────────────

// Logro 1 — el input acepta nombre ("pikachu") o número ("25")
boton.addEventListener("click", function () {
  const query = buscador.value.trim();
  if (query !== "") mostrarBusqueda(query);
});

// Buscar también con Enter
buscador.addEventListener("keydown", function (event) {
  if (event.key === "Enter") boton.click();
});

// Cargar más Pokémon
document.getElementById("cargar-mas").addEventListener("click", cargarMas);                          
// ── Tema claro / oscuro ───────────────────────────────────────────────────
const btnTema = document.getElementById("btn-tema");

function actualizarBotonTema() {
  const esDark = document.documentElement.classList.contains("dark");
  btnTema.textContent = esDark ? "☀️ Modo claro" : "🌙 Modo oscuro";
}

btnTema.addEventListener("click", function () {
  document.documentElement.classList.toggle("dark");
  const esDark = document.documentElement.classList.contains("dark");
  localStorage.setItem("tema", esDark ? "oscuro" : "claro");  // recuerda la preferencia
  actualizarBotonTema();
});

actualizarBotonTema();  // ajusta el texto del botón al cargar
articulo.className = "bg-white dark:bg-slate-800 rounded-xl shadow p-4 text-center";