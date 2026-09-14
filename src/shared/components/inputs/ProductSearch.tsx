import React, { useState, useRef, useEffect } from "react";
import { Search, Package } from "lucide-react";

export interface ProductItem {
  codigo: string;
  nombre: string;
  presentacion: string;
  unidad: string;
  [key: string]: any;
}

interface ProductSearchProps {
  catalog: ProductItem[];
  onSelect: (product: ProductItem) => void;
  placeholder?: string;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  catalog,
  onSelect,
  placeholder = "Busca por nombre o código (Ej. Jeringa, Paracetamol)...",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<ProductItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filtrado reactivo al escribir
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      setFilteredItems([]);
      setIsOpen(false);
    } else {
      const term = value.toLowerCase();
      const matches = catalog.filter(
        (item) =>
          item.nombre.toLowerCase().includes(term) ||
          item.codigo.toLowerCase().includes(term)
      );
      setFilteredItems(matches);
      setIsOpen(true);
    }
  };

  // Emite el producto seleccionado al padre y limpia el buscador
  const handleItemClick = (item: ProductItem) => {
    onSelect(item);
    setSearchTerm("");
    setIsOpen(false);
  };

  // Cerrar menú flotante al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 w-full max-w-xl" ref={searchRef}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} className="text-gray-400" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => {
          if (searchTerm.trim() !== "") setIsOpen(true);
        }}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {filteredItems.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {filteredItems.map((item, index) => (
                <li
                  key={`${item.codigo}-${index}`}
                  onClick={() => handleItemClick(item)}
                  className="px-4 py-3 hover:bg-blue-50/50 cursor-pointer flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
                    <Package size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">
                      {item.nombre}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.codigo} • {item.presentacion}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No se encontraron resultados para "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;