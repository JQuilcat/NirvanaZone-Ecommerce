// =====================================================
// SERVIDOR PRINCIPAL DEL PROYECTO
// =====================================================
// - Servir archivos HTML/CSS/JS
// - Recibir compras desde el frontend
// - Consultar y actualizar stock en MySQL
// =====================================================

const express = require("express");
// Importamos "Express", la librería que nos permite crear el servidor web de forma sencilla.

const path = require("path");
// Importamos "path", una herramienta de Node.js para manejar rutas de carpetas correctamente.

const db = require("./js/conexion");
// Importamos la conexión a la base de datos que creamos en la carpeta "js".

const app = express();
// Iniciamos la aplicación de Express. "app" es nuestro servidor.

const port = 3000;
// Definimos el puerto 3000 para que el servidor escuche.

app.use(express.json());
// Permite procesar JSON que viene desde fetch()

app.use(express.static(path.join(__dirname, ".")));
// Permite servir HTML, CSS, imágenes, JS, etc.

// ============================================
// RUTA 1: PROCESAR LA COMPRA (Recibe datos)
// ============================================
app.post("/api/comprar", async (req, res) => {
  // Creamos una ruta POST. El frontend enviará datos aquí para comprar. "async" permite esperar a la Base de Datos.

  const { nombre, cantidad } = req.body;
  // Recibimos el "nombre" y la "cantidad" que nos envió el carrito desde script.js.

  try {
 
    // 1. Verificar stock
    const [producto] = await db.query(
      "SELECT stock FROM productos WHERE nombre = ?",
      [nombre]
    );
    // Consultamos a la BD cuánto stock tiene el producto. 

    if (producto.length === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado en BD" });
    }

    if (producto[0].stock < cantidad) {
      return res
        .status(400)
        .json({ mensaje: `Stock insuficiente para ${nombre}` });
    }

    // 2. Actualiza stock
    await db.query("UPDATE productos SET stock = stock - ? WHERE nombre = ?", [
      cantidad,
      nombre,
    ]);
    // Ejecutamos la actualización en la BD: Stock actual menos la cantidad comprada.

    res.json({ mensaje: "Ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// ============================================
// RUTA 2: OBTENER EL STOCK ACTUAL (Envía datos)
// ============================================
app.get("/api/productos", async (req, res) => {
  // Creamos una ruta GET. El frontend la usará para pedir la lista de stocks actualizados.

  try {
    const [rows] = await db.query("SELECT nombre, stock FROM productos");
    // Pedimos a la BD el nombre y stock de TODOS los productos.

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener productos");
  }
});

// ============================================
// INICIAR EL SERVIDOR
// ============================================
app.listen(port, () => {
  // Encendemos el servidor en el puerto 3000.

  console.log(`NirvanaZone lista en: http://localhost:${port}/index.html`);
});
