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

const contenedor = document.getElementById("resultado");
const buscador   = document.getElementById("buscador");
const boton      = document.getElementById("btn-buscar");
const spinner    = document.getElementById("spinner");
const mensaje    = document.getElementById("mensaje");

let pokedex = [];
let offset  = 0;
let ultimaBusqueda = "";

async function obtenerPokemon(idONombre) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${idONombre}`);

  if (!response.ok) {                                  // 404, 500, etc.
    throw new Error(`No se encontró "${idONombre}"`);  // error personalizado
  }

  return response.json();
}

function adaptarPokemon(data) {
  return {
    nombre: data.name,
    imagen: data.sprites?.front_default ?? "https://via.placeholder.com/96?text=?",
    tipos:  data.types.map(t => t.type.name),
    stats:  data.stats.map(s => ({ nombre: s.stat.name, valor: s.base_stat }))
  };
}

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
  articulo.className = "bg-white dark:bg-slate-800 rounded-xl shadow p-4 text-center";
  articulo.innerHTML = `
    <img src="${img}" alt="${nombre}" class="w-24 h-24 mx-auto">
    <h2 class="capitalize font-bold text-slate-800 dark:text-slate-100 mt-2">${nombre}</h2>
    <div class="flex gap-1 justify-center mt-2 flex-wrap">${badges}</div>
  `;

  if (showQuitar) {
    const btnQuitar = document.createElement("button");
    btnQuitar.textContent = "✕ Quitar";
    btnQuitar.className = "mt-3 w-full text-xs bg-red-100 text-red-600 font-semibold rounded-lg py-1 hover:bg-red-200";
    btnQuitar.addEventListener("click", () => quitarPokemon(pokemon.nombre));
    articulo.appendChild(btnQuitar);
  }

  return articulo;
}

function render(lista) {
  contenedor.innerHTML = "";
  lista.forEach(function (pokemon) {
    const tarjeta = crearTarjeta(pokemon, true);
    contenedor.appendChild(tarjeta);
  });
}

function mostrarResultado(pokemon) {
  const tarjeta = crearTarjeta(pokemon);

  const stats = document.createElement("div");
  stats.className = "mt-2 text-left text-xs space-y-1";
  stats.innerHTML = pokemon.stats.map(s => `
    <div class="flex justify-between">
      <span class="capitalize text-slate-500">${s.nombre}</span>
      <span class="font-semibold">${s.valor}</span>
    </div>
  `).join("");
  tarjeta.appendChild(stats);

  const btnCapturar = document.createElement("button");
  btnCapturar.textContent = "⚡ Capturar";
  btnCapturar.className = "mt-2 w-full bg-yellow-400 font-semibold rounded-lg py-1 hover:bg-yellow-500";
  btnCapturar.addEventListener("click", () => capturar(pokemon));
  tarjeta.appendChild(btnCapturar);

  contenedor.innerHTML = "";
  contenedor.appendChild(tarjeta);
}

function capturar(pokemon) {
  if (!pokedex.some(p => p.nombre === pokemon.nombre)) {
    pokedex.push(pokemon);
  }
  render(pokedex);
  buscador.value = "";
}

function quitarPokemon(nombre) {
  pokedex = pokedex.filter(p => p.nombre !== nombre);
  render(pokedex);
}

async function mostrarBusqueda(query) {
  ultimaBusqueda = query;

  spinner.classList.remove("hidden");
  mensaje.classList.add("hidden");

  try {
    const data    = await obtenerPokemon(query.toLowerCase().trim());
    const pokemon = adaptarPokemon(data);
    mostrarResultado(pokemon);
  } catch (error) {
    mensaje.innerHTML = `
      ${error.message}
      <button id="btn-reintentar" class="ml-2 underline font-semibold hover:text-red-800">Reintentar</button>
    `;
    mensaje.classList.remove("hidden");

    document.getElementById("btn-reintentar").addEventListener("click", () => {
      mostrarBusqueda(ultimaBusqueda);
    });
  } finally {
    spinner.classList.add("hidden");
  }
}

async function cargarMas() {
  spinner.classList.remove("hidden");
  mensaje.classList.add("hidden");

  try {
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
  } catch (error) {
    mensaje.textContent = "No se pudieron cargar más Pokémon.";
    mensaje.classList.remove("hidden");
  } finally {
    spinner.classList.add("hidden");
  }
}

async function cargarPokedex() {
  spinner.classList.remove("hidden");
  try {
    const nombres = ["bulbasaur", "charmander", "squirtle", "pikachu", "jigglypuff", "gengar"];
    const datos   = await Promise.all(nombres.map(obtenerPokemon));
    pokedex       = datos.map(adaptarPokemon);
    render(pokedex);
  } catch (error) {
    mensaje.textContent = "No se pudo cargar la Pokédex.";
    mensaje.classList.remove("hidden");
  } finally {
    spinner.classList.add("hidden");
  }
}

cargarPokedex();

boton.addEventListener("click", function () {
  const query = buscador.value.trim();
  if (query !== "") mostrarBusqueda(query);
});

buscador.addEventListener("keydown", function (event) {
  if (event.key === "Enter") boton.click();
});

document.getElementById("cargar-mas").addEventListener("click", cargarMas);

const btnTema = document.getElementById("btn-tema");

function actualizarBotonTema() {
  const esDark = document.documentElement.classList.contains("dark");
  btnTema.textContent = esDark ? "☀️ Modo claro" : "🌙 Modo oscuro";
}

btnTema.addEventListener("click", function () {
  document.documentElement.classList.toggle("dark");
  const esDark = document.documentElement.classList.contains("dark");
  localStorage.setItem("tema", esDark ? "oscuro" : "claro");
  actualizarBotonTema();
});

actualizarBotonTema();