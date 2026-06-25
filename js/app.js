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

// ── Estado global ─────────────────────────────────────────────────────────
let pokedex = [];  // aquí se guardan los Pokémon ya cargados de la API

// ── Funciones ─────────────────────────────────────────────────────────────

// Convierte la respuesta cruda de la API a la forma que usamos
function adaptarPokemon(data) {
  return {
    nombre: data.name,
    imagen: data.sprites?.front_default ?? "https://via.placeholder.com/96?text=?",
    tipos:  data.types.map(t => t.type.name)  // [{type:{name:"electric"}}] → ["electric"]
  };
}

// Crea y devuelve una tarjeta <article> para un Pokémon
function crearTarjeta(pokemon) {
  const { nombre, imagen, tipos } = pokemon;

  const img = imagen ?? "https://via.placeholder.com/96?text=?";

  const badges = tipos
    .map(function (tipo) {
      const clases = colorTipo[tipo] ?? "bg-slate-100 text-slate-600";  // color por defecto si el tipo no está en la lista
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
  return articulo;
}

// Limpia el contenedor y pinta la lista recibida
function render(lista) {
  contenedor.innerHTML = "";
  lista.forEach(function (pokemon) {
    const tarjeta = crearTarjeta(pokemon);
    contenedor.appendChild(tarjeta);
  });
}

// ── Carga desde la API ────────────────────────────────────────────────────
const nombres = ["bulbasaur", "charmander", "squirtle", "pikachu", "jigglypuff", "gengar"];

// Spinner animado mientras llegan los datos
contenedor.innerHTML = `
  <div class="col-span-full flex justify-center py-10">
    <div class="w-10 h-10 border-4 border-slate-300 border-t-red-500 rounded-full animate-spin"></div>
  </div>
`;

// Un fetch por cada nombre → array de promesas
const promesas = nombres.map(function (nombre) {
  return fetch(`https://pokeapi.co/api/v2/pokemon/${nombre}`).then(r => r.json());
});

Promise.all(promesas)
  .then(function (datos) {
    pokedex = datos.map(adaptarPokemon);
    render(pokedex);
  })
  .catch(function () {
    contenedor.innerHTML = `<p class="col-span-full text-center text-red-600">No se pudo cargar la Pokédex.</p>`;
  });
