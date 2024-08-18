// Variable para almacenar la DB una vez creada
let DB

// Campos del formulario
const mascotaInput = document.querySelector("#mascota")
const propietarioInput = document.querySelector("#propietario")
const telefonoInput = document.querySelector("#telefono")
const fechaInput = document.querySelector("#fecha")
const horaInput = document.querySelector("#hora")
const sintomasInput = document.querySelector("#sintomas")

// UI
const formulario = document.querySelector('#nueva-cita')
const contenedorCitas = document.querySelector('#citas')

let editando

// Classes
class Citas {
    constructor() {
        this.citas = []
    }

    agregarCita(cita) {
        this.citas = [...this.citas, cita]
    }

    eliminarCita(id) {
        this.citas = this.citas.filter(cita => cita.id !== id)
    }

    editarCita(citaEditada) {
        this.citas = this.citas.map(cita => cita.id == citaEditada.id ? citaEditada : cita)
    }

}

class UI {
    // crear div con mesaje de exito o fallo
    imprimirAlerta(mensaje, tipo) {

        const divMensaje = document.createElement('div')
        divMensaje.classList.add('text-center', 'alert', 'd-block', 'col-12')
        if (tipo === 'error') {
            divMensaje.classList.add('alert-danger')
        } else {
            divMensaje.classList.add('alert-success')
        }

        divMensaje.textContent = mensaje

        // Agregar al DOM
        document.querySelector('#contenido').insertBefore(divMensaje, document.querySelector('.agregar-cita'))

        // Quitar la alerta tras 4 segundos
        setTimeout(() => {
            divMensaje.remove()
        }, 4000)
    }
    // imprimir citas en el DOM
    imprimirCitas() {

        this.limpiarHTML()

        // Leer contenido de la BBDD
        const objectStore = DB.transaction('citas').objectStore('citas')

        objectStore.openCursor().onsuccess = (e) => { // este metodo cursor se encarga de ir iterando sobre las citas sin necesidad de hacer un foreach
            const cursor = e.target.result
            if (cursor) {
                const { id, mascota, propietario, telefono, fecha, hora, sintomas } = cursor.value

                const divCita = document.createElement('div')
                divCita.classList.add('cita', 'p-3')
                divCita.dataset.id = id

                // Scripting de los elementos de la cita
                const mascotaParrafo = document.createElement('h2')
                mascotaParrafo.classList.add('card-title', 'font-weight-bolder')
                mascotaParrafo.textContent = mascota

                const propietarioParrafo = document.createElement('p')
                propietarioParrafo.innerHTML = `
            <span class="font-weight-bolder">Propietario: </span> ${propietario}
            `

                const telefonoParrafo = document.createElement('p')
                telefonoParrafo.innerHTML = `<span class="font-weight-bolder">Teléfono: </span> ${telefono}`
                const fechaParrafo = document.createElement('p')
                fechaParrafo.innerHTML = `<span class="font-weight-bolder">Fecha: </span> ${fecha}`

                const horaParrafo = document.createElement('p')
                horaParrafo.innerHTML = `<span class="font-weight-bolder">Hora: </span> ${hora}`

                const sintomasParrafo = document.createElement('p')
                sintomasParrafo.innerHTML = `<span class="font-weight-bolder">Síntomas: </span> ${sintomas}`

                // Botón para eliminar cita
                const btnEliminar = document.createElement('button')
                btnEliminar.classList.add('btn', 'btn-danger', 'mr-2')
                btnEliminar.innerHTML = 'Eliminar';

                btnEliminar.onclick = () => eliminarCita(id)

                // Botón actualizar cita
                const btnEditar = document.createElement('button')
                btnEditar.classList.add('btn', 'btn-info', 'mr-2')
                btnEditar.innerHTML = "Editar"
                const cita = cursor.value

                btnEditar.onclick = () => cargarEdicion(cita)

                // Agregar los parrafos al div
                divCita.appendChild(mascotaParrafo)
                divCita.appendChild(propietarioParrafo)
                divCita.appendChild(telefonoParrafo)
                divCita.appendChild(fechaParrafo)
                divCita.appendChild(horaParrafo)
                divCita.appendChild(sintomasParrafo)
                divCita.appendChild(btnEliminar)
                divCita.appendChild(btnEditar)

                // Agregar cita al HTML
                contenedorCitas.appendChild(divCita)

                // Pasar al siguiente elemento con un iterador
                cursor.continue()
            }
        }

    }

    limpiarHTML() {
        while (contenedorCitas.firstChild) {
            contenedorCitas.removeChild(contenedorCitas.firstChild)
        }
    }
}

// Instancias de clases
const ui = new UI()
const adminCitas = new Citas()

// Llamamos a los eventos cuando se carga la pagina:
window.onload = () => {
    eventListeners()
    crearDB()
}

// registrar Eventos
function eventListeners() {
    mascotaInput.addEventListener('input', datosCita)
    propietarioInput.addEventListener('input', datosCita)
    telefonoInput.addEventListener('input', datosCita)
    fechaInput.addEventListener('input', datosCita)
    horaInput.addEventListener('input', datosCita)
    sintomasInput.addEventListener('input', datosCita)

    formulario.addEventListener('submit', nuevaCita)
}

// Objeto con la info de la cita
const citaObj = {
    id: '',
    mascota: '',
    propietario: '',
    telefono: '',
    fecha: '',
    hora: '',
    sintomas: ''
}

// Agrega datos al objeto de cita
function datosCita(e) {
    citaObj[e.target.name] = e.target.value
}

// Valida y agrega una nueva cita
function nuevaCita(e) {
    e.preventDefault()

    // Extraer info del objeto de cita
    const { mascota, propietario, telefono, fecha, hora, sintomas } = citaObj

    // Validar datos
    if (mascota === '' || propietario === '' || telefono === '' || fecha === '' || hora === '' || sintomas === '') {
        ui.imprimirAlerta('todos los campos son obligatorios', 'error')
        return
    }

    // Validar si es editando o nueva cita

    if (editando) {

        // Pasar el objeto de la cita a edición 
        adminCitas.editarCita({ ...citaObj })

        // Edita en IndexDB
        const transaction = DB.transaction(['citas'], 'readwrite')
        const objectStore = transaction.objectStore('citas')

        objectStore.put(citaObj)

        transaction.oncomplete = () => {

            // Agregar mensaje
            ui.imprimirAlerta("Cita editada correctamente")

            // Retornar al valor original del boton de submit
            formulario.querySelector('button[type="submit"]').textContent = "Crear cita"

            // retornar la variable editanto a false
            editando = false
        }

    } else {

        // Agregar id a la cita
        citaObj.id = Date.now()

        // Agregar cita
        adminCitas.agregarCita({ ...citaObj }) // hay que sacar una copia, ya que si le pasamos el valor global no nos duplica el objeto n vecesen el array this.citas

        // Insertar cita (nuevo registro) en DB
        const transaction = DB.transaction(['citas'], 'readwrite')

        // habilitar el object store
        const objectStore = transaction.objectStore('citas')

        // Insertar el objeto en DB
        objectStore.add(citaObj)

        // Se ejecuta si ha ido todo bien
        transaction.oncomplete = () => {
            // Agregar mensaje
            ui.imprimirAlerta("Cita agregada correctamente")
        }

    }

    // Vaciar formulario
    formulario.reset()

    //Reiniciar objeto
    reiniciarObjeto()

    // Mostrar citas en HTML
    ui.imprimirCitas()

}

// Reiniciar el objeto, es decir citaObj a pesar de que se queda vacío el formulario, el objeto se queda en memoria y si agregamos nueva cita aunque sea con el formulario vacío, nos agrega la misma cita
function reiniciarObjeto() {
    citaObj.id = ""
    citaObj.mascota = ""
    citaObj.propietario = ""
    citaObj.telefono = ""
    citaObj.fecha = ""
    citaObj.hora = ""
    citaObj.sintomas = ""

}

function eliminarCita(id) {

    // Eliminar cita
    const transaction = DB.transaction(['citas'], 'readwrite')
    const objectStore = transaction.objectStore('citas')
    objectStore.delete(id)

    transaction.oncomplete = () => {
        // mostrar mensaje
        ui.imprimirAlerta('La cita se ha eliminado correctamente')
        // Refrescar las citas
        ui.imprimirCitas()
    }

    transaction.onerror = () => {
        console.log("hubo un error durante el proceso de eliminación")
    }

}

function cargarEdicion(cita) {
    const { id, mascota, propietario, telefono, fecha, hora, sintomas } = cita

    // LLenar los inputs
    mascotaInput.value = mascota
    propietarioInput.value = propietario
    telefonoInput.value = telefono
    fechaInput.value = fecha
    horaInput.value = hora
    sintomasInput.value = sintomas

    // LLenar el objeto
    citaObj.id = id
    citaObj.mascota = mascota
    citaObj.propietario = propietario
    citaObj.telefono = telefono
    citaObj.fecha = fecha
    citaObj.hora = hora
    citaObj.sintomas = sintomas


    // cambiar el texto del boton de submit
    formulario.querySelector('button[type="submit"]').textContent = "Guardar cambios"

    editando = true

}

function crearDB() {

    // Crear db en v1.0
    const crearDB = window.indexedDB.open('citas', 1)

    // Si hay un error en la creación
    crearDB.onerror = () => {
        console.log("Hubo un error")
    }

    // Si todo ha ido bien en la creación
    crearDB.onsuccess = () => {
        console.log("Base de datos creada")
        DB = crearDB.result // almacenamos en DB la base de datos creada

        ui.imprimirCitas() // llamamos a imprimir citas cuando se cargue la pagina y la ddbb está lista
    }

    // Definir schema de BBDD
    crearDB.onupgradeneeded = (e) => {

        //Almacenamos en db una instancia de la db
        const db = e.target.result

        // Creamos el ObjectStore, le pasamos la bbdd donde la creamos y un objeto con la configuracion del keyPath o índice
        const objectStore = db.createObjectStore('citas', {
            keyPath: "id",
            autoIncrement: true
        })

        // Definir las columnas de la db
        objectStore.createIndex('mascota', 'mascota', { unique: false })
        objectStore.createIndex('propietario', 'propietario', { unique: false })
        objectStore.createIndex('telefono', 'telefono', { unique: false })
        objectStore.createIndex('fecha', 'fecha', { unique: false })
        objectStore.createIndex('hora', 'hora', { unique: false })
        objectStore.createIndex('sintomas', 'sintomas', { unique: false })
        objectStore.createIndex('id', 'id', { unique: true })

        console.log("db creada y lista")
    }
}