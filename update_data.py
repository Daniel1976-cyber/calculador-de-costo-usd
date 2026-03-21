import pandas as pd
import json
import os
import math

# Rutas de archivos
EXCEL_FILE = "productos.xlsx"
JSON_OUTPUT = os.path.join("costo-web", "src", "data.json")

def main():
    print(f"Leyendo '{EXCEL_FILE}'...")
    try:
        df = pd.read_excel(EXCEL_FILE)
    except Exception as e:
        print(f"Error al leer '{EXCEL_FILE}': {e}")
        return

    # Limpiar nombres de columnas
    mapeo = {}
    for col in df.columns.tolist():
        col_limpio = col.strip()
        if 'digo' in col_limpio.lower():
            mapeo[col] = 'id'
        elif 'descrip' in col_limpio.lower():
            mapeo[col] = 'nombre'
        elif 'precio mt' in col_limpio.lower() or col_limpio == 'Precio':
            mapeo[col] = 'precio'
        elif 'cup' in col_limpio.lower():
            mapeo[col] = 'precio_cup'
        elif 'usd' in col_limpio.lower():
            mapeo[col] = 'precio_usd'

    df = df.rename(columns=mapeo)
    
    # Asegurar que existan las columnas mínimas
    if 'id' not in df.columns or 'nombre' not in df.columns or 'precio' not in df.columns:
        print("Error: No se encontraron las columnas esperadas (Código, Producto, Precio) en el Excel.")
        return

    productos = []
    
    def safe_float(val):
        if pd.isna(val): return 0.0
        try:
            return float(val)
        except (ValueError, TypeError):
            return 0.0

    for _, row in df.iterrows():
        id_val = str(row['id'])
        if id_val == 'nan' or not id_val.strip():
            continue
            
        precio_val = row['precio']
        precio_cup = row.get('precio_cup', 0.0)
        precio_usd = row.get('precio_usd', 0.0)

        producto = {
            "id": id_val,
            "nombre": str(row['nombre']),
            "precio": safe_float(precio_val),
            "precio_cup": safe_float(precio_cup),
            "precio_usd": safe_float(precio_usd),
            "unidad": "u"
        }
        productos.append(producto)

    # Escribir el JSON
    os.makedirs(os.path.dirname(JSON_OUTPUT), exist_ok=True)
    with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(productos, f, indent=2, ensure_ascii=False)
        
    print(f"Exito: Se han exportado {len(productos)} productos a '{JSON_OUTPUT}'.")

if __name__ == "__main__":
    main()
