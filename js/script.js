// ============================================
// SCRIPT PRINCIPAL DEL ECOMMERCE NIRVANA ZONE
// Maneja: carrito, productos, pagos, contacto,
// stock conectado a BD y menú responsive.
// ============================================


// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // ============================================
  // VARIABLES GLOBALES DEL CARRITO
  // ============================================
  let carrito = [];                 // Array donde se almacenan los productos seleccionados
  const CLAVE = "carritoNirvana";   // Nombre para guardar datos en LocalStorage

  // Cargar carrito desde LocalStorage
  function cargarCarrito() {
    const data = localStorage.getItem(CLAVE);
    carrito = data ? JSON.parse(data) : [];
  }

  // Guardar carrito en LocalStorage
  function guardarCarrito() {
    localStorage.setItem(CLAVE, JSON.stringify(carrito));
  }

  // Calcular total general
  function calcularTotal() {
    return carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  }

  // ============================================
  // A) AGREGAR PRODUCTOS (productos.html)
  // ============================================
  function prepararBotonesComprar() {
    const botones = document.querySelectorAll(".btn-comprar");

    botones.forEach((btn) => {
      btn.addEventListener("click", () => {

        // Extraemos la información del boton
        const nombre = btn.dataset.nombre;
        const precio = parseFloat(btn.dataset.precio);
        const imagen = btn.dataset.imagen || "img/producto_1.png";

        if (!nombre || isNaN(precio)) {
          alert("Error al agregar producto.");
          return;
        }

        // Buscar si ya existe en el carrito
        let producto = carrito.find((p) => p.nombre === nombre);

        // Si existe, automaticamente aumenta la cantidad
        if (producto) {
          producto.cantidad++;
        } else {
          carrito.push({
            nombre,
            precio,
            cantidad: 1,
            imagen,
          });
        }

        guardarCarrito();
        alert(`"${nombre}" agregado al carrito.`);
      });
    });
  }

  // ============================================
  // B) MOSTRAR Y MANEJAR CARRITO (carrito.html)
  // ============================================
  function prepararCarritoPage() {
    const contenedor = document.getElementById("carrito-contenido");
    const totalSpan = document.getElementById("total-carrito");
    const btnVaciar = document.getElementById("btn-vaciar");

    if (!contenedor) return; // solo en carrito.html

    contenedor.innerHTML = "";

    // Si está vacío
    if (carrito.length === 0) {
      contenedor.innerHTML = "<p>Tu carrito está vacío.</p>";
      totalSpan.textContent = "0.00";
      return;
    }

    // Render de cada producto
    carrito.forEach((p, i) => {
      const item = document.createElement("div");
      item.classList.add("carrito-item");

      // Tarjeta visual del producto
      item.innerHTML = `
                <img src="${p.imagen}" alt="${p.nombre}">
                <div class="carrito-info">
                    <h4>${p.nombre}</h4>
                    <p>Precio: S/ ${p.precio.toFixed(2)}</p>

                    <p>
                        <button class="btn-restar">-</button>
                        <span>Cantidad: ${p.cantidad}</span>
                        <button class="btn-sumar">+</button>
                    </p>

                    <p>Subtotal: S/ ${(p.precio * p.cantidad).toFixed(2)}</p>
                    <button class="btn-eliminar">Eliminar</button>
                </div>
            `;

      // Botón "+"
      item.querySelector(".btn-sumar").addEventListener("click", () => {
        carrito[i].cantidad++;
        guardarCarrito();
        prepararCarritoPage();
      });

      // Botón "-"
      item.querySelector(".btn-restar").addEventListener("click", () => {
        carrito[i].cantidad--;
        if (carrito[i].cantidad <= 0) carrito.splice(i, 1);
        guardarCarrito();
        prepararCarritoPage();
      });

      // Boton eliminar
      item.querySelector(".btn-eliminar").addEventListener("click", () => {
        carrito.splice(i, 1);
        guardarCarrito();
        prepararCarritoPage();
      });

      contenedor.appendChild(item);
    });

    // Actualizar total
    totalSpan.textContent = calcularTotal().toFixed(2);

    // Botón vaciar
    if (btnVaciar) {
      btnVaciar.onclick = () => {
        if (confirm("¿Deseas vaciar el carrito?")) {
          carrito = [];
          guardarCarrito();
          prepararCarritoPage();
        }
      };
    }
  }

  // ============================================
  // C) RESUMEN DEL PEDIDO (pago.html)
  // ============================================
  function prepararResumenPago() {
    const lista = document.getElementById("lista-resumen");
    const total = document.getElementById("total-resumen");

    if (!lista || !total) return;

    lista.innerHTML = "";

    if (carrito.length === 0) {
      lista.innerHTML = "<li>No hay productos en tu pedido.</li>";
      total.textContent = "0.00";
      return;
    }

    carrito.forEach((p) => {
      const li = document.createElement("li");
      li.innerHTML = `${p.nombre} (x${p.cantidad}) — S/ ${(
        p.precio * p.cantidad
      ).toFixed(2)}`;
      lista.appendChild(li);
    });

    total.textContent = calcularTotal().toFixed(2);
  }

  // ============================================
  // INTEGRACIÓN CON BASE DE DATOS
  // ============================================
  async function procesarCompraBD() {
    if (carrito.length === 0) {
      alert("El carrito está vacío.");
      return;
    }

    // Recorremos el carrito y enviamos cada producto al servidor
    for (let item of carrito) {
      try {
        const respuesta = await fetch("/api/comprar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: item.nombre,
            cantidad: item.cantidad,
          }),
        });

        if (!respuesta.ok) {
          const error = await respuesta.json();
          console.error(`Error con ${item.nombre}: ${error.mensaje}`);
        }
      } catch (error) {
        console.error("Error de conexión:", error);
      }
    }

    // Al finalizar todo:
    alert("¡Compra exitosa!");
    // Forzamos la actualización visual de la pagina web
    await cargarStockDesdeBD();
    carrito = []; // Vaciamos el carrito
    guardarCarrito(); // Actualizamos memoria
    await actualizarStockVisual();
    window.location.href = "index.html"; // Redirigimos al inicio
  }

  // ============================================
  // D) MÉTODOS DE PAGO DINÁMICOS (pago.html)
  // ============================================
  function prepararPago() {
    const select = document.getElementById("metodo-pago");
    const detalle = document.getElementById("pago-detalle");
    const btnConfirmar = document.getElementById("btn-confirmar");

    if (!select || !detalle) return;

    select.addEventListener("change", () => {
      const metodo = select.value;

      detalle.innerHTML = "";
      btnConfirmar.style.display = "none";

      // SWITCH -> cambia contenido dinámico
      switch (metodo) {
        case "tarjeta":
          detalle.innerHTML = `
                        <div class="pago-card">
                            <h4>Pago con tarjeta</h4>
                            <label>Número de tarjeta</label>
                            <input class="form-control" type="text" placeholder="1234 5678 9101 1121">
                            <label>Fecha de expiración</label>
                            <input class="form-control" type="text" placeholder="MM/AA">
                            <label>CVV</label>
                            <input class="form-control" type="password" placeholder="123">
                        </div>
                    `;
          btnConfirmar.style.display = "block";
          break;

        case "yape":
          detalle.innerHTML = `
                        <div class="pago-card">
                            <h4>Pagar con Yape / Plin</h4>
                            <p>Escanea el código QR para completar tu pago.</p>
                            <img src="img/qr.jpg" alt="QR" style="width:160px; border-radius:8px;">
                        </div>
                    `;
          btnConfirmar.style.display = "block";
          break;

        case "paypal":
          detalle.innerHTML = `
                        <div class="pago-card">
                            <h4>PayPal</h4>
                            <p>Serás redirigido a PayPal para completar el pago.</p>
                        </div>
                    `;
          btnConfirmar.style.display = "block";
          break;
      }
    });

    // CONFIRMAR COMPRA
    if (btnConfirmar) {
      btnConfirmar.addEventListener("click", (e) => {
        e.preventDefault(); // Evitamos recarga inmediata
        procesarCompraBD(); // Llamamos a la función de BD
      });
    }
  }

  // ============================================
  // E) FORMULARIO CONTACTO (contacto.html)
  // ============================================
  function prepararFormulario() {
    const form = document.getElementById("form-contacto");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nombre = form.nombre.value.trim();
      const correo = form.email.value.trim();
      const mensaje = form.mensaje.value.trim();

      // Validaciones
      const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]{3,}$/;
      if (!regexNombre.test(nombre)) {
        alert("Ingrese un nombre válido.");
        return;
      }

      const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regexCorreo.test(correo)) {
        alert("Ingrese un correo electrónico válido.");
        return;
      }

      if (mensaje.length < 10) {
        alert("El mensaje debe tener al menos 10 caracteres.");
        return;
      }

      alert("Gracias por tu mensaje. Te responderemos pronto.");
      form.reset();
    });
  }

  // ============================================
  // F) TEXTO DINÁMICO DEL INDEX
  // ============================================
  const frases = [
    "Ofrecemos teclados mecánicos y periféricos premium.",
    "PCs gamer con máximo rendimiento.",
    "Audio envolvente para una experiencia inmersiva.",
    "Potencia, diseño y estilo para tu setup.",
  ];

  let indice = 0;
  const textoDinamico = document.getElementById("texto-dinamico");

  if (textoDinamico) {
    setInterval(() => {
      textoDinamico.style.opacity = 0;
      setTimeout(() => {
        indice = (indice + 1) % frases.length;
        textoDinamico.textContent = frases[indice];
        textoDinamico.style.opacity = 1;
      }, 500);
    }, 3000);
  }

  // ============================================
  // FUNCIÓN PARA ACTUALIZAR STOCK VISUALMENTE
  // ============================================
  async function actualizarStockVisual() {
    try {
      // 1. Pedimos los datos frescos a la Base de Datos
      const respuesta = await fetch("/api/productos");

      if (respuesta.ok) {
        const productosBD = await respuesta.json();

        // 2. Recorremos los productos recibidos
        productosBD.forEach((prod) => {
          // Buscamos en el HTML el span que corresponde a este producto
          const elementoStock = document.querySelector(
            `.stock-real[data-nombre="${prod.nombre}"]`
          );

          if (elementoStock) {
            // 3. Actualizamos el número en pantalla
            if (prod.stock > 0) {
              elementoStock.textContent = prod.stock;
              elementoStock.style.color = "inherit"; // Color normal
            } else {
              elementoStock.textContent = "Agotado";
              elementoStock.style.color = "red";
            }
          }
        });
      }
    } catch (error) {
      console.error("Error al actualizar stock visual:", error);
    }
  }

  // ============================================
  // INICIALIZAR TODO
  // ============================================
  cargarCarrito();
  prepararBotonesComprar();
  prepararCarritoPage();
  prepararResumenPago();
  prepararPago();
  prepararFormulario();
  actualizarStockVisual();
});