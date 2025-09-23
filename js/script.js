// ARCHIVO INDEX.HTML
// Control del menú móvil
const burgerButton = document.querySelector('.main-header-burguer');
const mobileMenu = document.querySelector('.mobile-menu');

burgerButton.addEventListener('click', () => {
    burgerButton.classList.toggle('active');
    mobileMenu.classList.toggle('active');
});

// Cerrar menú al hacer clic en un enlace
const mobileLinks = document.querySelectorAll('.mobile-menu a');
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        burgerButton.classList.remove('active');
        mobileMenu.classList.remove('active');
    });
});

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!burgerButton.contains(e.target) && !mobileMenu.contains(e.target)) {
        burgerButton.classList.remove('active');
        mobileMenu.classList.remove('active');
    }
});


// ARCHIVO CONTACTO.HTML

function enviarEmail(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const mensaje = document.getElementById('mensaje').value;

    const templateParams = {
        to_email: 'tomasgonzalezhu.phreys12@gmail.com',
        from_name: nombre,
        from_email: email,
        message: mensaje
    };

    emailjs.send('service_uzlujse', 'template_9ck2bem', templateParams)
        .then(function(response) {
            alert('¡Mensaje enviado con éxito!');
            document.getElementById('contacto-form').reset();
        }, function(error) {
            alert('Error al enviar el mensaje. Por favor, intente nuevamente.');
            console.error('Error:', error);
        });

    return false;
}

// ARCHIVO CATALOGO.HTML

let productos = [];
let coloresGlobales = {};

// Función para cargar los productos desde el archivo JSON
async function cargarProductos() {
    try {
        const response = await fetch('./productos.json');
        const data = await response.json();
        coloresGlobales = data.colores || {};
        productos = data.productos;
        filtrarProductos(); // Filtrar productos después de cargarlos
    } catch (error) {
        console.error('Error al cargar los productos:', error);
    }
}

function obtenerFiltrosActivos() {
    const filtrosActivos = document.querySelectorAll('.filtro-item.activo');
    return Array.from(filtrosActivos).map(filtro => filtro.dataset.filtro);
}

function toggleFiltro(elemento) {
    elemento.classList.toggle('activo');
    filtrarProductos();
}

function filtrarProductos() {
    const filtrosActivos = obtenerFiltrosActivos();
    const grid = document.getElementById('productos-grid');
    grid.innerHTML = '';

    const productosFiltrados = productos.filter(producto => {
        if (filtrosActivos.length === 0) return true;
        return filtrosActivos.some(filtro => producto.tipos.includes(filtro));
    });

    productosFiltrados.forEach(producto => {
        const productoElement = document.createElement('div');
        productoElement.className = 'producto-card';
        productoElement.innerHTML = `
            <div class="stock-badge ${!producto.stock ? 'sin-stock' : ''}">
                ${!producto.stock ? 'Pedir por encargue' : 'En stock'}
            </div>
            <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>
            ${(producto.colores && producto.colores.length > 0) ? `
                <h4 style="margin: 0 0 2px 0; font-size: 1em; font-weight: bold; color: rgba(45, 93, 82); padding: 0 16px;">Colores disponibles</h4>
            ` : ''}
            <div class="colores-disponibles">
                ${(producto.colores || []).map(colorKey => {
                    const colorHex = coloresGlobales[colorKey];
                    return `<span class="color-circulo" style="background:${colorHex}"></span>`;
                }).join('')}
            </div>
            <p class="precio">$${producto.precio}</p>
            <button onclick="${!producto.stock ? `abrirEncargueWhatsapp(${producto.id})` : `event.stopPropagation(); agregarAlCarrito(${producto.id})`}" 
                    class="btn-agregar ${!producto.stock ? 'pedir-encargue' : ''}">
                ${!producto.stock ? 'Pedir por encargue' : 'Agregar al carrito'}
            </button>
        `;
        
        // Agregar evento click para mostrar el panel
        productoElement.addEventListener('click', () => mostrarPanelProducto(producto.id));
        
        grid.appendChild(productoElement);
    });
}

function activarFiltroPorHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        // Desactivar todos los filtros primero
        document.querySelectorAll('.filtro-item').forEach(filtro => {
            filtro.classList.remove('activo');
        });
        
        // Activar el filtro correspondiente al hash
        const filtroElement = document.querySelector(`.filtro-item[data-filtro="${hash}"]`);
        if (filtroElement) {
            filtroElement.classList.add('activo');
        }
    }
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const contador = document.getElementById('carrito-contador');
    contador.textContent = carrito.length;
}

function calcularTotalCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    return carrito.reduce((total, item) => total + item.precio, 0);
}

function actualizarPanelCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const panelItems = document.getElementById('carrito-panel-items');
    const totalElement = document.getElementById('carrito-panel-total');
    
    panelItems.innerHTML = '';
    let total = 0;
    let hayMate = false;
    let hayBombilla = false;

    carrito.forEach((item, index) => {
        // Verificar si hay mate y bombilla
        if (item.tipos.includes('mate')) hayMate = true;
        if (item.tipos.includes('bombilla')) hayBombilla = true;
        
        total += item.precio;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'carrito-panel-item';
        itemElement.innerHTML = `
            <img src="${item.imagen}" alt="${item.nombre}" loading="lazy">
            <div class="carrito-panel-item-info">
                <h3>${item.nombre}</h3>
                <p>$${item.precio}</p>
            </div>
            <button class="btn-eliminar" onclick="eliminarDelCarrito(${index})">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;
        panelItems.appendChild(itemElement);
    });

    // Aplicar descuento si hay mate y bombilla
    let descuento = 0;
    if (hayMate && hayBombilla) {
        descuento = total * 0.1;
        const descuentoElement = document.createElement('div');
        descuentoElement.className = 'carrito-panel-item descuento-item';
        descuentoElement.innerHTML = `
            <div class="carrito-panel-item-info">
                <h3>Descuento mate + bombilla (10% OFF)</h3>
            </div>
            <div class="descuento-valor">-$${descuento}</div>
        `;
        panelItems.appendChild(descuentoElement);
    }
    
    totalElement.textContent = total - descuento;
}

function eliminarDelCarrito(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    actualizarPanelCarrito();
    
    // Si el carrito está vacío, mostrar el total en 0 antes de cerrar el panel
    if (carrito.length === 0) {
        document.getElementById('carrito-panel-total').textContent = '0';
        cerrarCarrito();
    }
}

let modalTimeout;
let modalTimerInterval;
const MODAL_TIMER_DURATION = 5000; // 5 segundos
const MODAL_CIRCLE_LENGTH = 87.96; // Circunferencia del círculo SVG

function iniciarAnimacionCirculoModal() {
    const progress = document.getElementById('modal-timer-progress');
    if (!progress) return;
    progress.style.strokeDashoffset = MODAL_CIRCLE_LENGTH;
    let start = Date.now();
    if (modalTimerInterval) clearInterval(modalTimerInterval);
    modalTimerInterval = setInterval(() => {
        let elapsed = Date.now() - start;
        let percent = Math.min(elapsed / MODAL_TIMER_DURATION, 1);
        progress.style.strokeDashoffset = MODAL_CIRCLE_LENGTH * (1 - percent);
        if (percent >= 1) {
            clearInterval(modalTimerInterval);
        }
    }, 50);
}

function reiniciarModalTimer() {
    if (modalTimeout) clearTimeout(modalTimeout);
    if (modalTimerInterval) clearInterval(modalTimerInterval);
    iniciarAnimacionCirculoModal();
    modalTimeout = setTimeout(() => {
        cerrarModal();
    }, MODAL_TIMER_DURATION);
}

function mostrarModalCarrito(producto) {
    const modal = document.getElementById('carrito-modal');
    const modalContent = document.getElementById('carrito-modal-content');
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    let total = 0;
    let hayMate = false;
    let hayBombilla = false;

    // Mostrar todos los productos del carrito en el modal
    modalContent.innerHTML = carrito.map((item, index) => {
        if (item.tipos.includes('mate')) hayMate = true;
        if (item.tipos.includes('bombilla')) hayBombilla = true;
        total += item.precio;
        return `
            <div class="carrito-modal-item modal-item-unificado" style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                <img src="${item.imagen}" alt="${item.nombre}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 10px;" loading="lazy">
                <div style="flex: 1; text-align: left;">
                    <h3 style="margin: 0 0 5px 0; font-size: 16px;">${item.nombre}</h3>
                    <p style="margin: 0; font-size: 15px;">$${item.precio}</p>
                </div>
                <button class="btn-eliminar-modal" onclick="eliminarDelCarritoModal(${index})" style="background-color: #ff4444; border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-left: 8px;">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
        `;
    }).join('');

    // Aplicar descuento si hay mate y bombilla
    let descuento = 0;
    if (hayMate && hayBombilla) {
        descuento = Math.round(total * 0.1);
        modalContent.innerHTML += `
            <div class="carrito-modal-item descuento-item modal-item-unificado" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                <div style="flex: 1; text-align: left;">
                    <h3 style="margin: 0; font-size: 16px; color: #2d5d52;">Descuento mate + bombilla (10% OFF)</h3>
                </div>
                <div style="font-weight: bold; color: #2d5d52;">-$${descuento}</div>
            </div>
        `;
    }
    // Mostrar el total final
    modalContent.innerHTML += `
        <div class=\"carrito-modal-item modal-item-unificado total-modal-item\">
            <span class=\"total-modal-label\">Total:</span>
            <span class=\"total-modal-value\">$${total - descuento}</span>
        </div>
    `;

    modal.classList.add('active');
    document.getElementById('carrito-overlay').classList.add('active');

    reiniciarModalTimer();
}

function eliminarDelCarritoModal(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    // Si el carrito queda vacío, cerrar el modal
    if (carrito.length === 0) {
        cerrarModal();
    } else {
        // Volver a mostrar el modal actualizado y reiniciar el timeout
        mostrarModalCarrito({});
    }
}

function cerrarModal() {
    const modal = document.getElementById('carrito-modal');
    const overlay = document.getElementById('carrito-overlay');
    modal.classList.remove('active');
    overlay.classList.remove('active');
    if (modalTimeout) clearTimeout(modalTimeout);
    if (modalTimerInterval) clearInterval(modalTimerInterval);
    // Resetear círculo
    const progress = document.getElementById('modal-timer-progress');
    if (progress) progress.style.strokeDashoffset = MODAL_CIRCLE_LENGTH;
}

function mostrarPanelCarrito() {
    const panel = document.getElementById('carrito-panel');
    const overlay = document.getElementById('carrito-overlay');
    panel.classList.add('active');
    overlay.classList.add('active');
    actualizarPanelCarrito();
}

function cerrarCarrito() {
    const panel = document.getElementById('carrito-panel');
    const overlay = document.getElementById('carrito-overlay');
    panel.classList.remove('active');
    overlay.classList.remove('active');
    
    // Limpiar el contenido del panel
    document.getElementById('carrito-panel-items').innerHTML = '';
    document.getElementById('carrito-panel-total').textContent = '0';
}

function agregarAlCarrito(id) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const producto = productos.find(p => p.id === id);
    
    if (producto) {
        carrito.push(producto);
        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        mostrarCarritoFlotante();
        
        // Mostrar panel o modal según el tamaño de la pantalla
        if (window.innerWidth > 768) {
            mostrarPanelCarrito();
        } else {
            mostrarModalCarrito(producto);
        }
    }
}

function mostrarCarritoFlotante() {
    const carritoFlotante = document.getElementById('carrito-flotante');
    carritoFlotante.classList.add('visible');
}

// Agregar event listeners para cerrar el panel
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos(); // Cargar productos al iniciar
    document.getElementById('carrito-panel-close').addEventListener('click', cerrarCarrito);
    document.getElementById('carrito-modal-close').addEventListener('click', cerrarModal);
    document.getElementById('carrito-overlay').addEventListener('click', () => {
        if (window.innerWidth > 768) {
            cerrarCarrito();
        } else {
            cerrarModal();
        }
    });

    // Event listeners para el panel de producto
    document.getElementById('producto-panel-close').addEventListener('click', cerrarPanelProducto);
    document.getElementById('producto-panel-overlay').addEventListener('click', cerrarPanelProducto);

    // Interacción dentro del modal reinicia el temporizador
    document.getElementById('carrito-modal').addEventListener('mousedown', (e) => {
        // Solo reiniciar si el modal está activo y el click no es en el overlay
        if (window.innerWidth <= 768 && document.getElementById('carrito-modal').classList.contains('active')) {
            reiniciarModalTimer();
        }
    });

    // Resto del código existente
    activarFiltroPorHash();
    filtrarProductos();
    
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length > 0) {
        mostrarCarritoFlotante();
    }
    actualizarContadorCarrito();
});

// Escuchar cambios en el hash de la URL
window.addEventListener('hashchange', () => {
    activarFiltroPorHash();
    filtrarProductos();
});


// Panel de producto
function mostrarPanelProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    const panel = document.getElementById('producto-panel');
    const overlay = document.getElementById('producto-panel-overlay');
    const mainImage = document.getElementById('producto-panel-main-image');
    const thumbnails = document.getElementById('producto-panel-thumbnails');
    const nombre = document.getElementById('producto-panel-nombre');
    const descripcion = document.getElementById('producto-panel-descripcion');
    const precio = document.getElementById('producto-panel-precio');
    const btnComprar = document.getElementById('btn-comprar-ahora');
    const btnAgregar = document.getElementById('btn-agregar-panel');

    // Actualizar contenido
    nombre.textContent = producto.nombre;
    descripcion.textContent = producto.descripcion;
    precio.textContent = `$${producto.precio}`;

    // Configurar imágenes
    const todasLasFotos = [producto.imagen, ...producto.fotosExtras].filter(Boolean);
    mainImage.src = todasLasFotos[0];
    mainImage.alt = producto.nombre;

    // Limpiar y agregar miniaturas
    thumbnails.innerHTML = '';
    todasLasFotos.forEach((foto, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = foto;
        thumbnail.alt = `${producto.nombre} - Vista ${index + 1}`;
        thumbnail.className = 'producto-panel-thumbnail' + (index === 0 ? ' active' : '');
        thumbnail.onclick = () => {
            mainImage.src = foto;
            document.querySelectorAll('.producto-panel-thumbnail').forEach(thumb => {
                thumb.classList.remove('active');
            });
            thumbnail.classList.add('active');
        };
        thumbnails.appendChild(thumbnail);
    });

    // Configurar botones
    if (!producto.stock) {
        btnComprar.onclick = () => {
            abrirEncargueWhatsapp(producto.id);
        };
    } else {
        btnComprar.onclick = () => {
            const mensaje = `Hola, me gustaría comprar el siguiente producto:\n\n${producto.nombre}\nPrecio: $${producto.precio}`;
            window.open(`https://wa.me/5491125129852?text=${encodeURIComponent(mensaje)}`, '_blank');
        };
    }

    btnAgregar.onclick = () => {
        agregarAlCarrito(producto.id);
        cerrarPanelProducto();
    };

    // Deshabilitar botones si no hay stock
    if (!producto.stock) {
        btnComprar.disabled = false;
        btnComprar.style.backgroundColor = '';
        btnComprar.style.cursor = '';
        btnComprar.textContent = 'Pedir por encargue';
        
        btnAgregar.disabled = true;
        btnAgregar.style.backgroundColor = '#ccc';
        btnAgregar.style.cursor = 'not-allowed';
        btnAgregar.textContent = 'No disponible';
    } else {
        btnComprar.disabled = false;
        btnComprar.style.backgroundColor = '';
        btnComprar.style.cursor = '';
        btnComprar.textContent = 'Comprar Ahora';
        
        btnAgregar.disabled = false;
        btnAgregar.style.backgroundColor = '';
        btnAgregar.style.cursor = '';
        btnAgregar.textContent = 'Agregar al Carrito';
    }

    // Mostrar panel
    panel.classList.add('active');
    overlay.classList.add('active');
}

function cerrarPanelProducto() {
    const panel = document.getElementById('producto-panel');
    const overlay = document.getElementById('producto-panel-overlay');
    panel.classList.remove('active');
    overlay.classList.remove('active');
}

function abrirEncargueWhatsapp(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    
    const mensaje = `Hola, no tenés el producto *${producto.nombre}* en stock, pero quisiera encargártelo.`;
    const numero = "+5491130548207";
    const whatsappUrl = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
}

// ARCHIVO CARRITO.HTML

let productosData = [];
let descuento = 0; // Variable global para el descuento

// Cargar productos.json al iniciar
fetch('../productos.json')
    .then(res => res.json())
    .then(data => { productosData = data.productos; });

function cargarCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const contenedor = document.getElementById('carrito-items');
    const grabadoOpciones = document.getElementById('grabado-opciones');
    const grabadoMensaje = document.getElementById('grabado-mensaje');
    
    contenedor.innerHTML = '';
    grabadoOpciones.innerHTML = '';
    
    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <p>Tu carrito está vacío</p>
            <a href="./catalogo.html" class="btn-comprar">Comprar Ahora</a>
        `;
        grabadoOpciones.style.display = 'none';
        grabadoMensaje.innerHTML = '';
        document.getElementById('total-precio').textContent = '0';
        descuento = 0; 
        return;
    }

    let hayProductosAptos = false;
    let total = 0;
    let hayMate = false;
    let hayBombilla = false;

    carrito.forEach((item, index) => {
        if (item.aptoParaGrabado === true) {
            hayProductosAptos = true;
        }
        if (item.tipos.includes('mate')) hayMate = true;
        if (item.tipos.includes('bombilla')) hayBombilla = true;
        total += item.precio;
        const itemElement = document.createElement('div');
        itemElement.className = 'carrito-item';
        itemElement.innerHTML = `
            <img src="${item.imagen}" alt="${item.nombre}" loading="lazy" onclick="ampliarImagenCarrito('${item.imagen}', '${item.nombre}')">
            <div class="item-details">
                <h3>${item.nombre}</h3>
                <p>$${item.precio}</p>
            </div>
            <button class="btn-eliminar-cart" onclick="eliminarDelCarrito(${index})">Eliminar</button>
        `;
        contenedor.appendChild(itemElement);
    });

    // Aplicar descuento si hay mate y bombilla
    descuento = 0; 
    if (hayMate && hayBombilla) {
        descuento = Math.round(total * 0.1);
        const descuentoElement = document.createElement('div');
        descuentoElement.className = 'carrito-item descuento-item';
        descuentoElement.innerHTML = `
            <div class="item-details">
                <h3>Descuento mate + bombilla (10% OFF)</h3>
            </div>
            <div class="descuento-valor">-$${descuento}</div>
        `;
        contenedor.appendChild(descuentoElement);
    }

    // Mostrar el total con descuento aplicado
    document.getElementById('total-precio').textContent = total - descuento;

    if (hayProductosAptos) {
        grabadoOpciones.style.display = 'block';
        grabadoMensaje.innerHTML = '';
        
        // Crear opciones de grabado solo para productos aptos
        carrito.forEach((item, index) => {
            if (item.aptoParaGrabado === true) {
                const grabadoOpcion = document.createElement('div');
                grabadoOpcion.className = 'grabado-opcion';
                grabadoOpcion.innerHTML = `
                    <label>
                        <input type="checkbox" id="grabado-${index}" onchange="actualizarTotal()">
                        Agregar grabado láser en ${item.nombre} (+$20.000)
                    </label>
                `;
                grabadoOpciones.appendChild(grabadoOpcion);
            }
        });
    } else {
        grabadoOpciones.style.display = 'none';
        grabadoMensaje.innerHTML = '<p class="mensaje-no-grabado">Los productos seleccionados no son aptos para grabado láser</p>';
    }
    actualizarTotal();
}

function actualizarTotal() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalElement = document.getElementById('total-precio');
    
    let total = carrito.reduce((sum, item) => sum + item.precio, 0);
    
    // Sumar el costo de cada grabado seleccionado solo para productos aptos
    carrito.forEach((item, index) => {
        if (item.aptoParaGrabado === true) {
            const checkbox = document.getElementById(`grabado-${index}`);
            if (checkbox && checkbox.checked) {
                total += 20000;
            }
        }
    });
    
    totalElement.textContent = total - descuento;
}

function eliminarDelCarrito(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    cargarCarrito();
}

function enviarPedidoWhatsApp() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    let mensaje = "¡Hola! Quiero realizar el siguiente pedido:\n\n";
    
    carrito.forEach((item, index) => {
        mensaje += `- ${item.nombre}: $${item.precio}\n`;
        if (item.aptoParaGrabado === true) {
            const checkbox = document.getElementById(`grabado-${index}`);
            if (checkbox && checkbox.checked) {
                mensaje += `  * Con grabado láser (+$20.000)\n`;
            }
        }
    });
    
    mensaje += `\nTotal (estimado): $${document.getElementById('total-precio').textContent}`;
    const numero = "+5491130548207";
    const whatsappUrl = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
}

document.addEventListener('DOMContentLoaded', cargarCarrito);


// Modal para ampliar imagen del carrito con slider
function ampliarImagenCarrito(src, alt) {
    // Buscar el producto en productosData
    let producto = productosData.find(p => p.imagen === src || p.nombre === alt);
    if (!producto) {
        // fallback: solo mostrar la imagen clickeada
        producto = { imagen: src, fotosExtras: [] };
    }
    const imagenes = [producto.imagen, ...(producto.fotosExtras || [])].filter(Boolean);
    let actual = imagenes.indexOf(src);
    if (actual === -1) actual = 0;

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-imagen-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) cerrarModalImagenCarrito(); };

    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal-imagen';

    // Botón cerrar
    const btnCerrar = document.createElement('button');
    btnCerrar.className = 'modal-imagen-cerrar';
    btnCerrar.innerHTML = '&times;';
    btnCerrar.onclick = cerrarModalImagenCarrito;

    // Flechas SVG lindas
    function flechaSVG(direccion) {
        if (direccion === 'izq') {
            return `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
        } else {
            return `<svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>`;
        }
    }
    const btnPrev = document.createElement('button');
    btnPrev.className = 'modal-imagen-flecha izq';
    btnPrev.innerHTML = flechaSVG('izq');
    btnPrev.onclick = (e) => { e.stopPropagation(); cambiar(-1); };

    const btnNext = document.createElement('button');
    btnNext.className = 'modal-imagen-flecha der';
    btnNext.innerHTML = flechaSVG('der');
    btnNext.onclick = (e) => { e.stopPropagation(); cambiar(1); };

    // Imagen
    const img = document.createElement('img');
    function renderImg() {
        img.src = imagenes[actual];
        img.alt = alt;
    }
    renderImg();

    // Slider logic
    function cambiar(dir) {
        actual = (actual + dir + imagenes.length) % imagenes.length;
        renderImg();
    }

    // Navegación con teclado
    function keyHandler(e) {
        if (e.key === 'ArrowLeft') cambiar(-1);
        if (e.key === 'ArrowRight') cambiar(1);
        if (e.key === 'Escape') cerrarModalImagenCarrito();
    }
    setTimeout(() => document.addEventListener('keydown', keyHandler), 10);

    // Armar modal
    modal.appendChild(btnCerrar);
    if (imagenes.length > 1) modal.appendChild(btnPrev);
    modal.appendChild(img);
    if (imagenes.length > 1) modal.appendChild(btnNext);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Guardar referencia para cerrar y limpiar event
    window._cerrarModalImagenCarrito = () => {
        document.removeEventListener('keydown', keyHandler);
        cerrarModalImagenCarrito();
    };
}
function cerrarModalImagenCarrito() {
    const overlay = document.querySelector('.modal-imagen-overlay');
    if (overlay) overlay.remove();
    if (window._cerrarModalImagenCarrito) {
        document.removeEventListener('keydown', window._cerrarModalImagenCarrito);
        window._cerrarModalImagenCarrito = null;
    }
}
