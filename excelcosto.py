import pandas as pd
import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import os

class MenuCostApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Calculador de Costo de Menú")
        self.root.geometry("1200x600")

        # Variables
        self.costo_total = 0.0
        self.df_productos = None
        self.archivo_excel = "productos.xlsx"  # Cambia por la ruta de tu archivo
        self.modo = 'libre'  # Solo 'libre' (menú libre)
        self.items_libre = []  # Lista de items para modo libre: cada item es (codigo, producto, precio, cantidad, costo_racion)

        # Greeting
        messagebox.showinfo("Bienvenido", "¡Bienvenido al Calculador de Costo de Menú!\n\nSe utilizará el modo de cálculo: Menú Libre\n(puede especificar cantidad para cada producto)")

        # Cargar datos del Excel
        self.cargar_datos()

        # Preguntar al usuario el modo de cálculo
        self.preguntar_modo()

        # Crear interfaz
        self.crear_widgets()

    def cargar_datos(self):
        """Carga el archivo Excel en un DataFrame."""
        if not os.path.exists(self.archivo_excel):
            messagebox.showerror("Error", f"No se encontró el archivo: {self.archivo_excel}")
            self.root.quit()
            return
        try:
            self.df_productos = pd.read_excel(self.archivo_excel)
            # Mapear los nombres de columnas originales a nombres limpios
            # Los nombres en el Excel tienen espacios al final
            columnas_originales = self.df_productos.columns.tolist()
            mapeo = {}
            for col in columnas_originales:
                col_limpio = col.strip()
                if 'digo' in col_limpio.lower():
                    mapeo[col] = 'Código'
                elif 'descrip' in col_limpio.lower():
                    mapeo[col] = 'Producto'
                elif 'precio mt' in col_limpio.lower() or col_limpio == 'Precio':
                    mapeo[col] = 'Precio'
                elif 'cup' in col_limpio.lower():
                    mapeo[col] = 'Precio_CUP'
                elif 'usd' in col_limpio.lower():
                    mapeo[col] = 'Precio_USD'
            
            self.df_productos = self.df_productos.rename(columns=mapeo)
            # Seleccionar solo las columnas que necesitamos
            self.df_productos = self.df_productos[['Código', 'Producto', 'Precio', 'Precio_CUP', 'Precio_USD']]
            # Agregar columnas por defecto
            self.df_productos['Cantidad'] = 1
            self.df_productos['Costo_racion'] = 0
            # Limpiar valores NaN en columnas numéricas
            self.df_productos['Precio_CUP'] = self.df_productos['Precio_CUP'].fillna(0)
            self.df_productos['Precio_USD'] = self.df_productos['Precio_USD'].fillna(0)
        except Exception as e:
            messagebox.showerror("Error", f"Error al leer el archivo: {e}")
            self.root.quit()
            return

    def preguntar_modo(self):
        """Establece el modo de cálculo a menú libre (único modo disponible)."""
        self.modo = 'libre'
        messagebox.showinfo(
            "Modo de cálculo",
            "Se utilizará el modo de cálculo: Menú Libre\n"
            "(puede especificar cantidad para cada producto)"
        )

    def crear_widgets(self):
        # Frame izquierdo: lista de productos
        left_frame = ttk.Frame(self.root, padding="10")
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        ttk.Label(left_frame, text="Productos disponibles (selecciona múltiples con Ctrl+clic)").pack()

        # Treeview con scrollbar para productos
        tree_frame = ttk.Frame(left_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(tree_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.tree_productos = ttk.Treeview(tree_frame, 
                                            columns=('Código', 'Producto', 'Precio', 'Precio_CUP', 'Precio_USD', 'Cantidad', 'Costo_racion'),
                                            show='headings',
                                            yscrollcommand=scrollbar.set,
                                            selectmode='extended')  # Selección múltiple
        scrollbar.config(command=self.tree_productos.yview)

        # Definir encabezados
        self.tree_productos.heading('Código', text='Código')
        self.tree_productos.heading('Producto', text='Producto')
        self.tree_productos.heading('Precio', text='Precio MT')
        self.tree_productos.heading('Precio_CUP', text='Precio CUP')
        self.tree_productos.heading('Precio_USD', text='Precio USD')
        self.tree_productos.heading('Cantidad', text='Cantidad')
        self.tree_productos.heading('Costo_racion', text='Costo ración')

        # Ajustar anchos
        self.tree_productos.column('Código', width=80)
        self.tree_productos.column('Producto', width=180)
        self.tree_productos.column('Precio', width=80)
        self.tree_productos.column('Precio_CUP', width=80)
        self.tree_productos.column('Precio_USD', width=80)
        self.tree_productos.column('Cantidad', width=80)
        self.tree_productos.column('Costo_racion', width=100)

        self.tree_productos.pack(fill=tk.BOTH, expand=True)

        # Cargar datos en el treeview
        self.cargar_treeview()

        # Botón para procesar selección
        btn_procesar = ttk.Button(left_frame, text="Procesar selección", command=self.procesar_seleccion)
        btn_procesar.pack(pady=10)

        # Frame derecho: resumen
        right_frame = ttk.Frame(self.root, padding="10")
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        ttk.Label(right_frame, text="Productos seleccionados").pack()

        # Treeview para el menú o plato libre
        self.tree_menu = ttk.Treeview(right_frame,
                                       columns=('Código', 'Producto', 'Precio', 'Precio_CUP', 'Precio_USD', 'Cantidad', 'Costo_racion'),
                                       show='headings',
                                       height=10)
        self.tree_menu.heading('Código', text='Código')
        self.tree_menu.heading('Producto', text='Producto')
        self.tree_menu.heading('Precio', text='Precio MT')
        self.tree_menu.heading('Precio_CUP', text='Precio CUP')
        self.tree_menu.heading('Precio_USD', text='Precio USD')
        self.tree_menu.heading('Cantidad', text='Cantidad')
        self.tree_menu.heading('Costo_racion', text='Costo ración')
        self.tree_menu.column('Código', width=80)
        self.tree_menu.column('Producto', width=150)
        self.tree_menu.column('Precio', width=70)
        self.tree_menu.column('Precio_CUP', width=70)
        self.tree_menu.column('Precio_USD', width=70)
        self.tree_menu.column('Cantidad', width=70)
        self.tree_menu.column('Costo_racion', width=80)
        self.tree_menu.pack(fill=tk.BOTH, expand=True)

        # Etiqueta para mostrar el costo total
        self.lbl_costo_total = ttk.Label(right_frame, text="Costo total: $0.00", font=('Arial', 12, 'bold'))
        self.lbl_costo_total.pack(pady=10)

        # Botón para calcular costo por peso
        btn_calcular = ttk.Button(right_frame, text="Calcular costo por peso", command=self.calcular_costo_por_peso)
        btn_calcular.pack(pady=5)

        # Etiqueta para resultado del costo por peso
        self.lbl_resultado = ttk.Label(right_frame, text="", font=('Arial', 10))
        self.lbl_resultado.pack()

    def cargar_treeview(self):
        """Inserta las filas del DataFrame en el treeview izquierdo."""
        for index, row in self.df_productos.iterrows():
            valores = (row['Código'], row['Producto'], row['Precio'], row['Precio_CUP'], row['Precio_USD'], row['Cantidad'], row['Costo_racion'])
            self.tree_productos.insert('', tk.END, values=valores)

    def procesar_seleccion(self):
        """Procesa la selección de productos en modo menú libre."""
        # Limpiar treeview derecho
        for item in self.tree_menu.get_children():
            self.tree_menu.delete(item)

        # Obtener elementos seleccionados en el treeview izquierdo
        seleccionados = self.tree_productos.selection()
        if not seleccionados:
            messagebox.showwarning("Selección vacía", "No has seleccionado ningún producto.")
            return

        self.costo_total = 0.0
        self.costo_usd_total = 0.0  # Nuevo: costo total en USD
        self.precio_total_menu = 0.0  # Nuevo: precio total del menú

        # Modo libre: preguntar cantidad para cada producto
        self.items_libre = []  # Reiniciar lista
        for item in seleccionados:
            valores = self.tree_productos.item(item, 'values')
            # Ahora hay 7 valores: código, producto, precio, precio_cup, precio_usd, cantidad, costo_racion
            codigo, producto, precio_str, precio_cup_str, precio_usd_str, _, _ = valores
            try:
                precio = float(precio_str)
                precio_cup = float(precio_cup_str) if precio_cup_str else 0.0
                precio_usd = float(precio_usd_str) if precio_usd_str else 0.0
            except ValueError:
                messagebox.showerror("Error", f"Precio inválido para {producto}")
                return

            # Pedir cantidad
            cantidad_str = simpledialog.askstring(
                "Cantidad",
                f"Ingrese la cantidad para {producto} (precio unitario: ${precio}):",
                parent=self.root
            )
            if cantidad_str is None:  # Usuario canceló
                return
            try:
                cantidad = float(cantidad_str)
                if cantidad <= 0:
                    raise ValueError
            except ValueError:
                messagebox.showerror("Error", "La cantidad debe ser un número mayor que cero.")
                return

            # Calcular costo de ración (en pesos)
            costo_racion = precio * cantidad
            self.costo_total += costo_racion

            # Calcular costo en USD
            costo_usd = precio_usd * cantidad
            self.costo_usd_total += costo_usd

            # Calcular precio total del menú: ((USD * 120) + CUP) * cantidad
            precio_item = (precio_usd * 120 + precio_cup) * cantidad
            self.precio_total_menu += precio_item

            # Guardar item para modo libre
            item_libre = (codigo, producto, f"{precio:.2f}", f"{cantidad:.2f}", f"{costo_racion:.2f}", f"{precio_usd:.2f}", f"{costo_usd:.2f}")
            self.items_libre.append(item_libre)
            # Insertar en treeview derecho
            self.tree_menu.insert('', tk.END, values=valores[:5] + (f"{cantidad:.2f}", f"{costo_racion:.2f}"))

        # Actualizar etiqueta de costo total
        self.lbl_costo_total.config(text=f"Costo total del menú libre: ${self.costo_total:.2f}")

    def calcular_costo_por_peso(self):
        """Solicita el precio de venta y muestra el costo por peso."""
        if self.costo_total == 0:
            messagebox.showwarning("Costo total cero", "Primero procese una selección con costo total > 0.")
            return

        # Pedir precio de venta
        precio_venta = simpledialog.askfloat("Precio de venta", 
                                              "Ingresa el precio de venta:",
                                              minvalue=0.01)
        if precio_venta is None:  # Usuario canceló
            return

        if precio_venta <= 0:
            messagebox.showerror("Error", "El precio debe ser mayor que cero.")
            return

        costo_por_peso = self.costo_total / precio_venta

        # Calcular porcentaje USD del precio total
        if self.precio_total_menu > 0:
            porcentaje_usd = (self.costo_usd_total * 120) / self.precio_total_menu
        else:
            porcentaje_usd = 0

        # Mostrar resultado
        self.lbl_resultado.config(text=f"Costo por peso: {costo_por_peso:.4f} ({costo_por_peso:.2%})")
        self.lbl_resultado_usd = ttk.Label(self.root, text=f"Costo USD: ${self.costo_usd_total:.2f} ({porcentaje_usd:.2%} del precio)", font=('Arial', 10))
        self.lbl_resultado_usd.pack()

        # --- NUEVO: Generar reporte ---
        # Pedir título del informe
        titulo = simpledialog.askstring("Título del informe", 
                                         "Ingrese el título del informe (ej: pescado frito):")
        if titulo is None:  # Usuario canceló
            return

        # Generar nombre de archivo seguro
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Eliminar caracteres no seguros para nombre de archivo
        safe_titulo = "".join(c for c in titulo if c.isalnum() or c in (' ', '_')).rstrip()
        safe_titulo = safe_titulo.replace(' ', '_')
        if not safe_titulo:
            safe_titulo = "reporte"
        nombre_archivo = f"reporte_{safe_titulo}_{timestamp}.txt"

        # Recopilar datos del menú o plato libre
        menu_items = []
        for item_id in self.tree_menu.get_children():
            valores = self.tree_menu.item(item_id, 'values')
            menu_items.append(valores)

        # Crear contenido del reporte
        lineas = []
        lineas.append(f"Título del informe: {titulo}")
        lineas.append("=" * 50)
        lineas.append("Menú libre:")
        lineas.append("-" * 90)
        # Encabezado de la tabla
        lineas.append(f"{'Código':<15} {'Producto':<40} {'Precio MT':>10} {'Precio CUP':>10} {'Precio USD':>12}")
        lineas.append("-" * 90)
        for item in menu_items:
            # item is a tuple: (Código, Producto, Precio, Precio_CUP, Precio_USD, Cantidad, Costo_racion)
            producto = item[1][:38] + ".." if len(item[1]) > 40 else item[1]
            # Formatear valores con 2 decimales (sin símbolo de moneda)
            precio_mt = f"{float(item[2]):.2f}" if item[2] else "0.00"
            precio_cup = f"{float(item[3]):.2f}" if item[3] else "0.00"
            precio_usd = f"{float(item[4]):.2f}" if item[4] else "0.00"
            # Mostrar: código, producto, precio_mt, precio_cup, precio_usd
            lineas.append(f"{item[0]:<15} {producto:<40} {precio_mt:>10} {precio_cup:>10} {precio_usd:>12}")
        lineas.append("-" * 90)
        # Calcular porcentaje USD
        if self.precio_total_menu > 0:
            porcentaje_usd = (self.costo_usd_total * 120) / self.precio_total_menu
        else:
            porcentaje_usd = 0

        lineas.append(f"Costo total del menú libre: {self.costo_total:.2f}")
        lineas.append(f"Costo total en USD: {self.costo_usd_total:.2f}")
        lineas.append(f"Porcentaje USD del precio: {porcentaje_usd:.2%}")
        lineas.append(f"Precio de venta: {precio_venta:.2f}")
        lineas.append(f"Costo por peso: {costo_por_peso:.4f} ({costo_por_peso:.2%})")
        lineas.append("=" * 50)
        lineas.append("")

        # Escribir el archivo
        try:
            with open(nombre_archivo, 'w', encoding='utf-8') as f:
                f.write("\n".join(lineas))
            messagebox.showinfo("Reporte generado", f"El informe se ha guardado en: {nombre_archivo}\n\n¡Gracias por usar el Calculador de Costo de Menú!\nSi desea realizar otra consulta, por favor reinicie el programa.\nPara cerrar, simplemente cierre la ventana principal.")
        except Exception as e:
            messagebox.showerror("Error al guardar", f"No se pudo guardar el informe: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = MenuCostApp(root)
    root.mainloop()