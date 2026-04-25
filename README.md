# Calculador de Costo de Menú

Este proyecto es una herramienta diseñada para gestionar y calcular el costo de recetas y menús, tomando en cuenta diferentes monedas (MT, CUP, USD) a partir de un listado de productos base almacenado en Excel. El proyecto incluye tanto una aplicación de escritorio local como una versión web.

## Estructura del Proyecto

El repositorio está compuesto por los siguientes componentes principales:

- **`excelcosto.py`**: Aplicación de escritorio desarrollada en Python usando la librería `tkinter` para la interfaz y `pandas` para el manejo de datos. Permite cargar un listado de productos, seleccionar ingredientes para armar un "menú libre" o receta, especificar cantidades y calcular el costo total, porcentaje en USD, y el costo por peso. También permite generar un reporte exportable en formato de texto.
- **`productos.xlsx`**: Archivo de Excel que actúa como base de datos de los productos, conteniendo código, descripción (producto), y los precios en diferentes monedas.
- **`update_data.py`**: Script de utilidad en Python que lee los datos de `productos.xlsx` y los exporta a un formato JSON (`costo-web/src/data.json`) para que puedan ser consumidos dinámicamente por la aplicación web.
- **`costo-web/`**: Directorio que contiene el código fuente de la aplicación web (frontend).
- **`package.json` / `vercel.json`**: Archivos de configuración para la construcción y despliegue de la versión web, preparados para plataformas como Vercel.

## Requisitos Previos

### Para la aplicación de escritorio y scripts de datos (Python)
- Python 3.x
- Librerías de Python: `pandas`, `openpyxl` (para leer archivos de Excel), `tkinter` (usualmente incluido por defecto en Python).

Puedes instalar las dependencias necesarias con:
```bash
pip install pandas openpyxl
```

### Para la aplicación web
- Node.js y npm instalados en el sistema.

## Cómo Usar

### 1. Aplicación de Escritorio
1. Asegúrate de que el archivo `productos.xlsx` esté en la misma carpeta y contenga los datos de los productos actualizados.
2. Ejecuta la aplicación de escritorio con el siguiente comando:
   ```bash
   python excelcosto.py
   ```
3. Utiliza la interfaz gráfica para seleccionar los productos, ingresar las cantidades necesarias y calcular los costos de tus platos.

### 2. Actualizar y Construir la Aplicación Web
Cuando modifiques el listado de productos en el archivo Excel y desees que estos cambios se reflejen en la versión web:

1. Ejecuta el script de actualización de datos para regenerar el archivo JSON:
   ```bash
   python update_data.py
   ```
2. Instala las dependencias y compila el proyecto web usando los scripts del `package.json` en la raíz:
   ```bash
   npm run install
   npm run build
   ```

## Flujo de Datos
El ciclo normal de trabajo consiste en mantener `productos.xlsx` como la fuente única de verdad para los precios y catálogos. Desde allí, `excelcosto.py` lo lee directamente para operaciones locales, y `update_data.py` sirve como puente para alimentar la base de datos estática de la interfaz web.
